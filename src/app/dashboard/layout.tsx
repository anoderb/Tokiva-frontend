/**
 * dashboard/layout.tsx
 * Layout untuk halaman-halaman setelah login.
 * Menggunakan LayoutUtama (sidebar + topbar + bottom tab).
 */

import LayoutUtama from '@/components/layout/LayoutUtama';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LayoutUtama>{children}</LayoutUtama>;
}
