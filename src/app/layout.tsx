/**
 * layout.tsx
 * Root layout Tokiva — konfigurasi font Inter, metadata SEO, dark mode default.
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './Providers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Tokiva — POS untuk UMKM',
    template: '%s | Tokiva',
  },
  description:
    'Aplikasi Point of Sale (POS) untuk warung & toko kecil. Kasir cepat, stok rapi, bon teratur.',
  keywords: ['POS', 'kasir', 'warung', 'toko', 'UMKM', 'point of sale', 'Tokiva'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tokiva',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1120' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
