/**
 * produk.ts
 * Definisi tipe data untuk produk, kategori, dan harga bertingkat.
 */

export interface Kategori {
  id: number;
  nama: string;
  icon: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pemasok {
  id: number;
  nama: string;
  kontak: string | null;
  nomor_hp: string | null;
  alamat: string | null;
  hutang: number;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export type TingkatHarga = 'ecer' | 'grosir' | 'partai';

export interface HargaTingkat {
  id: number;
  produk_id: number;
  tingkat: TingkatHarga;
  min_qty: number;
  harga: number;
  created_at: string;
}

export interface StokBatch {
  id: number;
  produk_id: number;
  batch_no: string | null;
  qty_masuk: number;
  qty_sisa: number;
  harga_beli: number;
  expired_date: string | null;
  supplier_id: number | null;
  catatan: string | null;
  created_at: string;
}

export interface Produk {
  id: number;
  kode: string;
  barcode: string | null;
  nama: string;
  kategori_id: number;
  supplier_id: number | null;
  satuan: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  stok_min: number;
  expired_date: string | null;
  foto_url: string | null;
  qr_url: string | null;
  deskripsi: string | null;
  is_ecer: boolean;
  is_aktif: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relasi (opsional, loaded saat butuh)
  kategori?: Kategori;
  pemasok?: Pemasok;
  harga_tingkat?: HargaTingkat[];
  stok_batch?: StokBatch[];
}

export type StatusStok = 'ok' | 'rendah' | 'habis' | 'expired';

export function getStatusStok(produk: Produk): StatusStok {
  if (produk.expired_date && new Date(produk.expired_date) < new Date()) {
    return 'expired';
  }
  if (produk.stok <= 0) return 'habis';
  if (produk.stok <= produk.stok_min) return 'rendah';
  return 'ok';
}
