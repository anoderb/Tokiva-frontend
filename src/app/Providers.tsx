'use client';

import { type ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { DataProvider } from '@/hooks/useData';
import { ThemeProvider } from '@/hooks/useTheme';


export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('Service Worker unregistered successfully:', registration.scope);
        }
      });
      // Hapus cache storage agar resource lama tidak tertinggal dan merusak route Next.js
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
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
