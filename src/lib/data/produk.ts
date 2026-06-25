/**
 * data/produk.ts
 * Data mock untuk produk toko.
 * 20+ produk warung kelontong Indonesia.
 */

import type { Produk, HargaTingkat } from '@/types/produk';

export const dataProduk: Produk[] = [
  {
    id: 1, kode: 'PLU-001', barcode: '8996001600146', nama: 'Indomie Goreng',
    kategori_id: 1, supplier_id: 1, satuan: 'pcs',
    harga_beli: 2800, harga_jual: 3500, stok: 45, stok_min: 10,
    expired_date: '2026-12-30', foto_url: null, qr_url: null,
    deskripsi: 'Mie instan goreng favorit', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 2, kode: 'PLU-002', barcode: '8996001610146', nama: 'Indomie Ayam Bawang',
    kategori_id: 1, supplier_id: 1, satuan: 'pcs',
    harga_beli: 2800, harga_jual: 3500, stok: 0, stok_min: 10,
    expired_date: '2026-06-15', foto_url: null, qr_url: null,
    deskripsi: 'Mie instan kuah ayam bawang', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 3, kode: 'PLU-003', barcode: null, nama: 'Beras Rojolele 5kg',
    kategori_id: 3, supplier_id: 2, satuan: 'kg',
    harga_beli: 58000, harga_jual: 68000, stok: 3, stok_min: 5,
    expired_date: null, foto_url: null, qr_url: null,
    deskripsi: 'Beras Rojolele premium', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 4, kode: 'PLU-004', barcode: '8999999030902', nama: 'Sabun Lifebuoy',
    kategori_id: 4, supplier_id: 1, satuan: 'pcs',
    harga_beli: 2200, harga_jual: 3000, stok: 22, stok_min: 5,
    expired_date: '2027-06-30', foto_url: null, qr_url: null,
    deskripsi: 'Sabun mandi antibakteri', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 5, kode: 'PLU-005', barcode: null, nama: 'Telur Ayam 1kg',
    kategori_id: 3, supplier_id: 2, satuan: 'kg',
    harga_beli: 24000, harga_jual: 28000, stok: 60, stok_min: 10,
    expired_date: '2026-07-10', foto_url: null, qr_url: null,
    deskripsi: 'Telur ayam negeri segar', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 6, kode: 'PLU-006', barcode: '8993175530217', nama: 'Minyak Goreng Bimoli 1L',
    kategori_id: 3, supplier_id: 1, satuan: 'botol',
    harga_beli: 17000, harga_jual: 20000, stok: 2, stok_min: 5,
    expired_date: '2027-03-15', foto_url: null, qr_url: null,
    deskripsi: 'Minyak goreng sawit', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 7, kode: 'PLU-007', barcode: '8992696420014', nama: 'Gula Pasir 1kg',
    kategori_id: 3, supplier_id: 2, satuan: 'kg',
    harga_beli: 14000, harga_jual: 16500, stok: 18, stok_min: 5,
    expired_date: null, foto_url: null, qr_url: null,
    deskripsi: 'Gula pasir putih kristal', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 8, kode: 'PLU-008', barcode: '8998866200318', nama: 'Teh Botol Sosro 450ml',
    kategori_id: 2, supplier_id: 1, satuan: 'botol',
    harga_beli: 3500, harga_jual: 5000, stok: 36, stok_min: 12,
    expired_date: '2026-09-20', foto_url: null, qr_url: null,
    deskripsi: 'Teh manis dalam botol', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 9, kode: 'PLU-009', barcode: '8886008101053', nama: 'Aqua 600ml',
    kategori_id: 2, supplier_id: 1, satuan: 'botol',
    harga_beli: 2500, harga_jual: 3500, stok: 48, stok_min: 24,
    expired_date: '2027-01-15', foto_url: null, qr_url: null,
    deskripsi: 'Air mineral 600ml', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 10, kode: 'PLU-010', barcode: '8999999524111', nama: 'Shampo Sunsilk Sachet',
    kategori_id: 4, supplier_id: 1, satuan: 'sachet',
    harga_beli: 800, harga_jual: 1000, stok: 100, stok_min: 20,
    expired_date: '2027-06-30', foto_url: null, qr_url: null,
    deskripsi: 'Shampo hijau sachet 9ml', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 11, kode: 'PLU-011', barcode: null, nama: 'Kopi Kapal Api Sachet',
    kategori_id: 2, supplier_id: 1, satuan: 'sachet',
    harga_beli: 1200, harga_jual: 1500, stok: 80, stok_min: 20,
    expired_date: '2027-03-15', foto_url: null, qr_url: null,
    deskripsi: 'Kopi bubuk sachet 25g', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 12, kode: 'PLU-012', barcode: '8993189231131', nama: 'Susu Ultra Milk 250ml',
    kategori_id: 2, supplier_id: 1, satuan: 'pcs',
    harga_beli: 5500, harga_jual: 7000, stok: 12, stok_min: 10,
    expired_date: '2026-07-05', foto_url: null, qr_url: null,
    deskripsi: 'Susu UHT full cream', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 13, kode: 'PLU-013', barcode: null, nama: 'Sari Roti Tawar',
    kategori_id: 1, supplier_id: 3, satuan: 'pcs',
    harga_beli: 12000, harga_jual: 15000, stok: 8, stok_min: 5,
    expired_date: '2026-06-22', foto_url: null, qr_url: null,
    deskripsi: 'Roti tawar putih', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 14, kode: 'PLU-014', barcode: '8992775000045', nama: 'Rinso Cair 800ml',
    kategori_id: 4, supplier_id: 1, satuan: 'pcs',
    harga_beli: 18000, harga_jual: 22000, stok: 15, stok_min: 5,
    expired_date: '2028-01-01', foto_url: null, qr_url: null,
    deskripsi: 'Deterjen cair', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 15, kode: 'PLU-015', barcode: null, nama: 'Gas Elpiji 3kg',
    kategori_id: 5, supplier_id: 2, satuan: 'pcs',
    harga_beli: 18000, harga_jual: 22000, stok: 5, stok_min: 3,
    expired_date: null, foto_url: null, qr_url: null,
    deskripsi: 'Tabung gas LPG 3kg melon', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 16, kode: 'PLU-016', barcode: '8999999032203', nama: 'Pasta Gigi Pepsodent 120g',
    kategori_id: 4, supplier_id: 1, satuan: 'pcs',
    harga_beli: 8500, harga_jual: 11000, stok: 20, stok_min: 5,
    expired_date: '2027-12-31', foto_url: null, qr_url: null,
    deskripsi: 'Pasta gigi herbal', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 17, kode: 'PLU-017', barcode: null, nama: 'Mie Sedaap Goreng',
    kategori_id: 1, supplier_id: 1, satuan: 'pcs',
    harga_beli: 2700, harga_jual: 3500, stok: 30, stok_min: 10,
    expired_date: '2026-11-15', foto_url: null, qr_url: null,
    deskripsi: 'Mie instan goreng kriuk', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 18, kode: 'PLU-018', barcode: '8998866610315', nama: 'Yakult',
    kategori_id: 2, supplier_id: 3, satuan: 'pcs',
    harga_beli: 2000, harga_jual: 2500, stok: 25, stok_min: 10,
    expired_date: '2026-07-01', foto_url: null, qr_url: null,
    deskripsi: 'Minuman probiotik', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 19, kode: 'PLU-019', barcode: null, nama: 'Rokok Gudang Garam Surya 12',
    kategori_id: 5, supplier_id: 2, satuan: 'pcs',
    harga_beli: 22000, harga_jual: 25000, stok: 40, stok_min: 10,
    expired_date: null, foto_url: null, qr_url: null,
    deskripsi: 'Rokok kretek filter', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
  {
    id: 20, kode: 'PLU-020', barcode: null, nama: 'Pulsa Telkomsel 10rb',
    kategori_id: 5, supplier_id: null, satuan: 'pcs',
    harga_beli: 10500, harga_jual: 12000, stok: 999, stok_min: 0,
    expired_date: null, foto_url: null, qr_url: null,
    deskripsi: 'Voucher pulsa Telkomsel', is_ecer: true, is_aktif: true,
    created_at: '2026-01-15T08:00:00Z', updated_at: '2026-06-17T10:00:00Z', deleted_at: null,
  },
];

/** Harga bertingkat untuk produk tertentu */
export const dataHargaTingkat: HargaTingkat[] = [
  // Indomie Goreng
  { id: 1, produk_id: 1, tingkat: 'ecer', min_qty: 1, harga: 3500, created_at: '2026-01-15T08:00:00Z' },
  { id: 2, produk_id: 1, tingkat: 'grosir', min_qty: 6, harga: 3200, created_at: '2026-01-15T08:00:00Z' },
  { id: 3, produk_id: 1, tingkat: 'partai', min_qty: 40, harga: 3000, created_at: '2026-01-15T08:00:00Z' },
  // Sabun Lifebuoy
  { id: 4, produk_id: 4, tingkat: 'ecer', min_qty: 1, harga: 3000, created_at: '2026-01-15T08:00:00Z' },
  { id: 5, produk_id: 4, tingkat: 'grosir', min_qty: 6, harga: 2700, created_at: '2026-01-15T08:00:00Z' },
  { id: 6, produk_id: 4, tingkat: 'partai', min_qty: 24, harga: 2500, created_at: '2026-01-15T08:00:00Z' },
  // Aqua 600ml
  { id: 7, produk_id: 9, tingkat: 'ecer', min_qty: 1, harga: 3500, created_at: '2026-01-15T08:00:00Z' },
  { id: 8, produk_id: 9, tingkat: 'grosir', min_qty: 6, harga: 3000, created_at: '2026-01-15T08:00:00Z' },
  { id: 9, produk_id: 9, tingkat: 'partai', min_qty: 24, harga: 2800, created_at: '2026-01-15T08:00:00Z' },
];
