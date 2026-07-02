'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function HalamanLogout() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Jalankan logout sesi lokal
    logout();
    // Redirect ke login
    router.replace('/login');
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-3 border-t-transparent border-teal-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[var(--text-secondary)] animate-pulse">
          Mengeluarkan sesi Anda...
        </p>
      </div>
    </div>
  );
}
