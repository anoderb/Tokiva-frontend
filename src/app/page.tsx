/**
 * page.tsx (root)
 * Mengalihkan pengguna otomatis:
 * - Ke /dashboard jika sudah login.
 * - Ke /login jika belum login.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RootPage() {
  const router = useRouter();
  const { pengguna, sedangMemuat } = useAuth();

  useEffect(() => {
    if (!sedangMemuat) {
      if (pengguna) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [sedangMemuat, pengguna, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );
}
