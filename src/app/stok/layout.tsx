/**
 * stok/layout.tsx
 * Layout untuk halaman stok. Menggunakan LayoutUtama.
 */

import LayoutUtama from '@/components/layout/LayoutUtama';

export default function StokLayout({ children }: { children: React.ReactNode }) {
  return <LayoutUtama>{children}</LayoutUtama>;
}
