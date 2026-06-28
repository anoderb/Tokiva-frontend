/**
 * produk/layout.tsx
 * Layout untuk halaman produk. Menggunakan LayoutUtama.
 */

import LayoutUtama from '@/components/layout/LayoutUtama';

export default function ProdukLayout({ children }: { children: React.ReactNode }) {
  return <LayoutUtama>{children}</LayoutUtama>;
}
