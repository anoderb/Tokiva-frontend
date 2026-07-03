'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { DataProvider } from '@/hooks/useData';
import { ThemeProvider } from '@/hooks/useTheme';
import { processSyncQueue, pullAndStoreAll } from '@/lib/sync';

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('online');

  useEffect(() => {
    const handleOnline = async () => {
      setStatus('syncing');
      await processSyncQueue();
      await pullAndStoreAll();
      setStatus('online');
    };

    const handleOffline = () => setStatus('offline');
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        handleOnline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial sync
    if (navigator.onLine) {
      handleOnline();
    } else {
      setStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <>
      {status === 'offline' && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-1 text-sm z-[9999]">
          ⚠️ Offline — data disimpan lokal, akan sync otomatis saat online
        </div>
      )}
      {status === 'syncing' && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 text-sm z-[9999]">
          ↻ Sinkronisasi data...
        </div>
      )}
      {children}
    </>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('Service Worker registered:', reg.scope),
        (err) => console.error('Service Worker registration failed:', err)
      );
    }
  }, []);

  return (
    <ThemeProvider>
      <SyncProvider>
        <DataProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </DataProvider>
      </SyncProvider>
    </ThemeProvider>
  );
}
