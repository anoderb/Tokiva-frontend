/**
 * LayoutUtama.tsx
 * Layout utama aplikasi — Sidebar (desktop) + Topbar + Content + TabBawah (mobile).
 * Dipakai di semua halaman setelah login.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import TabBawah from './TabBawah';
import ChatbotWidget from '../ui/ChatbotWidget';

export default function LayoutUtama({ children }: { children: React.ReactNode }) {
  const { pengguna, sedangMemuat } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isKasirAccessingAdmin = !sedangMemuat && pengguna && pengguna.role !== 'admin' && [
    '/produk',
    '/stok',
    '/pemasok',
    '/laporan',
    '/diskon',
    '/pengaturan',
  ].some((path) => pathname.startsWith(path));

  // Redirect ke login jika belum login
  useEffect(() => {
    if (!sedangMemuat && !pengguna) {
      router.replace('/login');
    }
  }, [sedangMemuat, pengguna, router]);

  // Redirect kasir if trying to access admin-only pages
  useEffect(() => {
    if (isKasirAccessingAdmin) {
      router.replace('/dashboard');
    }
  }, [isKasirAccessingAdmin, router]);

  // Loading state or unauthorized access
  if (sedangMemuat || isKasirAccessingAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  // Belum login
  if (!pengguna) {
    return null;
  }

  return (
    <div className="min-h-dvh flex overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar Desktop / Mobile Drawer */}
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-dvh min-w-0 lg:ml-[var(--sidebar-width)] overflow-x-hidden">
        <Topbar onToggleSidebar={() => setMobileSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 min-w-0">
          {children}
        </main>
      </div>

      {/* Bottom Tab Mobile */}
      <TabBawah onToggleSidebar={() => setMobileSidebarOpen(true)} />

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
