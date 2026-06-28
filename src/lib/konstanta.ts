/**
 * konstanta.ts
 * Konstanta global untuk aplikasi Tokiva.
 */

/** Nama aplikasi */
export const NAMA_APLIKASI = 'Tokiva';

/** Versi aplikasi */
export const VERSI_APLIKASI = '1.0.0';

/** Navigasi sidebar / bottom tab */
export interface ItemNavigasi {
  label: string;
  href: string;
  icon: string;
  hanyaAdmin?: boolean;
  badge?: number;
  submenu?: ItemNavigasi[];
}

export const NAVIGASI_UTAMA: ItemNavigasi[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'HomeIcon' },
  {
    label: 'Kasir',
    href: '/kasir',
    icon: 'CartIcon',
    submenu: [
      { label: 'Transaksi Baru', href: '/kasir', icon: 'PlusIcon' },
      { label: 'Riwayat Transaksi', href: '/kasir/riwayat', icon: 'ReceiptIcon' },
    ],
  },
  {
    label: 'Produk',
    href: '/produk',
    icon: 'PackageIcon',
    hanyaAdmin: true,
    submenu: [
      { label: 'Semua Produk', href: '/produk', icon: 'PackageIcon' },
      { label: 'Kategori', href: '/produk/kategori', icon: 'PromoIcon' },
    ],
  },
  {
    label: 'Stok',
    href: '/stok',
    icon: 'StockIcon',
    hanyaAdmin: true,
    submenu: [
      { label: 'Stok Saat Ini', href: '/stok', icon: 'StockIcon' },
      { label: 'Barang Masuk', href: '/stok/masuk', icon: 'PlusIcon' },
      { label: 'Stok Opname', href: '/stok/opname', icon: 'ReceiptIcon' },
      { label: 'Kadaluarsa', href: '/stok/kadaluarsa', icon: 'ShiftIcon' },
    ],
  },
  { label: 'Bon / Piutang', href: '/bon', icon: 'ReceiptIcon' },
  { label: 'Pelanggan', href: '/pelanggan', icon: 'UsersIcon' },
  { label: 'Pemasok', href: '/pemasok', icon: 'TruckIcon', hanyaAdmin: true },
  { label: 'Laporan', href: '/laporan', icon: 'ReportIcon', hanyaAdmin: true },
  { label: 'Diskon & Promo', href: '/diskon', icon: 'PromoIcon', hanyaAdmin: true },
  { label: 'Shift', href: '/shift', icon: 'ShiftIcon' },
  { label: 'Notifikasi', href: '/notifikasi', icon: 'BellIcon' },
  { label: 'Pengaturan', href: '/pengaturan', icon: 'SettingsIcon', hanyaAdmin: true },
];

/** Navigasi bottom tab untuk mobile (hanya 5 item utama) */
export const NAVIGASI_MOBILE: ItemNavigasi[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'HomeIcon' },
  { label: 'Kasir', href: '/kasir', icon: 'CartIcon' },
  { label: 'Produk', href: '/produk', icon: 'PackageIcon' },
  { label: 'Stok', href: '/stok', icon: 'StockIcon' },
  { label: 'Lainnya', href: '#', icon: 'MenuIcon' },
];

/** Opsi satuan produk */
export const OPSI_SATUAN = [
  { nilai: 'pcs', label: 'Pcs' },
  { nilai: 'kg', label: 'Kg' },
  { nilai: 'gram', label: 'Gram' },
  { nilai: 'liter', label: 'Liter' },
  { nilai: 'pack', label: 'Pack' },
  { nilai: 'dus', label: 'Dus' },
  { nilai: 'botol', label: 'Botol' },
  { nilai: 'sachet', label: 'Sachet' },
];

/** Opsi metode pembayaran */
export const OPSI_METODE_BAYAR = [
  { nilai: 'tunai', label: 'Tunai', icon: 'tunai' },
  { nilai: 'qris', label: 'QRIS', icon: 'qris' },
  { nilai: 'transfer', label: 'Transfer', icon: 'transfer' },
  { nilai: 'bon', label: 'Bon', icon: 'bon' },
  { nilai: 'voucher', label: 'Voucher', icon: 'voucher' },
] as const;

/** Sapaan berdasarkan jam */
export function getSapaan(): string {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** Format tanggal Indonesia */
export function formatTanggal(tanggal: string | Date, tampilkanJam = false): string {
  const tgl = typeof tanggal === 'string' ? new Date(tanggal) : tanggal;
  const opsi: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(tampilkanJam && { hour: '2-digit', minute: '2-digit' }),
  };
  return tgl.toLocaleDateString('id-ID', opsi);
}

/** Format waktu saja */
export function formatWaktu(tanggal: string | Date): string {
  const tgl = typeof tanggal === 'string' ? new Date(tanggal) : tanggal;
  return tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
