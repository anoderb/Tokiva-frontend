/**
 * stok/kadaluarsa/page.tsx
 * Halaman Kadaluarsa — memantau barang yang sudah kadaluarsa atau mendekati tanggal kadaluarsa (30 hari ke depan).
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { ChevronLeftIcon, ShiftIcon, SearchIcon } from '@/components/ui/Icons';

export default function BarangKadaluarsa() {
  const { produkList } = useData();

  const [pencarian, setPencarian] = useState('');
  const [filterWaktu, setFilterWaktu] = useState<'semua' | 'lewat' | 'mendekati'>('semua');

  // Filter out deleted products and get ones with expired dates
  const produkDenganExp = useMemo(() => {
    return produkList.filter((p) => !p.deleted_at && p.expired_date);
  }, [produkList]);

  // Calculate stats
  const stats = useMemo(() => {
    const hariIni = new Date();
    const batasMendekati = new Date();
    batasMendekati.setDate(hariIni.getDate() + 30); // 30 hari ke depan

    let lewatCount = 0;
    let mendekatiCount = 0;

    produkDenganExp.forEach((p) => {
      const expDate = new Date(p.expired_date!);
      if (expDate < hariIni) {
        lewatCount++;
      } else if (expDate <= batasMendekati) {
        mendekatiCount++;
      }
    });

    return { lewatCount, mendekatiCount, total: lewatCount + mendekatiCount };
  }, [produkDenganExp]);

  // Filter list by search & time boundary
  const listFiltered = useMemo(() => {
    const hariIni = new Date();
    const batasMendekati = new Date();
    batasMendekati.setDate(hariIni.getDate() + 30);

    return produkDenganExp.filter((p) => {
      const matchSearch = p.nama.toLowerCase().includes(pencarian.toLowerCase()) || p.kode.toLowerCase().includes(pencarian.toLowerCase());
      
      const expDate = new Date(p.expired_date!);
      const isLewat = expDate < hariIni;
      const isMendekati = expDate >= hariIni && expDate <= batasMendekati;

      const matchTime =
        filterWaktu === 'semua' ||
        (filterWaktu === 'lewat' && isLewat) ||
        (filterWaktu === 'mendekati' && isMendekati);

      return matchSearch && matchTime && (isLewat || isMendekati);
    });
  }, [produkDenganExp, pencarian, filterWaktu]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/stok" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon size={14} /> Stok
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            Kadaluarsa
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <ShiftIcon size={24} style={{ color: 'var(--primary)' }} /> Pemantauan Kadaluarsa
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Lacak produk yang telah melewati batas layak konsumsi atau akan segera kadaluarsa dalam waktu dekat.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Terancam */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Total Bermasalah</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.total} SKU</p>
        </div>

        {/* Sudah Kadaluarsa */}
        <button
          onClick={() => setFilterWaktu('lewat')}
          className="rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${filterWaktu === 'lewat' ? 'var(--danger)' : 'var(--border)'}`,
            boxShadow: filterWaktu === 'lewat' ? '0 0 0 1px var(--danger)' : 'var(--shadow-sm)',
          }}
        >
          <p className="text-xs font-semibold flex items-center" style={{ color: 'var(--text-tertiary)' }}>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" /> Sudah Kadaluarsa
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--danger)' }}>{stats.lewatCount} SKU</p>
        </button>

        {/* Hampir Kadaluarsa */}
        <button
          onClick={() => setFilterWaktu('mendekati')}
          className="rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${filterWaktu === 'mendekati' ? 'var(--warning)' : 'var(--border)'}`,
            boxShadow: filterWaktu === 'mendekati' ? '0 0 0 1px var(--warning)' : 'var(--shadow-sm)',
          }}
        >
          <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
            <ShiftIcon size={14} className="text-amber-500" /> Hampir Kadaluarsa (≤ 30 hari)
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--warning)' }}>{stats.mendekatiCount} SKU</p>
        </button>
      </div>

      {/* Main List */}
      <div
        className="rounded-xl p-5 space-y-4 w-full max-w-full min-w-0 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterWaktu('semua')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: filterWaktu === 'semua' ? 'var(--primary)' : 'var(--bg)',
                color: filterWaktu === 'semua' ? 'white' : 'var(--text-secondary)',
              }}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterWaktu('lewat')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: filterWaktu === 'lewat' ? 'var(--danger-light)' : 'var(--bg)',
                color: filterWaktu === 'lewat' ? 'var(--danger)' : 'var(--text-secondary)',
              }}
            >
              Sudah Expired
            </button>
            <button
              onClick={() => setFilterWaktu('mendekati')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: filterWaktu === 'mendekati' ? 'var(--warning-light)' : 'var(--bg)',
                color: filterWaktu === 'mendekati' ? 'var(--warning)' : 'var(--text-secondary)',
              }}
            >
              Hampir Expired
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari produk..."
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Tabel */}
        <div className="hidden md:block overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Kode</th>
                <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Produk</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Stok</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Tanggal Kadaluarsa</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Sisa Hari</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {listFiltered.map((p) => {
                const hariIni = new Date();
                const expDate = new Date(p.expired_date!);
                const diffTime = expDate.getTime() - hariIni.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isLewat = diffDays <= 0;

                return (
                  <tr key={p.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                    <td className="p-3 font-semibold">{p.kode}</td>
                    <td className="p-3 text-sm font-medium">{p.nama}</td>
                    <td className="p-3 text-center font-bold">
                      {p.stok} {p.satuan}
                    </td>
                    <td className="p-3 text-center font-semibold" style={{ color: isLewat ? 'var(--danger)' : 'var(--warning)' }}>
                      {p.expired_date}
                    </td>
                    <td className="p-3 text-center font-bold" style={{ color: isLewat ? 'var(--danger)' : 'var(--warning)' }}>
                      {isLewat ? `Lewat ${Math.abs(diffDays)} hari` : `${diffDays} hari lagi`}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                        style={{
                          background: isLewat ? 'var(--danger-light)' : 'var(--warning-light)',
                          color: isLewat ? 'var(--danger)' : 'var(--warning)',
                        }}
                      >
                        {isLewat ? 'Kadaluarsa' : 'Mendekati'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Link
                          href={`/stok/opname?produk_id=${p.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors"
                          style={{ background: isLewat ? 'var(--danger)' : 'var(--warning)' }}
                        >
                          {isLewat ? 'Buang (Opname)' : 'Sesuaikan'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {listFiltered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                      <ShiftIcon size={48} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Tidak ada produk kadaluarsa atau mendekati kadaluarsa yang ditemukan
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {listFiltered.map((p) => {
            const hariIni = new Date();
            const expDate = new Date(p.expired_date!);
            const diffTime = expDate.getTime() - hariIni.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isLewat = diffDays <= 0;
            return (
              <div key={p.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                {/* Header: Nama & Status */}
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
                      background: isLewat ? 'var(--danger-light)' : 'var(--warning-light)',
                      color: isLewat ? 'var(--danger)' : 'var(--warning)',
                    }}
                  >
                    {isLewat ? 'Kadaluarsa' : 'Mendekati'}
                  </span>
                </div>

                {/* Info Detail: Stok, Expired Date & Sisa Hari */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Stok Tersedia</p>
                    <p className="font-bold mt-0.5">{p.stok} {p.satuan}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Tanggal Kadaluarsa</p>
                    <p className="font-semibold mt-0.5" style={{ color: isLewat ? 'var(--danger)' : 'var(--warning)' }}>{p.expired_date}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Selisih Waktu</p>
                    <p className="font-bold mt-0.5 text-xs" style={{ color: isLewat ? 'var(--danger)' : 'var(--warning)' }}>
                      {isLewat ? `Lewat ${Math.abs(diffDays)} hari!` : `${diffDays} hari lagi`}
                    </p>
                  </div>
                </div>

                {/* Footer: Quick Action */}
                <div className="flex items-center justify-end pt-1">
                  <Link
                    href={`/stok/opname?produk_id=${p.id}`}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition-colors"
                    style={{ background: isLewat ? 'var(--danger)' : 'var(--warning)' }}
                  >
                    {isLewat ? 'Buang (Opname)' : 'Sesuaikan'}
                  </Link>
                </div>
              </div>
            );
          })}

          {listFiltered.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                <ShiftIcon size={48} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Tidak ada produk kadaluarsa atau mendekati kadaluarsa yang ditemukan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
