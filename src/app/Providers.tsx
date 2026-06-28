'use client';

import { type ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { DataProvider } from '@/hooks/useData';
import { ThemeProvider } from '@/hooks/useTheme';


export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
            console.log('Service Worker unregistered in development mode:', registration.scope);
          }
        });
        // Hapus cache storage agar resource lama tidak tertinggal
        if ('caches' in window) {
          caches.keys().then((names) => {
            for (const name of names) {
              caches.delete(name);
            }
          });
        }
      } else {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker terdaftar:', reg.scope))
          .catch((err) => console.error('Pendaftaran Service Worker gagal:', err));
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
