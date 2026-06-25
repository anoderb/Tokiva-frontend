/**
 * format_rupiah.ts
 * Formatter mata uang Rupiah untuk tampilan di UI.
 * Contoh: formatRupiah(3500) → "Rp 3.500"
 */

/**
 * Format angka ke format Rupiah.
 * @param nilai - Nilai dalam angka
 * @param tampilkanDesimal - Apakah tampilkan desimal (default: false)
 * @returns String format Rupiah, contoh: "Rp 3.500"
 */
export function formatRupiah(nilai: number, tampilkanDesimal = false): string {
  const opsi: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: tampilkanDesimal ? 2 : 0,
    maximumFractionDigits: tampilkanDesimal ? 2 : 0,
  };

  return new Intl.NumberFormat('id-ID', opsi)
    .format(nilai)
    .replace('IDR', 'Rp')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format angka ke format singkat.
 * Contoh: formatRupiahSingkat(2450000) → "Rp 2,4jt"
 */
export function formatRupiahSingkat(nilai: number): string {
  if (nilai >= 1_000_000_000) {
    return `Rp ${(nilai / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
  }
  if (nilai >= 1_000_000) {
    return `Rp ${(nilai / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  }
  if (nilai >= 1_000) {
    return `Rp ${(nilai / 1_000).toFixed(1).replace('.0', '')}rb`;
  }
  return formatRupiah(nilai);
}

/**
 * Format angka saja tanpa prefix Rp.
 * Contoh: formatAngka(3500) → "3.500"
 */
export function formatAngka(nilai: number): string {
  return new Intl.NumberFormat('id-ID').format(nilai);
}

/**
 * Parse string Rupiah ke angka.
 * Contoh: parseRupiah("3.500") → 3500
 */
export function parseRupiah(teks: string): number {
  const bersih = teks.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(bersih) || 0;
}
