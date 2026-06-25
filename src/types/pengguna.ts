/**
 * pengguna.ts
 * Definisi tipe data untuk pengguna (user), autentikasi, dan member.
 */

export type RolePengguna = 'admin' | 'kasir';

export interface Pengguna {
  id: number;
  nama: string;
  username: string;
  role: RolePengguna;
  nomor_hp: string | null;
  foto_url: string | null;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  sukses: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    pengguna: Pengguna;
  } | null;
  pesan: string;
}

export interface Pelanggan {
  id: number;
  kode: string;
  nama: string;
  nomor_hp: string;
  alamat: string | null;
  total_poin: number;
  limit_bon: number;
  total_bon: number;
  foto_url: string | null;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notifikasi {
  id: number;
  user_id: number | null;
  tipe: 'stok_rendah' | 'stok_habis' | 'expired' | 'bon_jatuh_tempo' | 'shift_tutup' | 'transaksi_void' | 'info';
  judul: string;
  pesan: string;
  referensi_id: number | null;
  is_dibaca: boolean;
  was_sent: boolean;
  created_at: string;
}
