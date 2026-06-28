/**
 * TabBawah.tsx
 * Bottom tab navigation untuk mobile.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGASI_MOBILE } from '@/lib/konstanta';
import { useAuth } from '@/hooks/useAuth';
import * as Icons from '@/components/ui/Icons';

export default function TabBawah({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  function isActive(href: string): boolean {
    if (href === '#') return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const itemsMobile = NAVIGASI_MOBILE.map((item) => {
    if (!isAdmin) {
      if (item.label === 'Produk') {
        return { label: 'Pelanggan', href: '/pelanggan', icon: 'UsersIcon' };
      }
      if (item.label === 'Stok') {
        return { label: 'Bon / Piutang', href: '/bon', icon: 'ReceiptIcon' };
      }
    }
    return item;
  });

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-16 safe-bottom shadow-lg"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {itemsMobile.map((item) => {
        const active = isActive(item.href);
        const IconComponent = (Icons as any)[item.icon];

        if (item.href === '#') {
          return (
            <button
              key={item.href}
              onClick={onToggleSidebar}
              className="flex flex-col items-center justify-center py-1 px-3 transition-all duration-200 relative bg-transparent border-0 cursor-pointer"
              style={{
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {IconComponent && (
                <IconComponent size={20} className="mb-1" style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }} />
              )}
              <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-1 px-3 transition-all duration-200 relative"
            style={{
              color: active ? 'var(--primary)' : 'var(--text-secondary)',
            }}
          >
            {IconComponent && (
              <IconComponent size={20} className="mb-1" style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }} />
            )}
            <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
            {active && (
              <span
                className="absolute bottom-1 w-5 h-0.5 rounded-full"
                style={{ background: 'var(--primary)' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
