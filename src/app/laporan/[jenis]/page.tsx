/**
 * laporan/[jenis]/page.tsx
 * Halaman detail laporan (Penjualan, Laba Rugi, Mutasi Stok) dengan filter periode waktu.
 */

'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import { StockIcon, ReportIcon, ReceiptIcon, ChevronLeftIcon } from '@/components/ui/Icons';

interface DetailLaporanProps {
  params: Promise<{ jenis: string }>;
}

export default function DetailLaporanJenis({ params }: DetailLaporanProps) {
  const { jenis } = use(params);
  const { transaksiList, produkList, stokBatchList } = useData();

  const [periode, setPeriode] = useState<'hari' | 'bulan'>('hari');

  const handleEkspor = async (format: 'csv' | 'pdf') => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const authDataStr = localStorage.getItem('tokiva_auth');
      let token = '';
      if (authDataStr) {
        try {
          const authData = JSON.parse(authDataStr);
          token = authData.access_token || '';
        } catch {}
      }

      const tglMulai = new Date();
      if (periode === 'bulan') {
        tglMulai.setDate(1);
      }
      tglMulai.setHours(0, 0, 0, 0);

      const tglSelesai = new Date();
      tglSelesai.setHours(23, 59, 59, 999);

      const query = new URLSearchParams({
        jenis,
        format,
        tgl_mulai: tglMulai.toISOString(),
        tgl_selesai: tglSelesai.toISOString(),
      });

      const resp = await fetch(`${baseUrl}/api/laporan/ekspor?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.sukses && json.data?.url) {
          window.open(json.data.url, '_blank');
        } else {
          alert('Gagal mengekspor laporan: ' + (json.pesan || 'Format salah'));
        }
      } else {
        alert('Gagal mengekspor laporan dari server.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan koneksi.');
    }
  };

  // Filters & Pagination States
  const [pencarian, setPencarian] = useState('');
  const [sortKey, setSortKey] = useState('tanggal-desc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Filter & Sort transaksi
  const txFiltered = useMemo(() => {
    return transaksiList.filter((tx) => {
      const matchSearch = tx.no_transaksi.toLowerCase().includes(pencarian.toLowerCase());
      return matchSearch;
    });
  }, [transaksiList, pencarian]);

  const txSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...txFiltered].sort((a, b) => {
      if (field === 'tanggal') {
        const dateA = new Date(`${a.tanggal}T${a.waktu || '00:00:00'}`);
        const dateB = new Date(`${b.tanggal}T${b.waktu || '00:00:00'}`);
        return order === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else {
        return order === 'asc' ? a.total - b.total : b.total - a.total;
      }
    });
  }, [txFiltered, sortKey]);

  const totalTxHalaman = Math.ceil(txSorted.length / itemPerHalaman) || 1;

  const txPaginasi = useMemo(() => {
    const start = (halaman - 1) * itemPerHalaman;
    return txSorted.slice(start, start + itemPerHalaman);
  }, [txSorted, halaman]);

  // Stok Batch states
  const [pencarianStok, setPencarianStok] = useState('');
  const [sortKeyStok, setSortKeyStok] = useState('tanggal-desc');
  const [halamanStok, setHalamanStok] = useState(1);

  const stokFiltered = useMemo(() => {
    return stokBatchList.filter((batch) => {
      const prod = produkList.find((p) => p.id === batch.produk_id);
      const namaProduk = prod ? prod.nama.toLowerCase() : '';
      return (batch.batch_no?.toLowerCase() || '').includes(pencarianStok.toLowerCase()) || namaProduk.includes(pencarianStok.toLowerCase());
    });
  }, [stokBatchList, produkList, pencarianStok]);

  const stokSorted = useMemo(() => {
    const [field, order] = sortKeyStok.split('-');
    return [...stokFiltered].sort((a, b) => {
      if (field === 'tanggal') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return order === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else { // qty
        return order === 'asc' ? a.qty_masuk - b.qty_masuk : b.qty_masuk - a.qty_masuk;
      }
    });
  }, [stokFiltered, sortKeyStok]);

  const totalStokHalaman = Math.ceil(stokSorted.length / itemPerHalaman) || 1;

  const stokPaginasi = useMemo(() => {
    const start = (halamanStok - 1) * itemPerHalaman;
    return stokSorted.slice(start, start + itemPerHalaman);
  }, [stokSorted, halamanStok]);

  // Title configuration
  const titleInfo = useMemo(() => {
    switch (jenis) {
      case 'penjualan':
        return { nama: 'Laporan Penjualan Harian', desc: 'Rincian omzet harian dan volume transaksi.' };
      case 'laba-rugi':
        return { nama: 'Laporan Laba Rugi', desc: 'Analisis laba kotor, HPP, marjin bersih.' };
      case 'mutasi-stok':
        return { nama: 'Laporan Mutasi & Pergerakan Stok', desc: 'Pantau barang masuk dan opname penyesuaian.' };
      default:
        return { nama: 'Laporan Bisnis', desc: 'Rangkuman metrik bisnis.' };
    }
  }, [jenis]);

  const IconComp = useMemo(() => {
    switch (jenis) {
      case 'penjualan': return StockIcon;
      case 'laba-rugi': return ReportIcon;
      case 'mutasi-stok': return ReceiptIcon;
      default: return ReportIcon;
    }
  }, [jenis]);

  // Dynamic Calculation based on chosen report
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/laporan" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon size={14} /> Laporan
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            {titleInfo.nama}
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <IconComp size={24} style={{ color: 'var(--primary)' }} /> {titleInfo.nama}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {titleInfo.desc}
        </p>
      </div>

      {/* Filter Periode */}
      <div
        className="rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex gap-2">
          {['hari', 'bulan'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p as any)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors capitalize"
              style={{
                background: periode === p ? 'var(--primary)' : 'var(--bg)',
                color: periode === p ? 'white' : 'var(--text-secondary)',
              }}
            >
              {p === 'hari' ? 'Hari Ini' : 'Bulan Ini'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEkspor('csv')}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-colors hover:opacity-80"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
          >
            Ekspor CSV (Excel)
          </button>
          <button
            onClick={() => handleEkspor('pdf')}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-colors hover:opacity-80 text-white"
            style={{ background: 'var(--primary-gradient)', borderColor: 'var(--primary)' }}
          >
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* Dynamic Content Area */}
      {/* Dynamic Content Area */}
      {jenis === 'penjualan' && (
        <div
          className="rounded-xl p-5 space-y-4 w-full max-w-full min-w-0 overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-bold animate-fade-in" style={{ color: 'var(--text-primary)' }}>
              Daftar Transaksi Terkini
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari No. Invoice..."
                  value={pencarian}
                  onChange={(e) => { setPencarian(e.target.value); setHalaman(1); }}
                  className="w-full pl-3 pr-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <select
                  value={sortKey}
                  onChange={(e) => { setSortKey(e.target.value); setHalaman(1); }}
                  className="w-full px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="tanggal-desc">Tanggal Terbaru</option>
                  <option value="tanggal-asc">Tanggal Terlama</option>
                  <option value="total-desc">Nominal Terbesar</option>
                  <option value="total-asc">Nominal Terkecil</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full max-w-full min-w-0 hidden md:block">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>No. Invoice</th>
                  <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Waktu</th>
                  <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Total Belanja</th>
                  <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {txPaginasi.map((tx) => (
                  <tr key={tx.id} style={{ color: 'var(--text-primary)' }}>
                    <td className="p-3 font-semibold">{tx.no_transaksi}</td>
                    <td className="p-3">{tx.tanggal} {tx.waktu}</td>
                    <td className="p-3 text-right font-bold" style={{ color: 'var(--primary)' }}>{formatRupiah(tx.total)}</td>
                    <td className="p-3 text-center capitalize font-semibold">{tx.status}</td>
                  </tr>
                ))}
                {txFiltered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                      Belum ada transaksi terekam
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card List Mobile */}
          <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
            {txPaginasi.map((tx) => (
              <div key={tx.id} className="py-3.5 space-y-3" style={{ color: 'var(--text-primary)' }}>
                {/* Header: No. Invoice & Status */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs">{tx.no_transaksi}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: 'var(--bg)', color: 'var(--primary)' }}>
                    {tx.status}
                  </span>
                </div>

                {/* Detail Info: Waktu, Total Belanja */}
                <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Waktu</p>
                    <p className="font-semibold mt-0.5">{tx.tanggal} {tx.waktu}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Total Belanja</p>
                    <p className="font-bold mt-0.5 text-xs" style={{ color: 'var(--primary)' }}>{formatRupiah(tx.total)}</p>
                  </div>
                </div>
              </div>
            ))}
            {txFiltered.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                Belum ada transaksi terekam
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalTxHalaman > 1 && (
            <div
              className="px-4 py-3 flex items-center justify-between shadow-sm border-t"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Menampilkan {Math.min(txSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(txSorted.length, halaman * itemPerHalaman)} dari {txSorted.length} transaksi
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
                {Array.from({ length: totalTxHalaman }, (_, i) => i + 1).map((pNum) => (
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
                  disabled={halaman === totalTxHalaman}
                  onClick={() => setHalaman((h) => Math.min(totalTxHalaman, h + 1))}
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
      )}

      {jenis === 'laba-rugi' && (
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            Rincian Pendapatan & Pengeluaran HPP
          </h2>
          
          {(() => {
            let omzet = 0;
            let hpp = 0;
            transaksiList.forEach((tx) => {
              omzet += Number(tx.total);
              tx.detail?.forEach((item) => {
                const prod = produkList.find((p) => p.id === item.produk_id);
                hpp += (prod ? Number(prod.harga_beli) : Number(item.harga_satuan) * 0.7) * item.qty;
              });
            });
            const labaKotor = omzet - hpp;

            return (
              <div className="space-y-4 text-sm max-w-md">
                <div className="flex justify-between font-medium">
                  <span style={{ color: 'var(--text-secondary)' }}>Total Pendapatan (Omzet)</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatRupiah(omzet)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span style={{ color: 'var(--text-secondary)' }}>Harga Pokok Penjualan (HPP)</span>
                  <span className="text-red-500">-{formatRupiah(hpp)}</span>
                </div>
                <hr style={{ borderColor: 'var(--border)' }} />
                <div className="flex justify-between font-bold text-base">
                  <span style={{ color: 'var(--text-primary)' }}>Laba Kotor</span>
                  <span style={{ color: 'var(--success)' }}>{formatRupiah(labaKotor)}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>Persentase Margin Bersih</span>
                  <span>{((labaKotor / (omzet || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {jenis === 'mutasi-stok' && (
        <div
          className="rounded-xl p-5 space-y-4 w-full max-w-full min-w-0 overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Log Transaksi Stok & Restock
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari Batch / Produk..."
                  value={pencarianStok}
                  onChange={(e) => { setPencarianStok(e.target.value); setHalamanStok(1); }}
                  className="w-full pl-3 pr-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <select
                  value={sortKeyStok}
                  onChange={(e) => { setSortKeyStok(e.target.value); setHalamanStok(1); }}
                  className="w-full px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="tanggal-desc">Tanggal Terbaru</option>
                  <option value="tanggal-asc">Tanggal Terlama</option>
                  <option value="qty-desc">Kuantitas Terbanyak</option>
                  <option value="qty-asc">Kuantitas Tersedikit</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full max-w-full min-w-0 hidden md:block">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Batch</th>
                  <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Produk</th>
                  <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Kuantitas Masuk</th>
                  <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Tanggal Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {stokPaginasi.map((batch) => {
                  const prod = produkList.find((p) => p.id === batch.produk_id);
                  return (
                    <tr key={batch.id} style={{ color: 'var(--text-primary)' }}>
                      <td className="p-3 font-semibold">{batch.batch_no}</td>
                      <td className="p-3 font-medium">{prod ? prod.nama : 'Produk dihapus'}</td>
                      <td className="p-3 text-center font-bold">+{batch.qty_masuk}</td>
                      <td className="p-3 text-center">{batch.created_at.slice(0, 10)}</td>
                    </tr>
                  );
                })}
                {stokFiltered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                      Belum ada mutasi restock tercatat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card List Mobile */}
          <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
            {stokPaginasi.map((batch) => {
              const prod = produkList.find((p) => p.id === batch.produk_id);
              return (
                <div key={batch.id} className="py-3.5 space-y-3" style={{ color: 'var(--text-primary)' }}>
                  {/* Header: Batch No & Tanggal Masuk */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">{batch.batch_no}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {batch.created_at.slice(0, 10)}
                    </span>
                  </div>

                  {/* Detail Info: Nama Produk, Qty Masuk */}
                  <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                    <div className="col-span-2">
                      <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Nama Produk</p>
                      <p className="font-semibold mt-0.5">{prod ? prod.nama : 'Produk dihapus'}</p>
                    </div>
                    <div className="col-span-2 border-t pt-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Kuantitas Masuk</p>
                      <p className="font-bold mt-0.5 text-xs" style={{ color: 'var(--primary)' }}>+{batch.qty_masuk} unit</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {stokFiltered.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                Belum ada mutasi restock tercatat
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalStokHalaman > 1 && (
            <div
              className="px-4 py-3 flex items-center justify-between shadow-sm border-t"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Menampilkan {Math.min(stokSorted.length, (halamanStok - 1) * itemPerHalaman + 1)} - {Math.min(stokSorted.length, halamanStok * itemPerHalaman)} dari {stokSorted.length} record
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={halamanStok === 1}
                  onClick={() => setHalamanStok((h) => Math.max(1, h - 1))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  &larr; Prev
                </button>
                {Array.from({ length: totalStokHalaman }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setHalamanStok(pNum)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
                    style={{
                      background: halamanStok === pNum ? 'var(--primary)' : 'var(--surface)',
                      color: halamanStok === pNum ? 'white' : 'var(--text-secondary)',
                      border: halamanStok === pNum ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  disabled={halamanStok === totalStokHalaman}
                  onClick={() => setHalamanStok((h) => Math.min(totalStokHalaman, h + 1))}
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
      )}
    </div>
  );
}
