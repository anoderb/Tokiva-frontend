/**
 * notifikasi/layout.tsx
 * Layout untuk halaman notifikasi. Menggunakan LayoutUtama.
 */

import LayoutUtama from '@/components/layout/LayoutUtama';

export default function NotifikasiLayout({ children }: { children: React.ReactNode }) {
  return <LayoutUtama>{children}</LayoutUtama>;
}
