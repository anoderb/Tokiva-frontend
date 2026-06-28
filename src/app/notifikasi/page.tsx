/**
 * notifikasi/page.tsx
 * Halaman Notifikasi — menampilkan daftar peringatan stok kritis, expired date, dan log aktivitas kasir.
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { StockIcon, ShiftIcon, SettingsIcon } from '@/components/ui/Icons';

export default function NotifikasiPage() {
  const { notificationsList, markNotificationsAsRead } = useData();

  const [filterTipe, setFilterTipe] = useState<'semua' | 'stok' | 'expired' | 'sistem'>('semua');
  const [filterDibaca, setFilterDibaca] = useState<'semua' | 'belum_dibaca' | 'dibaca'>('semua');

  // Mark all notifications as read on mount
  useEffect(() => {
    markNotificationsAsRead();
  }, [markNotificationsAsRead]);

  // Apply filters
  const filteredNotifikasi = useMemo(() => {
    return notificationsList.filter((n) => {
      // Filter by type
      if (filterTipe !== 'semua' && n.tipe !== filterTipe) return false;
      // Filter by read status
      if (filterDibaca === 'belum_dibaca' && n.dibaca) return false;
      if (filterDibaca === 'dibaca' && !n.dibaca) return false;
      return true;
    });
  }, [notificationsList, filterTipe, filterDibaca]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Pemberitahuan & Notifikasi
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Kotak masuk peringatan stok kritis, tanggal kadaluarsa barang, dan log peringatan sistem.
        </p>
      </div>

      {/* Filter Bar */}
      <div 
        className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center p-4 rounded-2xl border" 
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'semua', label: 'Semua Tipe' },
            { key: 'stok', label: 'Stok Kritis' },
            { key: 'expired', label: 'Kadaluarsa' },
            { key: 'sistem', label: 'Sistem' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterTipe(item.key as any)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
              style={{
                background: filterTipe === item.key ? 'var(--primary-gradient)' : 'var(--bg)',
                color: filterTipe === item.key ? 'white' : 'var(--text-secondary)',
                border: filterTipe === item.key ? 'none' : '1px solid var(--border)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Read Status Filters */}
        <div className="flex gap-2">
          {[
            { key: 'semua', label: 'Semua Status' },
            { key: 'belum_dibaca', label: 'Belum Dibaca' },
            { key: 'dibaca', label: 'Sudah Dibaca' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterDibaca(item.key as any)}
              className="px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all active:scale-[0.98]"
              style={{
                background: filterDibaca === item.key ? 'var(--primary-gradient)' : 'var(--bg)',
                color: filterDibaca === item.key ? 'white' : 'var(--text-secondary)',
                border: filterDibaca === item.key ? 'none' : '1px solid var(--border)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Notifikasi */}
      <div
        className="rounded-2xl overflow-hidden divide-y"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderColor: 'var(--border)' }}
      >
        {filteredNotifikasi.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-xs">
            <SettingsIcon size={32} className="mx-auto mb-2 text-zinc-400 opacity-60" />
            Tidak ada notifikasi yang sesuai dengan filter.
          </div>
        ) : (
          filteredNotifikasi.map((n) => (
            <div
              key={n.id}
              className="p-5 flex gap-4 items-start transition-colors hover:bg-[var(--surface-hover)]"
              style={{ opacity: n.dibaca ? 0.75 : 1 }}
            >
              <span className="p-2.5 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg)' }}>
                {n.tipe === 'stok' ? (
                  <StockIcon size={20} className="text-amber-500" />
                ) : n.tipe === 'expired' ? (
                  <ShiftIcon size={20} className="text-red-500" />
                ) : (
                  <SettingsIcon size={20} style={{ color: 'var(--text-tertiary)' }} />
                )}
              </span>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    {n.judul}
                    {!n.dibaca && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    )}
                  </h3>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {n.waktu}
                  </span>
                </div>
                
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {n.pesan}
                </p>

                {n.link && (
                  <div className="pt-2">
                    <Link
                      href={n.link}
                      className="text-[10px] font-bold hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      Ambil Tindakan &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
