import { db } from './db';

/**
 * processSyncQueue
 * Mengirimkan data antrian lokal (pendingSync) ke API backend.
 * Mengikuti urutan: DELETE -> CREATE -> UPDATE untuk mencegah konflik foreign key.
 */
export async function processSyncQueue(): Promise<boolean> {
  const queue = await db.pendingSync.orderBy('createdAt').toArray();
  if (queue.length === 0) return true;

  // Sorting: DELETE (0), CREATE (1), UPDATE (2)
  const ordered = queue.sort((a, b) => {
    const priority: Record<string, number> = { DELETE: 0, CREATE: 1, UPDATE: 2 };
    return priority[a.action] - priority[b.action];
  });

  const authDataStr = localStorage.getItem('tokiva_auth');
  let token = '';
  if (authDataStr) {
    try {
      const authData = JSON.parse(authDataStr);
      token = authData.access_token || '';
    } catch {}
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  for (const item of ordered) {
    try {
      let resp;
      
      const routeMap: Record<string, string> = {
        produk: 'produk',
        kategori: 'kategori',
        pelanggan: 'member',
        pemasok: 'supplier',
        transaksi: 'transaksi'
      };

      const routeName = routeMap[item.table];
      if (!routeName) {
        console.error(`Unknown table during sync: ${item.table}`);
        await db.pendingSync.delete(item.id!);
        continue;
      }

      if (item.action === 'CREATE') {
        resp = await fetch(`${baseUrl}/api/${routeName}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(item.data),
        });
      } else if (item.action === 'UPDATE') {
        resp = await fetch(`${baseUrl}/api/${routeName}/${item.recordId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(item.data),
        });
      } else if (item.action === 'DELETE') {
        resp = await fetch(`${baseUrl}/api/${routeName}/${item.recordId}`, {
          method: 'DELETE',
          headers,
        });
      }

      if (resp && resp.ok) {
        // Hapus dari antrian sync
        await db.pendingSync.delete(item.id!);

        if (item.action === 'DELETE') {
          // Hapus dari database lokal jika sebelumnya cuma soft-delete
          const idNum = parseInt(item.recordId || '');
          if (!isNaN(idNum)) {
            await (db as any)[item.table].delete(idNum);
          }
        } else {
          // Update database lokal dengan ID / data akhir dari server
          const serverData = await resp.json();
          if (serverData.sukses && serverData.data) {
            const idNum = parseInt(item.recordId || '');
            if (!isNaN(idNum)) {
              await (db as any)[item.table].delete(idNum);
            }
            await (db as any)[item.table].put({ ...serverData.data, pending_sync: false });
          }
        }
      } else if (resp && resp.status === 409) {
        // Konflik: Server punya versi lebih baru atau konflik data.
        // Hapus dari antrian, biarkan pullFromBackend menimpa dengan data terbaru dari server
        await db.pendingSync.delete(item.id!);
      } else {
        console.warn(`Sync failed: status ${resp?.status} untuk ${item.action} pada ${item.table}`);
        return false; // Berhenti memproses queue jika gagal, coba lagi nanti
      }
    } catch (err) {
      console.error(`Gagal menghubungkan ke backend untuk sync:`, err);
      return false; // Masalah koneksi, berhenti memproses queue
    }
  }

  return true;
}

/**
 * pullAndStoreAll
 * Mengambil seluruh data terbaru dari server (via aggregated sync endpoint)
 * lalu menyimpannya ke Dexie DB secara atomic.
 */
export async function pullAndStoreAll(): Promise<boolean> {
  const pendingCount = await db.pendingSync.count();
  if (pendingCount > 0) {
    console.warn(`Menolak pull data dari backend karena masih ada ${pendingCount} antrian sync pending.`);
    return false;
  }

  const authDataStr = localStorage.getItem('tokiva_auth');
  let token = '';
  if (authDataStr) {
    try {
      const authData = JSON.parse(authDataStr);
      token = authData.access_token || '';
    } catch {}
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  try {
    const resp = await fetch(`${baseUrl}/api/sync?tables=produk,kategori,member,supplier,transaksi,stok_batch`, { headers });
    if (resp.ok) {
      const json = await resp.json();
      if (json.sukses && json.data) {
        const { produk, kategori, member, supplier, transaksi, stok_batch } = json.data;

        // Simpan semua data di Dexie dalam 1 transaksi DB agar atomic dan aman
        await db.transaction('rw', [db.kategori, db.pemasok, db.pelanggan, db.produk, db.hargaTingkat, db.transaksi, db.stokBatch], async () => {
          if (kategori) {
            await db.kategori.clear();
            await db.kategori.bulkPut(kategori.map((k: any) => ({ ...k, pending_sync: false })));
          }

          if (supplier) {
            await db.pemasok.clear();
            await db.pemasok.bulkPut(supplier.map((s: any) => ({ ...s, pending_sync: false })));
          }

          if (member) {
            await db.pelanggan.clear();
            await db.pelanggan.bulkPut(member.map((m: any) => ({ ...m, pending_sync: false })));
          }

          if (produk) {
            const baseProducts = produk.map(({ foto_embedding, ...rest }: any) => rest);
            await db.produk.clear();
            await db.produk.bulkPut(baseProducts.map((p: any) => ({ ...p, pending_sync: false })));

            const allHargaTingkat: any[] = [];
            produk.forEach((p: any) => {
              if (Array.isArray(p.harga_tingkat)) {
                allHargaTingkat.push(...p.harga_tingkat);
              }
            });
            await db.hargaTingkat.clear();
            await db.hargaTingkat.bulkPut(allHargaTingkat);
          }

          if (transaksi) {
            await db.transaksi.clear();
            await db.transaksi.bulkPut(transaksi.map((t: any) => ({ ...t, pending_sync: false })));
          }

          if (stok_batch) {
            await db.stokBatch.clear();
            await db.stokBatch.bulkPut(stok_batch.map((b: any) => ({ ...b, pending_sync: false })));
          }
        });

        return true;
      }
    }
  } catch (err) {
    console.error('Gagal memproses pullAndStoreAll dari server:', err);
  }
  return false;
}
