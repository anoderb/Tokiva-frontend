import Dexie, { type Table } from 'dexie';

export interface PendingSyncItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  recordId?: string; // string representation of local or server id
  data: any;
  createdAt: number;
}

export class TokivaDB extends Dexie {
  produk!: Table<any>;
  kategori!: Table<any>;
  pelanggan!: Table<any>; // 'member' in DB, but 'pelanggan' in frontend useData.tsx
  pemasok!: Table<any>;   // 'supplier' in DB, but 'pemasok' in frontend useData.tsx
  transaksi!: Table<any>;
  stokBatch!: Table<any>;
  hargaTingkat!: Table<any>;
  pendingSync!: Table<PendingSyncItem>;

  constructor() {
    super('tokiva');
    this.version(1).stores({
      produk: '++id, kode, barcode, nama, kategori_id, is_aktif, pending_sync',
      kategori: '++id, nama, pending_sync',
      pelanggan: '++id, kode, nomor_hp, pending_sync',
      pemasok: '++id, nama, pending_sync',
      transaksi: '++id, no_transaksi, tanggal, local_id, pending_sync',
      stokBatch: '++id, produk_id, expired_date, pending_sync',
      hargaTingkat: '++id, produk_id',
      pendingSync: '++id, action, table, createdAt',
    });
  }
}

export const db = new TokivaDB();
