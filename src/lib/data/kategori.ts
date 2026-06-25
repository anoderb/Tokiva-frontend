/**
 * data/kategori.ts
 * Data mock untuk kategori produk.
 */

import type { Kategori } from '@/types/produk';

export const dataKategori: Kategori[] = [
  {
    id: 1,
    nama: 'Makanan',
    icon: '🍜',
    aktif: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 2,
    nama: 'Minuman',
    icon: '🥤',
    aktif: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 3,
    nama: 'Sembako',
    icon: '🍚',
    aktif: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 4,
    nama: 'Perawatan',
    icon: '🧴',
    aktif: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 5,
    nama: 'Lainnya',
    icon: '📦',
    aktif: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
];
