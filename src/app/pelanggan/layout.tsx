/**
 * pelanggan/layout.tsx
 * Layout untuk halaman pelanggan. Menggunakan LayoutUtama.
 */

import LayoutUtama from '@/components/layout/LayoutUtama';

export default function PelangganLayout({ children }: { children: React.ReactNode }) {
  return <LayoutUtama>{children}</LayoutUtama>;
}
