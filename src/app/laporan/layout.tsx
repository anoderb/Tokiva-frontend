/**
 * laporan/layout.tsx
 * Layout untuk halaman laporan. Menggunakan LayoutUtama.
 */

import LayoutUtama from '@/components/layout/LayoutUtama';

export default function LaporanLayout({ children }: { children: React.ReactNode }) {
  return <LayoutUtama>{children}</LayoutUtama>;
}
