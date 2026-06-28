/**
 * pengaturan/page.tsx
 * Halaman Hub Pengaturan Sistem Tokiva.
 * Menghubungkan ke konfigurasi Toko/Kop Struk, Hak Akses Pengguna, dan Backup Data.
 */

'use client';

import Link from 'next/link';
import { HomeIcon, LockIcon } from '@/components/ui/Icons';

export default function PengaturanHub() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Konfigurasi & Pengaturan Sistem
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Atur informasi bisnis, struk kasir, manajemen akun kasir, dan backup data.
        </p>
      </div>

      {/* Grid Menu Pengaturan */}
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
        {[
          {
            nama: 'Profil Toko & Kop Struk',
            desc: 'Edit nama toko, alamat, logo, dan teks footer/kop struk belanja thermal.',
            link: '/pengaturan/toko',
            iconKey: 'toko',
          },
          {
            nama: 'Manajemen Hak Akses Pengguna',
            desc: 'Daftarkan akun kasir baru, ubah password, dan kelola peran (admin/kasir).',
            link: '/pengaturan/pengguna',
            iconKey: 'pengguna',
          },
        ].map((menu) => {
          const IconComp = menu.iconKey === 'toko' ? HomeIcon : LockIcon;
          return (
            <Link
              key={menu.nama}
              href={menu.link}
              className="rounded-2xl p-5 flex gap-4 items-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <span className="p-3 rounded-xl" style={{ background: 'var(--bg)', color: 'var(--primary)' }}>
                <IconComp size={24} />
              </span>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {menu.nama}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {menu.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
