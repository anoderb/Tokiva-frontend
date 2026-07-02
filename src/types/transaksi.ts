/**
 * transaksi.ts
 * Definisi tipe data untuk transaksi, pembayaran, keranjang, bon, dan shift.
 */

export type StatusTransaksi = 'lunas' | 'bon' | 'void';
export type MetodePembayaran = 'tunai' | 'qris' | 'transfer' | 'bon' | 'voucher';
export type StatusBon = 'aktif' | 'lunas' | 'macet';
export type StatusShift = 'buka' | 'tutup';

/** Item di dalam keranjang belanja (client-side) */
export interface ItemKeranjang {
  produk_id: number;
  nama_produk: string;
  foto_url: string | null;
  qty: number;
  satuan: string;
  harga_satuan: number;
  diskon_item: number;
  subtotal: number;
  diskon_id: number | null;
  batch_id: number | null;
  stok_tersedia: number;
}

/** Transaksi yang tersimpan */
export interface Transaksi {
  id: number;
  no_transaksi: string;
  shift_id: number;
  user_id: number;
  member_id: number | null;
  tanggal: string;
  waktu: string;
  subtotal: number;
  diskon_total: number;
  diskon_member: number;
  pajak: number;
  total: number;
  bayar: number;
  kembalian: number;
  status: StatusTransaksi;
  is_synced: boolean;
  sync_at: string | null;
  local_id: string | null;
  catatan: string | null;
  created_at: string;
  deleted_at: string | null;
  // Relasi
  detail?: TransaksiDetail[];
  pembayaran?: Pembayaran[];
  nama_kasir?: string;
  nama_member?: string;
  metode_pembayaran?: string;
}

/** Detail item di dalam transaksi */
export interface TransaksiDetail {
  id: number;
  transaksi_id: number;
  produk_id: number;
  nama_produk: string;
  qty: number;
  satuan: string;
  harga_satuan: number;
  diskon_item: number;
  subtotal: number;
  diskon_id: number | null;
  batch_id: number | null;
  created_at: string;
}

/** Pembayaran per metode */
export interface Pembayaran {
  id?: number;
  transaksi_id?: number;
  metode: MetodePembayaran;
  nominal: number;
  referensi: string | null;
  created_at?: string;
}

/** Bon / Piutang */
export interface Bon {
  id: number;
  transaksi_id: number;
  member_id: number;
  total_bon: number;
  sisa_bon: number;
  jatuh_tempo: string | null;
  status: StatusBon;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  // Relasi
  nama_member?: string;
  cicilan?: BonCicilan[];
}

/** Cicilan bon */
export interface BonCicilan {
  id: number;
  bon_id: number;
  nominal: number;
  metode: 'tunai' | 'transfer';
  user_id: number;
  created_at: string;
}

/** Shift kasir */
export interface Shift {
  id: number;
  user_id: number;
  kode: string;
  modal_awal: number;
  waktu_buka: string;
  waktu_tutup: string | null;
  total_transaksi: number;
  total_tunai: number;
  total_qris: number;
  total_transfer: number;
  total_bon: number;
  total_diskon: number;
  total_selisih: number;
  status: StatusShift;
  catatan: string | null;
  // Relasi
  nama_kasir?: string;
}

/** Hasil kalkulasi total transaksi */
export interface KalkulasiTotal {
  subtotal: number;
  diskon_item: number;
  diskon_total: number;
  diskon_member: number;
  pajak: number;
  total: number;
}
