/**
 * data/pengguna.ts
 * Data mock untuk pengguna dan pelanggan (member).
 */

import type { Pengguna } from '@/types/pengguna';
import type { Pelanggan } from '@/types/pengguna';
import type { Pemasok } from '@/types/produk';

export const dataPengguna: Pengguna[] = [
  {
    id: 1,
    nama: 'Budi Santoso',
    username: 'admin',
    role: 'admin',
    nomor_hp: '081234567890',
    foto_url: null,
    aktif: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 2,
    nama: 'Ani Wulandari',
    username: 'ani',
    role: 'kasir',
    nomor_hp: '085678901234',
    foto_url: null,
    aktif: true,
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 3,
    nama: 'Citra Dewi',
    username: 'citra',
    role: 'kasir',
    nomor_hp: '087890123456',
    foto_url: null,
    aktif: false,
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-06-17T10:00:00Z',
  },
];

/** Password mock: admin→admin123, ani→kasir123, citra→kasir123 */
export const PASSWORD_MOCK: Record<string, string> = {
  admin: 'admin123',
  ani: 'kasir123',
  citra: 'kasir123',
};

export const dataPelanggan: Pelanggan[] = [
  {
    id: 1, kode: 'TKV-M001', nama: 'Budi Prasetyo',
    nomor_hp: '081298765432', alamat: 'Jl. Merdeka No. 10, Batang',
    total_poin: 150, limit_bon: 500000, total_bon: 250000,
    foto_url: null, aktif: true,
    created_at: '2026-02-01T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 2, kode: 'TKV-M002', nama: 'Ani Suryani',
    nomor_hp: '085612345678', alamat: 'Jl. Sudirman No. 5, Batang',
    total_poin: 320, limit_bon: 300000, total_bon: 100000,
    foto_url: null, aktif: true,
    created_at: '2026-02-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 3, kode: 'TKV-M003', nama: 'Joko Widodo',
    nomor_hp: '087812345678', alamat: 'Jl. Diponegoro No. 15, Batang',
    total_poin: 50, limit_bon: 200000, total_bon: 150000,
    foto_url: null, aktif: true,
    created_at: '2026-03-01T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 4, kode: 'TKV-M004', nama: 'Siti Aminah',
    nomor_hp: '081387654321', alamat: null,
    total_poin: 85, limit_bon: 0, total_bon: 0,
    foto_url: null, aktif: true,
    created_at: '2026-04-01T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 5, kode: 'TKV-M005', nama: 'Rudi Hartono',
    nomor_hp: '085787654321', alamat: 'Jl. Gatot Subroto No. 8, Batang',
    total_poin: 210, limit_bon: 400000, total_bon: 0,
    foto_url: null, aktif: true,
    created_at: '2026-04-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
];

export const dataPemasok: Pemasok[] = [
  {
    id: 1, nama: 'ABC Grosir',
    kontak: 'Pak Haji Ahmad', nomor_hp: '081312345678',
    alamat: 'Jl. Pasar Baru No. 20, Pekalongan',
    hutang: 0, aktif: true,
    created_at: '2026-01-10T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 2, nama: 'Sinar Makmur',
    kontak: 'Bu Tuti', nomor_hp: '085798765432',
    alamat: 'Jl. Industri No. 5, Batang',
    hutang: 500000, aktif: true,
    created_at: '2026-01-10T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 3, nama: 'Berkah Jaya',
    kontak: 'Pak Dedi', nomor_hp: '087654321098',
    alamat: 'Jl. Raya Batang-Pemalang KM 5',
    hutang: 0, aktif: true,
    created_at: '2026-02-01T08:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
];
