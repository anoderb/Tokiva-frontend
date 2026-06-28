/**
 * stok/page.tsx
 * Halaman utama stok — Ringkasan angka stok, filter status stok, pencarian, dan tautan aksi restock / opname.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { getStatusStok } from '@/types/produk';
import * as Icons from '@/components/ui/Icons';

export default function RingkasanStok() {
  const { produkList, kategoriList } = useData();

  const [pencarian, setPencarian] = useState('');
  const [tabAktif, setTabAktif] = useState<'semua' | 'rendah' | 'habis' | 'expired'>('semua');
  const [kategoriFilter, setKategoriFilter] = useState('semua');
  const [sortKey, setSortKey] = useState('nama-asc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Filter produk yang tidak di-delete
  const produkTersedia = useMemo(() => {
    return produkList.filter((p) => !p.deleted_at);
  }, [produkList]);

  // Hitung ringkasan
  const ringkasan = useMemo(() => {
    let totalSka = produkTersedia.length;
    let rendah = 0;
    let habis = 0;
    let expired = 0;

    produkTersedia.forEach((p) => {
      const status = getStatusStok(p);
      if (status === 'rendah') rendah++;
      if (status === 'habis') habis++;
      if (status === 'expired') expired++;
    });

    return { totalSka, rendah, habis, expired };
  }, [produkTersedia]);

  // Filter berdasarkan pencarian & tab status stok & kategori
  const produkFiltered = useMemo(() => {
    return produkTersedia.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(pencarian.toLowerCase()) ||
        p.kode.toLowerCase().includes(pencarian.toLowerCase());

      const status = getStatusStok(p);
      const matchTab =
        tabAktif === 'semua' ||
        (tabAktif === 'rendah' && status === 'rendah') ||
        (tabAktif === 'habis' && status === 'habis') ||
        (tabAktif === 'expired' && status === 'expired');

      const matchKategori = kategoriFilter === 'semua' || p.kategori_id === Number(kategoriFilter);

      return matchSearch && matchTab && matchKategori;
    });
  }, [produkTersedia, pencarian, tabAktif, kategoriFilter]);

  const produkSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...produkFiltered].sort((a, b) => {
      if (field === 'nama') {
        return order === 'asc' ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama);
      } else if (field === 'stok') {
        return order === 'asc' ? a.stok - b.stok : b.stok - a.stok;
      }
      return 0;
    });
  }, [produkFiltered, sortKey]);

  const totalHalaman = Math.ceil(produkSorted.length / itemPerHalaman) || 1;

  const produkPaginasi = useMemo(() => {
    const start = (halaman - 1) * itemPerHalaman;
    return produkSorted.slice(start, start + itemPerHalaman);
  }, [produkSorted, halaman]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Manajemen Stok & Persediaan
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Pantau ketersediaan barang toko Anda secara real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/stok/masuk"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:shadow-lg active:scale-95"
            style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
          >
            <Icons.PlusIcon size={16} /> Barang Masuk
          </Link>
          <Link
            href="/stok/opname"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-md active:scale-95"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <Icons.ReceiptIcon size={16} /> Stok Opname
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total SKU */}
        <button
          onClick={() => setTabAktif('semua')}
          className="rounded-xl p-3 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${tabAktif === 'semua' ? 'var(--primary)' : 'var(--border)'}`,
            boxShadow: tabAktif === 'semua' ? '0 0 0 1px var(--primary)' : 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">Total SKU</span>
            <Icons.PackageIcon size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {ringkasan.totalSka}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Semua produk aktif</p>
        </button>

        {/* Stok Rendah */}
        <button
          onClick={() => setTabAktif('rendah')}
          className="rounded-xl p-3 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${tabAktif === 'rendah' ? 'var(--warning)' : 'var(--border)'}`,
            boxShadow: tabAktif === 'rendah' ? '0 0 0 1px var(--warning)' : 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">Stok Rendah</span>
            <Icons.BellIcon size={16} className="text-amber-500 animate-bounce" />
          </div>
          <p className="text-lg sm:text-2xl font-bold animate-pulse" style={{ color: 'var(--warning)' }}>
            {ringkasan.rendah}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Perlu segera di-restock</p>
        </button>

        {/* Stok Habis */}
        <button
          onClick={() => setTabAktif('habis')}
          className="rounded-xl p-3 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${tabAktif === 'habis' ? 'var(--danger)' : 'var(--border)'}`,
            boxShadow: tabAktif === 'habis' ? '0 0 0 1px var(--danger)' : 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">Stok Habis</span>
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--danger)' }} />
          </div>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--danger)' }}>
            {ringkasan.habis}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Segera hubungi supplier</p>
        </button>

        {/* Kadaluarsa */}
        <button
          onClick={() => setTabAktif('expired')}
          className="rounded-xl p-3 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${tabAktif === 'expired' ? 'var(--danger)' : 'var(--border)'}`,
            boxShadow: tabAktif === 'expired' ? '0 0 0 1px var(--danger)' : 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">Kadaluarsa</span>
            <Icons.ShiftIcon size={16} className="text-red-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--danger)' }}>
            {ringkasan.expired}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Barang expired / hampir expired</p>
        </button>
      </div>

      {/* Main List */}
      <div
        className="rounded-xl p-5 space-y-4 w-full max-w-full min-w-0 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Daftar {tabAktif === 'semua' ? 'Semua' : tabAktif} Stok
          </h2>
          
          {/* Search, Kategori & Sort */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Icons.SearchIcon size={14} />
              </span>
              <input
                type="text"
                placeholder="Cari produk..."
                value={pencarian}
                onChange={(e) => { setPencarian(e.target.value); setHalaman(1); }}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={kategoriFilter}
                onChange={(e) => { setKategoriFilter(e.target.value); setHalaman(1); }}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="semua">Semua Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat.id} value={kat.id}>{kat.nama}</option>
                ))}
              </select>
              <select
                value={sortKey}
                onChange={(e) => { setSortKey(e.target.value); setHalaman(1); }}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="nama-asc">Nama (A-Z)</option>
                <option value="nama-desc">Nama (Z-A)</option>
                <option value="stok-asc">Stok Terkecil</option>
                <option value="stok-desc">Stok Terbanyak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div className="hidden md:block overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Kode</th>
                <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Produk</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Stok Saat Ini</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Stok Minimum</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Kadaluarsa</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {produkPaginasi.map((p) => {
                const status = getStatusStok(p);
                const isExp = status === 'expired';
                return (
                  <tr key={p.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                    <td className="p-3 font-semibold">{p.kode}</td>
                    <td className="p-3 text-sm font-medium">{p.nama}</td>
                    <td className="p-3 text-center font-bold">{p.stok} {p.satuan}</td>
                    <td className="p-3 text-center" style={{ color: 'var(--text-tertiary)' }}>{p.stok_min} {p.satuan}</td>
                    <td className="p-3 text-center font-medium" style={{ color: isExp ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {p.expired_date || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background:
                            status === 'expired'
                              ? 'var(--danger-light)'
                              : status === 'habis'
                              ? 'var(--danger-light)'
                              : status === 'rendah'
                              ? 'var(--warning-light)'
                              : 'var(--success-light)',
                          color:
                            status === 'expired'
                              ? 'var(--danger)'
                              : status === 'habis'
                              ? 'var(--danger)'
                              : status === 'rendah'
                              ? 'var(--warning)'
                              : 'var(--success)',
                        }}
                      >
                        {status === 'expired' ? 'Expired' : status === 'habis' ? 'Habis' : status === 'rendah' ? 'Rendah' : 'OK'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Link
                          href={`/stok/masuk?produk_id=${p.id}`}
                          title="Barang Masuk / Restock"
                          className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ color: 'var(--primary)' }}
                        >
                          <Icons.PlusIcon size={14} />
                        </Link>
                        <Link
                          href={`/stok/opname?produk_id=${p.id}`}
                          title="Stok Opname / Audit"
                          className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Icons.ReceiptIcon size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {produkFiltered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                      <Icons.StockIcon size={48} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                      Tidak ada data stok yang ditemukan
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {produkPaginasi.map((p) => {
            const status = getStatusStok(p);
            return (
              <div key={p.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                {/* Header: Nama & Status Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight truncate">{p.nama}</h3>
                    <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Kode: {p.kode}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                    style={{
                      background:
                        status === 'expired'
                          ? 'var(--danger-light)'
                          : status === 'habis'
                          ? 'var(--danger-light)'
                          : status === 'rendah'
                          ? 'var(--warning-light)'
                          : 'var(--success-light)',
                      color:
                        status === 'expired'
                          ? 'var(--danger)'
                          : status === 'habis'
                          ? 'var(--danger)'
                          : status === 'rendah'
                          ? 'var(--warning)'
                          : 'var(--success)',
                    }}
                  >
                    {status === 'expired' ? 'Expired' : status === 'habis' ? 'Habis' : status === 'rendah' ? 'Rendah' : 'OK'}
                  </span>
                </div>

                {/* Info Detail: Stok Saat Ini vs Minimum & Kadaluarsa */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Stok Saat Ini</p>
                    <p className="font-bold mt-0.5 text-xs">{p.stok} {p.satuan}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Stok Minimum</p>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{p.stok_min} {p.satuan}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Masa Kadaluarsa</p>
                    <p className="font-semibold mt-0.5" style={{ color: status === 'expired' ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {p.expired_date || 'Tidak ditentukan'}
                    </p>
                  </div>
                </div>

                {/* Footer: Quick Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link
                    href={`/stok/masuk?produk_id=${p.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'var(--primary-gradient)' }}
                  >
                    <Icons.PlusIcon size={12} /> Restock
                  </Link>
                  <Link
                    href={`/stok/opname?produk_id=${p.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-[var(--surface-hover)] border transition-colors"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  >
                    <Icons.ReceiptIcon size={12} /> Opname
                  </Link>
                </div>
              </div>
            );
          })}

          {produkFiltered.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                <Icons.StockIcon size={48} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Tidak ada data stok yang ditemukan
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalHalaman > 1 && (
          <div
            className="px-4 py-3 flex items-center justify-between shadow-sm border-t"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Menampilkan {Math.min(produkSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(produkSorted.length, halaman * itemPerHalaman)} dari {produkSorted.length} produk
            </p>
            <div className="flex gap-1.5">
              <button
                disabled={halaman === 1}
                onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                &larr; Prev
              </button>
              {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => setHalaman(pNum)}
                  className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    background: halaman === pNum ? 'var(--primary)' : 'var(--surface)',
                    color: halaman === pNum ? 'white' : 'var(--text-secondary)',
                    border: halaman === pNum ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {pNum}
                </button>
              ))}
              <button
                disabled={halaman === totalHalaman}
                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
