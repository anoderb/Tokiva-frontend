/**
 * useData.tsx
 * Database Client-side dengan sinkronisasi ke FastAPI Backend & fallback localStorage.
 * Mengelola state Produk, Kategori, Pelanggan, Pemasok, Transaksi, dan Stok.
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { getStatusStok, type Produk, type Kategori, type Pemasok, type HargaTingkat, type StokBatch } from '@/types/produk';

export interface NotifItem {
  id: number;
  key: string;
  tipe: 'stok' | 'expired' | 'sistem';
  judul: string;
  pesan: string;
  waktu: string;
  dibaca: boolean;
  link?: string;
}
import type { Pelanggan } from '@/types/pengguna';
import type { Transaksi } from '@/types/transaksi';
// Mock data imports removed

interface DataContextType {
  produkList: Produk[];
  kategoriList: Kategori[];
  pelangganList: Pelanggan[];
  pemasokList: Pemasok[];
  hargaTingkatList: HargaTingkat[];
  transaksiList: Transaksi[];
  stokBatchList: StokBatch[];
  notificationsList: NotifItem[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: () => void;
  
  // Produk Actions
  tambahProduk: (p: Omit<Produk, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { foto_embedding?: number[] | number[][] | null }) => Promise<{ sukses: boolean; lokal: boolean; pesan: string }>;
  updateProduk: (id: number, p: Partial<Produk> & { foto_embedding?: number[] | number[][] | null }) => Promise<{ sukses: boolean; lokal: boolean; pesan: string }>;
  hapusProduk: (id: number) => Promise<{ sukses: boolean; lokal: boolean; pesan: string }>;

  // Kategori Actions
  tambahKategori: (k: Omit<Kategori, 'id' | 'created_at' | 'updated_at'>) => void;
  updateKategori: (id: number, k: Partial<Kategori>) => void;
  hapusKategori: (id: number) => Promise<{ sukses: boolean; lokal: boolean; pesan: string }>;

  // Pelanggan Actions
  tambahPelanggan: (p: Omit<Pelanggan, 'id' | 'created_at' | 'updated_at'>) => void;
  updatePelanggan: (id: number, p: Partial<Pelanggan>) => void;
  hapusPelanggan: (id: number) => Promise<{ sukses: boolean; lokal: boolean; pesan: string }>;

  // Pemasok Actions
  tambahPemasok: (p: Omit<Pemasok, 'id' | 'created_at' | 'updated_at'>) => void;
  updatePemasok: (id: number, p: Partial<Pemasok>) => void;
  hapusPemasok: (id: number) => Promise<{ sukses: boolean; lokal: boolean; pesan: string }>;

  // Transaksi Actions
  tambahTransaksi: (t: Omit<Transaksi, 'id' | 'created_at' | 'deleted_at'>) => void;

  // Stok Actions
  tambahStokMasuk: (produkId: number, qty: number, hargaBeli: number, supplierId: number | null, expiredDate: string | null, catatan: string | null) => void;
  opnameStok: (produkId: number, qtyFisik: number, catatan: string | null) => void;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_PREFIX = 'tokiva_db_';

export function DataProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [pemasokList, setPemasokList] = useState<Pemasok[]>([]);
  const [hargaTingkatList, setHargaTingkatList] = useState<HargaTingkat[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [stokBatchList, setStokBatchList] = useState<StokBatch[]>([]);
  const [readNotificationKeys, setReadNotificationKeys] = useState<string[]>([]);

  // Authenticated API request helper
  const fetchWithAuth = useCallback(async (path: string, options: RequestInit = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const authDataStr = localStorage.getItem('tokiva_auth');
    let token = '';
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        token = authData.access_token || '';
      } catch {}
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    return fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });
  }, []);

  // Fetch all data from backend to synchronize state
  const loadBackendData = useCallback(async () => {
    try {
      // 1. Fetch Categories
      const katResp = await fetchWithAuth('/api/kategori?limit=100');
      if (katResp.ok) {
        const katJson = await katResp.json();
        if (katJson.sukses && Array.isArray(katJson.data)) {
          setKategoriList(katJson.data);
          localStorage.setItem(STORAGE_PREFIX + 'kategori', JSON.stringify(katJson.data));
        }
      }

      // 2. Fetch Products
      const prodResp = await fetchWithAuth('/api/produk?limit=1000');
      if (prodResp.ok) {
        const prodJson = await prodResp.json();
        if (prodJson.sukses && Array.isArray(prodJson.data)) {
          const localEmbeddingsStr = localStorage.getItem('tokiva_foto_embeddings');
          const localEmbeddings = localEmbeddingsStr ? JSON.parse(localEmbeddingsStr) : {};
          const mergedProducts = prodJson.data.map((p: any) => ({
            ...p,
            foto_embedding: localEmbeddings[p.id] || null
          }));
          setProdukList(mergedProducts);
          // Strip embeddings when saving to local storage product cache
          const baseProducts = prodJson.data.map(({ foto_embedding, ...rest }: any) => rest);
          localStorage.setItem(STORAGE_PREFIX + 'produk', JSON.stringify(baseProducts));
          
          // Sync tiered prices since they are nested in products
          const allHargaTingkat: HargaTingkat[] = [];
          prodJson.data.forEach((p: any) => {
            if (Array.isArray(p.harga_tingkat)) {
              allHargaTingkat.push(...p.harga_tingkat);
            }
          });
          setHargaTingkatList(allHargaTingkat);
          localStorage.setItem(STORAGE_PREFIX + 'harga_tingkat', JSON.stringify(allHargaTingkat));
        }
      }

      // 3. Fetch Suppliers
      const supResp = await fetchWithAuth('/api/supplier?limit=100');
      if (supResp.ok) {
        const supJson = await supResp.json();
        if (supJson.sukses && Array.isArray(supJson.data)) {
          setPemasokList(supJson.data);
          localStorage.setItem(STORAGE_PREFIX + 'pemasok', JSON.stringify(supJson.data));
        }
      }

      // 4. Fetch Members/Pelanggan
      const memResp = await fetchWithAuth('/api/member?limit=1000');
      if (memResp.ok) {
        const memJson = await memResp.json();
        if (memJson.sukses && Array.isArray(memJson.data)) {
          setPelangganList(memJson.data);
          localStorage.setItem(STORAGE_PREFIX + 'pelanggan', JSON.stringify(memJson.data));
        }
      }

      // 5. Fetch Transactions
      const txResp = await fetchWithAuth('/api/transaksi?limit=1000');
      if (txResp.ok) {
        const txJson = await txResp.json();
        if (txJson.sukses && Array.isArray(txJson.data)) {
          setTransaksiList(txJson.data);
          localStorage.setItem(STORAGE_PREFIX + 'transaksi', JSON.stringify(txJson.data));
        }
      }

      // 6. Fetch Stock Batches
      const batchResp = await fetchWithAuth('/api/stok/batches?limit=1000');
      if (batchResp.ok) {
        const batchJson = await batchResp.json();
        if (batchJson.sukses && Array.isArray(batchJson.data)) {
          setStokBatchList(batchJson.data);
          localStorage.setItem(STORAGE_PREFIX + 'stok_batch', JSON.stringify(batchJson.data));
        }
      }
    } catch (err) {
      console.error('Gagal menyinkronkan data dengan backend:', err);
    }
  }, [fetchWithAuth]);

  // Load from localStorage on mount (immediate screen render)
  useEffect(() => {
    try {
      const p = localStorage.getItem(STORAGE_PREFIX + 'produk');
      const localEmbeddingsStr = localStorage.getItem('tokiva_foto_embeddings');
      const localEmbeddings = localEmbeddingsStr ? JSON.parse(localEmbeddingsStr) : {};
      
      const parsedProducts = p ? JSON.parse(p) : [];
      const mergedProducts = parsedProducts.map((prod: any) => ({
        ...prod,
        foto_embedding: localEmbeddings[prod.id] || null
      }));

      const k = localStorage.getItem(STORAGE_PREFIX + 'kategori');
      const m = localStorage.getItem(STORAGE_PREFIX + 'pelanggan');
      const s = localStorage.getItem(STORAGE_PREFIX + 'pemasok');
      const h = localStorage.getItem(STORAGE_PREFIX + 'harga_tingkat');
      const t = localStorage.getItem(STORAGE_PREFIX + 'transaksi');
      const b = localStorage.getItem(STORAGE_PREFIX + 'stok_batch');

      setProdukList(mergedProducts);
      setKategoriList(k ? JSON.parse(k) : []);
      setPelangganList(m ? JSON.parse(m) : []);
      setPemasokList(s ? JSON.parse(s) : []);
      setHargaTingkatList(h ? JSON.parse(h) : []);
      setTransaksiList(t ? JSON.parse(t) : []);
      setStokBatchList(b ? JSON.parse(b) : []);
      
      const rnKeys = localStorage.getItem('tokiva_read_notification_keys');
      setReadNotificationKeys(rnKeys ? JSON.parse(rnKeys) : []);
    } catch (e) {
      console.error('Gagal memuat database local', e);
    } finally {
      setInitialized(true);
    }
  }, []);

  // Sync with backend once initialized and authenticated
  useEffect(() => {
    if (initialized) {
      loadBackendData();
    }
  }, [initialized, loadBackendData]);

  // Save changes to localStorage helper
  const saveToStorage = useCallback((key: string, data: any) => {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  }, []);

  // Dynamic notifications list
  const notificationsList = useMemo(() => {
    const list: NotifItem[] = [];
    let idCounter = 1;
    const hariIni = new Date();
    const batasMendekati = new Date();
    batasMendekati.setDate(hariIni.getDate() + 30);

    produkList.filter(p => !p.deleted_at).forEach((p) => {
      const status = getStatusStok(p);
      
      // Stock warning
      if (status === 'habis') {
        const key = `${p.id}_habis`;
        list.push({
          id: idCounter++,
          key,
          tipe: 'stok',
          judul: 'Stok Habis!',
          pesan: `Produk "${p.nama}" saat ini kehabisan stok (0 ${p.satuan}). Silakan hubungi supplier.`,
          waktu: 'Baru saja',
          dibaca: readNotificationKeys.includes(key),
          link: `/stok/masuk?produk_id=${p.id}`,
        });
      } else if (status === 'rendah') {
        const key = `${p.id}_rendah`;
        list.push({
          id: idCounter++,
          key,
          tipe: 'stok',
          judul: 'Peringatan Stok Rendah',
          pesan: `Stok produk "${p.nama}" tersisa ${p.stok} ${p.satuan} (Batas minimum: ${p.stok_min}).`,
          waktu: '1 jam yang lalu',
          dibaca: readNotificationKeys.includes(key),
          link: `/stok/masuk?produk_id=${p.id}`,
        });
      }

      // Expired date warning
      if (p.expired_date) {
        const expDate = new Date(p.expired_date);
        if (expDate < hariIni) {
          const key = `${p.id}_expired`;
          list.push({
            id: idCounter++,
            key,
            tipe: 'expired',
            judul: 'Produk Kadaluarsa!',
            pesan: `Produk "${p.nama}" telah kadaluarsa pada ${p.expired_date}. Harap segera buang stok fisik.`,
            waktu: '2 jam yang lalu',
            dibaca: readNotificationKeys.includes(key),
            link: `/stok/opname?produk_id=${p.id}`,
          });
        } else if (expDate <= batasMendekati) {
          const key = `${p.id}_nearexpired`;
          list.push({
            id: idCounter++,
            key,
            tipe: 'expired',
            judul: 'Mendekati Kadaluarsa',
            pesan: `Produk "${p.nama}" akan kadaluarsa pada ${p.expired_date} (dalam waktu dekat).`,
            waktu: 'Kemarin',
            dibaca: readNotificationKeys.includes(key),
            link: `/stok/opname?produk_id=${p.id}`,
          });
        }
      }
    });

    // Default system notification if list is empty
    if (list.length === 0) {
      const key = 'system_ready';
      list.push({
        id: idCounter++,
        key,
        tipe: 'sistem',
        judul: 'Sistem Siap',
        pesan: 'Database local tersinkronisasi. Semua status produk aman.',
        waktu: '1 hari yang lalu',
        dibaca: readNotificationKeys.includes(key),
      });
    }

    return list;
  }, [produkList, readNotificationKeys]);

  // Compute unread count
  const unreadNotificationsCount = useMemo(() => {
    return notificationsList.filter((n) => !n.dibaca).length;
  }, [notificationsList]);

  // Mark all notifications as read
  const markNotificationsAsRead = useCallback(() => {
    const list: string[] = [];
    const hariIni = new Date();
    const batasMendekati = new Date();
    batasMendekati.setDate(hariIni.getDate() + 30);

    produkList.filter(p => !p.deleted_at).forEach((p) => {
      const status = getStatusStok(p);
      
      if (status === 'habis') {
        list.push(`${p.id}_habis`);
      } else if (status === 'rendah') {
        list.push(`${p.id}_rendah`);
      }

      if (p.expired_date) {
        const expDate = new Date(p.expired_date);
        if (expDate < hariIni) {
          list.push(`${p.id}_expired`);
        } else if (expDate <= batasMendekati) {
          list.push(`${p.id}_nearexpired`);
        }
      }
    });

    if (list.length === 0) {
      list.push('system_ready');
    }

    setReadNotificationKeys(list);
    localStorage.setItem('tokiva_read_notification_keys', JSON.stringify(list));
  }, [produkList]);

  const uploadImagesIfNeeded = useCallback(async (fotoUrlStr: string | null, prefix: string): Promise<string | null> => {
    if (!fotoUrlStr) return null;
    try {
      let urls: string[] = [];
      if (fotoUrlStr.startsWith('[')) {
        urls = JSON.parse(fotoUrlStr);
      } else {
        urls = [fotoUrlStr];
      }

      const base64Images = urls.filter(url => url.startsWith('data:'));
      if (base64Images.length === 0) {
        return fotoUrlStr;
      }

      const response = await fetchWithAuth('/api/upload/produk', {
        method: 'POST',
        body: JSON.stringify({ images: base64Images, prefix }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.sukses && json.data && json.data.urls) {
          let base64Index = 0;
          const uploadedUrls = json.data.urls;
          const finalUrls = urls.map(url => {
            if (url.startsWith('data:')) {
              return uploadedUrls[base64Index++];
            }
            return url;
          });
          return finalUrls.length === 1 ? finalUrls[0] : JSON.stringify(finalUrls);
        }
      }
    } catch (err) {
      console.error("Gagal mengunggah gambar ke Supabase:", err);
    }
    return fotoUrlStr;
  }, [fetchWithAuth]);

  // Produk Actions
  const tambahProduk = useCallback(async (p: Omit<Produk, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { foto_embedding?: number[] | number[][] | null }) => {
    const { foto_embedding, ...rest } = p;
    
    let uploadStatus = "";
    if (rest.foto_url) {
      try {
        const uploadedUrl = await uploadImagesIfNeeded(rest.foto_url, rest.kode);
        if (uploadedUrl && uploadedUrl !== rest.foto_url) {
          uploadStatus = " (Foto terunggah ke Supabase)";
        }
        rest.foto_url = uploadedUrl;
      } catch (err) {
        console.error("Gagal memproses upload foto:", err);
        uploadStatus = " (Gagal upload foto ke Supabase)";
      }
    }

    let newId = 0;
    try {
      const resp = await fetchWithAuth('/api/produk', {
        method: 'POST',
        body: JSON.stringify(rest),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.sukses && json.data && json.data.id) {
          newId = json.data.id;
        }
        await loadBackendData();

        if (newId && foto_embedding) {
          const localEmbeddingsStr = localStorage.getItem('tokiva_foto_embeddings');
          const localEmbeddings = localEmbeddingsStr ? JSON.parse(localEmbeddingsStr) : {};
          localEmbeddings[newId] = foto_embedding;
          localStorage.setItem('tokiva_foto_embeddings', JSON.stringify(localEmbeddings));

          setProdukList((prev) => prev.map(prod => prod.id === newId ? { ...prod, foto_embedding } : prod));
        }
        return { sukses: true, lokal: false, pesan: "Produk berhasil ditambahkan ke cloud" + uploadStatus };
      }
    } catch (e) {
      console.error('Gagal tambah produk ke backend, fallback ke lokal:', e);
    }

    setProdukList((prev) => {
      const generatedId = prev.length > 0 ? Math.max(...prev.map((item) => item.id)) + 1 : 1;
      const now = new Date().toISOString();
      const newProduk: Produk = {
        ...rest,
        id: generatedId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      if (foto_embedding) {
        const localEmbeddingsStr = localStorage.getItem('tokiva_foto_embeddings');
        const localEmbeddings = localEmbeddingsStr ? JSON.parse(localEmbeddingsStr) : {};
        localEmbeddings[generatedId] = foto_embedding;
        localStorage.setItem('tokiva_foto_embeddings', JSON.stringify(localEmbeddings));
        newProduk.foto_embedding = foto_embedding;
      }

      const updated = [...prev, newProduk];
      saveToStorage('produk', updated);
      return updated;
    });
    return { sukses: true, lokal: true, pesan: "Koneksi offline. Produk disimpan lokal di browser" + uploadStatus };
  }, [saveToStorage, fetchWithAuth, loadBackendData, uploadImagesIfNeeded]);

  const updateProduk = useCallback(async (id: number, p: Partial<Produk> & { foto_embedding?: number[] | number[][] | null }) => {
    const { foto_embedding, ...rest } = p;
    
    let uploadStatus = "";
    if (rest.foto_url) {
      try {
        const existingProd = produkList.find(pr => pr.id === id);
        const prefix = rest.kode || existingProd?.kode || "prod";
        const uploadedUrl = await uploadImagesIfNeeded(rest.foto_url, prefix);
        if (uploadedUrl && uploadedUrl !== rest.foto_url) {
          uploadStatus = " (Foto diperbarui ke Supabase)";
        }
        rest.foto_url = uploadedUrl;
      } catch (err) {
        console.error("Gagal memproses upload foto:", err);
        uploadStatus = " (Gagal upload foto ke Supabase)";
      }
    }

    try {
      const resp = await fetchWithAuth(`/api/produk/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rest),
      });
      if (resp.ok) {
        await loadBackendData();
        
        if (foto_embedding) {
          const localEmbeddingsStr = localStorage.getItem('tokiva_foto_embeddings');
          const localEmbeddings = localEmbeddingsStr ? JSON.parse(localEmbeddingsStr) : {};
          localEmbeddings[id] = foto_embedding;
          localStorage.setItem('tokiva_foto_embeddings', JSON.stringify(localEmbeddings));

          setProdukList((prev) => prev.map(prod => prod.id === id ? { ...prod, foto_embedding } : prod));
        }
        return { sukses: true, lokal: false, pesan: "Produk berhasil diperbarui di cloud" + uploadStatus };
      }
    } catch (e) {
      console.error('Gagal update produk ke backend, fallback ke lokal:', e);
    }

    setProdukList((prev) => {
      const now = new Date().toISOString();
      
      if (foto_embedding) {
        const localEmbeddingsStr = localStorage.getItem('tokiva_foto_embeddings');
        const localEmbeddings = localEmbeddingsStr ? JSON.parse(localEmbeddingsStr) : {};
        localEmbeddings[id] = foto_embedding;
        localStorage.setItem('tokiva_foto_embeddings', JSON.stringify(localEmbeddings));
      }

      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...rest, foto_embedding: foto_embedding || item.foto_embedding, updated_at: now } : item
      );
      saveToStorage('produk', updated);
      return updated;
    });
    return { sukses: true, lokal: true, pesan: "Koneksi offline. Perubahan disimpan lokal di browser" + uploadStatus };
  }, [saveToStorage, fetchWithAuth, loadBackendData, produkList, uploadImagesIfNeeded]);

  const hapusProduk = useCallback(async (id: number) => {
    try {
      const resp = await fetchWithAuth(`/api/produk/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        await loadBackendData();
        return { sukses: true, lokal: false, pesan: "Produk berhasil dihapus dari database" };
      } else {
        const errJson = await resp.json().catch(() => null);
        const errMsg = errJson?.pesan || 'Gagal menghapus produk dari database';
        return { sukses: false, lokal: false, pesan: errMsg };
      }
    } catch (e) {
      console.error('Gagal hapus produk dari backend, fallback ke lokal:', e);
    }

    setProdukList((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((item) =>
        item.id === id ? { ...item, deleted_at: now, is_aktif: false } : item
      );
      saveToStorage('produk', updated);
      return updated;
    });
    return { sukses: true, lokal: true, pesan: "Koneksi offline. Produk dihapus secara lokal" };
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  // Kategori Actions
  const tambahKategori = useCallback(async (k: Omit<Kategori, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const resp = await fetchWithAuth('/api/kategori', {
        method: 'POST',
        body: JSON.stringify(k),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal tambah kategori ke backend, fallback ke lokal:', e);
    }

    setKategoriList((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((item) => item.id)) + 1 : 1;
      const now = new Date().toISOString();
      const newKat: Kategori = {
        ...k,
        id: newId,
        created_at: now,
        updated_at: now,
      };
      const updated = [...prev, newKat];
      saveToStorage('kategori', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  const updateKategori = useCallback(async (id: number, k: Partial<Kategori>) => {
    try {
      const resp = await fetchWithAuth(`/api/kategori/${id}`, {
        method: 'PUT',
        body: JSON.stringify(k),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal update kategori ke backend, fallback ke lokal:', e);
    }

    setKategoriList((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...k, updated_at: now } : item
      );
      saveToStorage('kategori', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  const hapusKategori = useCallback(async (id: number) => {
    try {
      const resp = await fetchWithAuth(`/api/kategori/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        await loadBackendData();
        return { sukses: true, lokal: false, pesan: "Kategori berhasil dihapus dari database" };
      } else {
        const errJson = await resp.json().catch(() => null);
        const errMsg = errJson?.pesan || 'Gagal menghapus kategori dari database';
        return { sukses: false, lokal: false, pesan: errMsg };
      }
    } catch (e) {
      console.error('Gagal hapus kategori dari backend, fallback ke lokal:', e);
    }

    setKategoriList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage('kategori', updated);
      return updated;
    });
    return { sukses: true, lokal: true, pesan: "Koneksi offline. Kategori dihapus secara lokal" };
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  // Pelanggan Actions
  const tambahPelanggan = useCallback(async (p: Omit<Pelanggan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const resp = await fetchWithAuth('/api/member', {
        method: 'POST',
        body: JSON.stringify(p),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal tambah pelanggan ke backend, fallback ke lokal:', e);
    }

    setPelangganList((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((item) => item.id)) + 1 : 1;
      const now = new Date().toISOString();
      const newPel: Pelanggan = {
        ...p,
        id: newId,
        created_at: now,
        updated_at: now,
      };
      const updated = [...prev, newPel];
      saveToStorage('pelanggan', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  const updatePelanggan = useCallback(async (id: number, p: Partial<Pelanggan>) => {
    try {
      const resp = await fetchWithAuth(`/api/member/${id}`, {
        method: 'PUT',
        body: JSON.stringify(p),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal update pelanggan ke backend, fallback ke lokal:', e);
    }

    setPelangganList((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...p, updated_at: now } : item
      );
      saveToStorage('pelanggan', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  // Pemasok Actions
  const tambahPemasok = useCallback(async (p: Omit<Pemasok, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const resp = await fetchWithAuth('/api/supplier', {
        method: 'POST',
        body: JSON.stringify(p),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal tambah pemasok ke backend, fallback ke lokal:', e);
    }

    setPemasokList((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((item) => item.id)) + 1 : 1;
      const now = new Date().toISOString();
      const newPem: Pemasok = {
        ...p,
        id: newId,
        created_at: now,
        updated_at: now,
      };
      const updated = [...prev, newPem];
      saveToStorage('pemasok', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  const updatePemasok = useCallback(async (id: number, p: Partial<Pemasok>) => {
    try {
      const resp = await fetchWithAuth(`/api/supplier/${id}`, {
        method: 'PUT',
        body: JSON.stringify(p),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal update pemasok ke backend, fallback ke lokal:', e);
    }

    setPemasokList((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...p, updated_at: now } : item
      );
      saveToStorage('pemasok', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  // Hapus Pemasok
  const hapusPemasok = useCallback(async (id: number) => {
    try {
      const resp = await fetchWithAuth(`/api/supplier/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        await loadBackendData();
        return { sukses: true, lokal: false, pesan: "Supplier berhasil dihapus dari database" };
      } else {
        const errJson = await resp.json().catch(() => null);
        const errMsg = errJson?.pesan || 'Gagal menghapus supplier dari database';
        return { sukses: false, lokal: false, pesan: errMsg };
      }
    } catch (e) {
      console.error('Gagal hapus pemasok dari backend, fallback ke lokal:', e);
    }

    setPemasokList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage('pemasok', updated);
      return updated;
    });
    return { sukses: true, lokal: true, pesan: "Koneksi offline. Supplier dihapus secara lokal" };
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  // Hapus Pelanggan
  const hapusPelanggan = useCallback(async (id: number) => {
    try {
      const resp = await fetchWithAuth(`/api/member/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        await loadBackendData();
        return { sukses: true, lokal: false, pesan: "Member berhasil dihapus dari database" };
      } else {
        const errJson = await resp.json().catch(() => null);
        const errMsg = errJson?.pesan || 'Gagal menghapus member dari database';
        return { sukses: false, lokal: false, pesan: errMsg };
      }
    } catch (e) {
      console.error('Gagal hapus pelanggan dari backend, fallback ke lokal:', e);
    }

    setPelangganList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage('pelanggan', updated);
      return updated;
    });
    return { sukses: true, lokal: true, pesan: "Koneksi offline. Member dihapus secara lokal" };
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  // Transaksi Actions
  const tambahTransaksi = useCallback(async (t: Omit<Transaksi, 'id' | 'created_at' | 'deleted_at'>) => {
    try {
      const items = t.detail?.map((d) => ({
        produk_id: d.produk_id,
        qty: d.qty,
        diskon_id: d.diskon_id,
      })) || [];
      const pembayaran = t.pembayaran?.map((p) => ({
        metode: p.metode,
        nominal: p.nominal,
        referensi: p.referensi,
      })) || [];

      const resp = await fetchWithAuth('/api/transaksi', {
        method: 'POST',
        body: JSON.stringify({
          member_id: t.member_id,
          items,
          pembayaran,
          catatan: t.catatan,
          local_id: t.local_id,
        }),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal tambah transaksi ke backend, fallback ke lokal:', e);
    }

    const now = new Date().toISOString();
    const newId = Date.now(); // local numeric ID
    const newTx: Transaksi = {
      ...t,
      id: newId,
      created_at: now,
      deleted_at: null,
    };
    
    // Simpan Transaksi Lokal
    setTransaksiList((prev) => {
      const updated = [newTx, ...prev];
      saveToStorage('transaksi', updated);
      return updated;
    });

    // Update Stok Produk Lokal
    setProdukList((prevProduk) => {
      const updatedProduk = prevProduk.map((p) => {
        const detailItem = t.detail?.find((d) => d.produk_id === p.id);
        if (detailItem) {
          return {
            ...p,
            stok: Math.max(0, p.stok - detailItem.qty),
            updated_at: now,
          };
        }
        return p;
      });
      saveToStorage('produk', updatedProduk);
      return updatedProduk;
    });

    // Update Poin member & total bon Lokal jika status bon
    if (t.member_id) {
      setPelangganList((prevPel) => {
        const updatedPel = prevPel.map((m) => {
          if (m.id === t.member_id) {
            const tambahPoin = Math.floor(t.total / 10000); // 1 poin per Rp 10.000
            const tambahBon = t.status === 'bon' ? t.total - t.bayar : 0;
            return {
              ...m,
              total_poin: m.total_poin + tambahPoin,
              total_bon: m.total_bon + tambahBon,
              updated_at: now,
            };
          }
          return m;
        });
        saveToStorage('pelanggan', updatedPel);
        return updatedPel;
      });
    }
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  // Stok Actions
  const tambahStokMasuk = useCallback(async (
    produkId: number,
    qty: number,
    hargaBeli: number,
    supplierId: number | null,
    expiredDate: string | null,
    catatan: string | null
  ) => {
    try {
      const resp = await fetchWithAuth('/api/stok/masuk', {
        method: 'POST',
        body: JSON.stringify({
          produk_id: produkId,
          qty,
          harga_beli: hargaBeli,
          supplier_id: supplierId,
          expired_date: expiredDate,
          catatan,
        }),
      });
      if (resp.ok) {
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal tambah stok masuk ke backend, fallback ke lokal:', e);
    }

    const now = new Date().toISOString();
    
    // 1. Tambah Batch Baru Lokal
    setStokBatchList((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((b) => b.id)) + 1 : 1;
      const batchNo = `B-${Date.now().toString().slice(-6)}`;
      const newBatch: StokBatch = {
        id: newId,
        produk_id: produkId,
        batch_no: batchNo,
        qty_masuk: qty,
        qty_sisa: qty,
        harga_beli: hargaBeli,
        expired_date: expiredDate,
        supplier_id: supplierId,
        catatan,
        created_at: now,
      };
      const updated = [newBatch, ...prev];
      saveToStorage('stok_batch', updated);
      return updated;
    });

    // 2. Update Stok & Harga Beli Produk Lokal
    setProdukList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === produkId) {
          return {
            ...p,
            stok: p.stok + qty,
            harga_beli: hargaBeli,
            expired_date: expiredDate || p.expired_date,
            updated_at: now,
          };
        }
        return p;
      });
      saveToStorage('produk', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  const opnameStok = useCallback(async (produkId: number, qtyFisik: number, catatan: string | null) => {
    try {
      const resp = await fetchWithAuth('/api/stok/opname', {
        method: 'POST',
        body: JSON.stringify({
          produk_id: produkId,
          stok_fisik: qtyFisik,
          alasan: catatan,
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.sukses && json.data?.id) {
          // Otomatis setujui draft opname di development
          await fetchWithAuth(`/api/stok/opname/${json.data.id}/approve`, {
            method: 'POST',
          });
        }
        await loadBackendData();
        return;
      }
    } catch (e) {
      console.error('Gagal stok opname ke backend, fallback ke lokal:', e);
    }

    const now = new Date().toISOString();
    setProdukList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === produkId) {
          return {
            ...p,
            stok: qtyFisik,
            updated_at: now,
          };
        }
        return p;
      });
      saveToStorage('produk', updated);
      return updated;
    });
  }, [saveToStorage, fetchWithAuth, loadBackendData]);

  if (!initialized) {
    return null; // Menghindari hydration mismatch
  }

  return (
    <DataContext.Provider
      value={{
        produkList,
        kategoriList,
        pelangganList,
        pemasokList,
        hargaTingkatList,
        transaksiList,
        stokBatchList,
        notificationsList,
        unreadNotificationsCount,
        markNotificationsAsRead,
        tambahProduk,
        updateProduk,
        hapusProduk,
        tambahKategori,
        updateKategori,
        hapusKategori,
        tambahPelanggan,
        updatePelanggan,
        hapusPelanggan,
        tambahPemasok,
        updatePemasok,
        hapusPemasok,
        tambahTransaksi,
        tambahStokMasuk,
        opnameStok,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData harus digunakan di dalam DataProvider');
  }
  return context;
}
