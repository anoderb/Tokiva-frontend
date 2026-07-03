/**
 * Topbar.tsx
 * Top bar sticky — notifikasi, offline indicator, sync status, user avatar.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { getSapaan } from '@/lib/konstanta';
import * as Icons from '@/components/ui/Icons';
import { useData } from '@/hooks/useData';
import { SyncIndicator } from '@/components/ui/SyncIndicator';

export default function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { pengguna, logout, isAdmin } = useAuth();
  const { tema, toggleTema } = useTheme();
  const { unreadNotificationsCount, shiftAktif } = useData();
  const router = useRouter();
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [tampilModalPeringatan, setTampilModalPeringatan] = useState(false);

  async function handleLogout() {
    if (shiftAktif) {
      setMenuTerbuka(false);
      setTampilModalPeringatan(true);
      return;
    }
    await logout();
    router.push('/login');
  }

  return (
    <>
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-16 shrink-0"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: Greeting */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Menu"
        >
          <Icons.MenuIcon />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
            {getSapaan()}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {pengguna?.nama || 'Pengguna'}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Sync Indicator */}
        <SyncIndicator />

        {/* Online Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'var(--success-light)', color: 'var(--success)' }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--success)' }} />
          <span className="hidden sm:inline tracking-wider text-[10px] font-bold uppercase">Online</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTema}
          className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          aria-label="Ganti Tema"
          title={tema === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          {tema === 'dark' ? <Icons.SunIcon size={20} /> : <Icons.MoonIcon size={20} />}
        </button>

        {/* Notification */}
        <button
          className="relative p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => router.push('/notifikasi')}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          aria-label="Notifikasi"
        >
          <Icons.BellIcon size={20} />
          {/* Badge */}
          {unreadNotificationsCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white"
              style={{ background: 'var(--danger)', minWidth: '16px', height: '16px' }}
            >
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuTerbuka(!menuTerbuka)}
            className="flex items-center gap-2 p-1 rounded-xl transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
              style={{ background: 'var(--primary-gradient)' }}
            >
              {pengguna?.nama?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pengguna?.nama?.split(' ')[0] || 'User'}
            </span>
            <Icons.ChevronDownIcon size={14} className="hidden md:block opacity-60" />
          </button>

          {/* Dropdown Menu */}
          {menuTerbuka && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuTerbuka(false)} />
              <div
                className="absolute right-0 top-12 w-56 rounded-xl py-2 z-50 animate-slide-up"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {pengguna?.nama}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-1 inline-block px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--primary)' }}>
                    {pengguna?.role === 'admin' ? 'ADMIN' : 'KASIR'}
                  </p>
                </div>

                {/* Menu items */}
                {isAdmin && (
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => { setMenuTerbuka(false); router.push('/pengaturan'); }}
                    >
                      <Icons.SettingsIcon size={16} /> Pengaturan
                    </button>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors uppercase tracking-wider"
                    style={{ color: 'var(--danger)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icons.LogoutIcon size={16} /> Keluar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

    {tampilModalPeringatan && (
      <>
        <div
          className="fixed inset-0 bg-black/60 z-50 animate-fade-in backdrop-blur-sm"
          onClick={() => setTampilModalPeringatan(false)}
        />
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 animate-slide-up">
          <div
            className="rounded-2xl overflow-hidden shadow-xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 text-amber-500">
              <Icons.LockIcon size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Peringatan Shift
              </h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Shift register Anda masih terbuka! Harap tutup shift terlebih dahulu di menu <strong>Shift & Kasir</strong> sebelum keluar dari sesi Anda.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTampilModalPeringatan(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110"
                style={{ background: 'var(--primary-gradient)' }}
              >
                Dimengerti
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}
