/**
 * Sidebar.tsx
 * Navigasi sidebar untuk desktop. Collapsible dengan animasi smooth.
 * Menampilkan nama toko dan logo dinamis dari localStorage.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGASI_UTAMA } from '@/lib/konstanta';
import { useAuth } from '@/hooks/useAuth';
import * as Icons from '@/components/ui/Icons';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [namaToko, setNamaToko] = useState('Tokiva');
  const [logoToko, setLogoToko] = useState<string | null>(null);

  // Load nama toko & logo dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tokiva_pengaturan_toko');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.namaToko) setNamaToko(data.namaToko);
        if (data.logoToko) setLogoToko(data.logoToko);
      } catch { /* ignore */ }
    }

    // Listen for storage changes (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tokiva_pengaturan_toko' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.namaToko) setNamaToko(data.namaToko);
          if (data.logoToko) setLogoToko(data.logoToko);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function toggleSubmenu(href: string) {
    setExpandedMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  }

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const navItems = NAVIGASI_UTAMA.filter((item) => {
    if (item.hanyaAdmin && !isAdmin) return false;
    return true;
  });

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`flex flex-col fixed left-0 top-0 h-dvh z-50 lg:z-40 transition-transform lg:transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 h-16 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {logoToko ? (
            <img
              src={logoToko}
              alt="Logo Toko"
              className="w-9 h-9 rounded-xl shrink-0 object-cover"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <span className="text-sm font-black text-white">{namaToko.charAt(0).toUpperCase()}</span>
            </div>
          )}
          {!collapsed && (
            <span className="text-lg font-bold gradient-text truncate">{namaToko}</span>
          )}
          
          {/* On Mobile: Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden ml-auto p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Tutup menu"
          >
            <Icons.CloseIcon size={20} />
          </button>

          {/* On Desktop: Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block ml-auto p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label={collapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus.includes(item.href) || active;
            const IconComponent = (Icons as any)[item.icon];

            return (
              <div key={item.href}>
                {/* Main item */}
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      background: active ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {IconComponent && (
                      <IconComponent
                        className="shrink-0"
                        style={{ color: active ? 'var(--primary)' : 'var(--text-tertiary)' }}
                      />
                    )}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <span
                          className="text-[10px] transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', color: 'var(--text-tertiary)' }}
                        >
                          ▶
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      background: active ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {IconComponent && (
                      <IconComponent
                        className="shrink-0"
                        style={{ color: active ? 'var(--primary)' : 'var(--text-tertiary)' }}
                      />
                    )}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isExpanded && !collapsed && (
                  <div className="ml-4 mt-0.5 space-y-0.5 animate-fade-in" style={{ borderLeft: '1px solid var(--border)' }}>
                    {item.submenu!.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onCloseMobile}
                          className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-r-lg text-xs font-medium transition-all duration-200"
                          style={{
                            background: subActive ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                            color: subActive ? 'var(--primary)' : 'var(--text-tertiary)',
                          }}
                          onMouseEnter={(e) => {
                            if (!subActive) e.currentTarget.style.background = 'var(--surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (!subActive) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div
            className="px-4 py-3 text-xs shrink-0"
            style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}
          >
            {namaToko} v1.0.0
          </div>
        )}
      </aside>
    </>
  );
}
