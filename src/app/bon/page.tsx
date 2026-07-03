/**
 * bon/page.tsx
 * Halaman Bon / Piutang Pelanggan.
 * Mengelola piutang toko, pencatatan pembayaran cicilan, dan status jatuh tempo.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import * as Icons from '@/components/ui/Icons';

function formatWaktuLokal(isoString: string): string {
  try {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

export default function ManajemenBon() {
  const { pelangganList, updatePelanggan } = useData();

  const [pencarian, setPencarian] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'limit'>('semua');
  
  // Pay Credit State
  const [pelangganDipilih, setPelangganDipilih] = useState<number | null>(null);
  const [nominalBayar, setNominalBayar] = useState('');
  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'transfer'>('tunai');
  const [catatanCicilan, setCatatanCicilan] = useState('');
  const [riwayatCicilan, setRiwayatCicilan] = useState<{ tanggal: string; nama: string; nominal: number; metode: string }[]>([]);

  const fetchRiwayat = async () => {
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

      const resp = await fetch(`${baseUrl}/api/bon/cicilan/terakhir`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.sukses && Array.isArray(json.data)) {
          setRiwayatCicilan(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching cicilan history:', e);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  // Filters & Pagination States
  const [sortKey, setSortKey] = useState<string>('bon-desc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Filter customers with active debt or limit issues
  const pelangganBerhutang = useMemo(() => {
    return pelangganList.filter((m) => m.total_bon > 0);
  }, [pelangganList]);

  // Calculate global summary
  const summary = useMemo(() => {
    let totalPiutang = 0;
    let jumlahDebitur = pelangganBerhutang.length;
    let mendekatiLimit = 0;

    pelangganBerhutang.forEach((m) => {
      totalPiutang += m.total_bon;
      if (m.total_bon >= m.limit_bon * 0.8) {
        mendekatiLimit++;
      }
    });

    return { totalPiutang, jumlahDebitur, mendekatiLimit };
  }, [pelangganBerhutang]);

  // Filter lists based on search & tab select
  const filteredList = useMemo(() => {
    return pelangganBerhutang.filter((m) => {
      const matchSearch = m.nama.toLowerCase().includes(pencarian.toLowerCase()) || m.nomor_hp.includes(pencarian);
      
      const matchTab =
        filterStatus === 'semua' ||
        (filterStatus === 'aktif' && m.total_bon > 0) ||
        (filterStatus === 'limit' && m.total_bon >= m.limit_bon * 0.8);

      return matchSearch && matchTab;
    });
  }, [pelangganBerhutang, pencarian, filterStatus]);

  // Sort list
  const listSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...filteredList].sort((a, b) => {
      let valA: any = a[field === 'bon' ? 'total_bon' : field === 'limit' ? 'limit_bon' : (field as keyof typeof a)];
      let valB: any = b[field === 'bon' ? 'total_bon' : field === 'limit' ? 'limit_bon' : (field as keyof typeof b)];
      
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return order === 'asc' ? numA - numB : numB - numA;
      }
    });
  }, [filteredList, sortKey]);

  // Total pages
  const totalHalaman = Math.ceil(listSorted.length / itemPerHalaman) || 1;

  // Paginated list
  const listPaginasi = useMemo(() => {
    const start = (halaman - 1) * itemPerHalaman;
    return listSorted.slice(start, start + itemPerHalaman);
  }, [listSorted, halaman]);

  // Handle Pay Credit
  const selectedPelangganObj = useMemo(() => {
    if (pelangganDipilih === null) return null;
    return pelangganList.find((p) => p.id === pelangganDipilih) || null;
  }, [pelangganList, pelangganDipilih]);

  async function handleBayarBon(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPelangganObj || !nominalBayar) return;

    const nominal = parseFloat(nominalBayar);
    if (nominal <= 0 || nominal > selectedPelangganObj.total_bon) {
      alert('Nominal cicilan tidak valid atau melebihi total bon.');
      return;
    }

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

      const resp = await fetch(`${baseUrl}/api/bon/member/${selectedPelangganObj.id}/bayar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nominal,
          metode: metodeBayar,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.sukses) {
          const sisaBon = selectedPelangganObj.total_bon - nominal;
          updatePelanggan(selectedPelangganObj.id, {
            total_bon: sisaBon,
          });

          await fetchRiwayat();
          alert('Pembayaran cicilan berhasil disimpan.');
        } else {
          alert('Gagal menyimpan cicilan: ' + (json.pesan || 'Error'));
        }
      } else {
        alert('Gagal mengirim data cicilan ke server.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    }

    setPelangganDipilih(null);
    setNominalBayar('');
    setCatatanCicilan('');
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Bon & Piutang Pelanggan
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Kelola piutang, batas kredit (limit bon), dan riwayat cicilan pelanggan.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Piutang */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Piutang Toko</span>
            <Icons.ReceiptIcon className="text-red-500" />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--danger)' }}>
            {formatRupiah(summary.totalPiutang)}
          </p>
          <p className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: 'var(--text-tertiary)' }}>Dari {summary.jumlahDebitur} pelanggan aktif</p>
        </div>

        {/* Jumlah Debitur */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pelanggan Berbon</span>
            <Icons.UsersIcon style={{ color: 'var(--primary)' }} />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {summary.jumlahDebitur} orang
          </p>
          <p className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: 'var(--text-tertiary)' }}>Butuh pemantauan pembayaran</p>
        </div>

        {/* Mendekati Limit */}
        <button
          onClick={() => setFilterStatus('limit')}
          className="rounded-xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${filterStatus === 'limit' ? 'var(--warning)' : 'var(--border)'}`,
            boxShadow: filterStatus === 'limit' ? '0 4px 12px rgba(234,179,8,0.1)' : 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mendekati Limit (≥ 80%)</span>
            <Icons.BellIcon className="text-amber-500 animate-bounce" />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--warning)' }}>
            {summary.mendekatiLimit} orang
          </p>
          <p className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: 'var(--text-tertiary)' }}>Limit transaksi hampir habis</p>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">
        {/* Kolom Kiri: Tabel Piutang */}
        <div
          className="lg:col-span-2 rounded-xl p-5 space-y-4 w-full max-w-full min-w-0 overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Daftar Bon Aktif
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Icons.SearchIcon size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Cari pelanggan..."
                  value={pencarian}
                  onChange={(e) => { setPencarian(e.target.value); setHalaman(1); }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <select
                  value={sortKey}
                  onChange={(e) => { setSortKey(e.target.value); setHalaman(1); }}
                  className="w-full px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="bon-desc">Bon Terbesar</option>
                  <option value="bon-asc">Bon Terkecil</option>
                  <option value="nama-asc">Nama (A-Z)</option>
                  <option value="nama-desc">Nama (Z-A)</option>
                  <option value="limit-desc">Limit Bon Terbesar</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full max-w-full min-w-0 hidden md:block">
            <table className="w-full min-w-[800px] text-left text-xs border-collapse">
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Pelanggan</th>
                  <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Sisa Bon</th>
                  <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Limit Bon</th>
                  <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Penggunaan Limit</th>
                  <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {listPaginasi.map((m) => {
                const percent = Math.min(100, Math.round((m.total_bon / m.limit_bon) * 100)) || 0;
                const isLimitWarning = percent >= 80;
                return (
                  <tr key={m.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                    <td className="p-3">
                      <p className="font-bold text-sm">{m.nama}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{m.nomor_hp}</p>
                    </td>
                    <td className="p-3 text-right font-bold text-red-500">
                      {formatRupiah(m.total_bon)}
                    </td>
                    <td className="p-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {formatRupiah(m.limit_bon)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-24 mx-auto">
                        <div className="flex justify-between text-[9px] mb-1 font-semibold" style={{ color: isLimitWarning ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percent}%`,
                              background: isLimitWarning ? 'var(--danger)' : 'var(--primary)',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setPelangganDipilih(m.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors"
                        style={{ background: 'var(--primary)' }}
                      >
                        <Icons.ReceiptIcon size={14} /> Cicil Bon
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                      <Icons.ReceiptIcon size={48} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                      Tidak ada piutang aktif yang cocok dengan kriteria
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {listPaginasi.map((m) => {
            const percent = Math.min(100, Math.round((m.total_bon / m.limit_bon) * 100)) || 0;
            const isLimitWarning = percent >= 80;
            return (
              <div key={m.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                {/* Header: Nama Pelanggan & Phone */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm leading-tight">{m.nama}</h3>
                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{m.nomor_hp}</p>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                    style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                  >
                    Bon Aktif
                  </span>
                </div>

                {/* Detail Info: Sisa Bon, Limit Bon, Penggunaan Limit */}
                <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Sisa Bon</p>
                    <p className="font-bold mt-0.5 text-red-500">{formatRupiah(m.total_bon)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Limit Bon</p>
                    <p className="font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{formatRupiah(m.limit_bon)}</p>
                  </div>
                  <div className="col-span-2 border-t pt-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-[8px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Penggunaan Limit</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--surface)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            background: isLimitWarning ? 'var(--danger)' : 'var(--primary)',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold shrink-0" style={{ color: isLimitWarning ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {percent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setPelangganDipilih(m.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Icons.ReceiptIcon size={14} /> Cicil Bon
                  </button>
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                <Icons.ReceiptIcon size={48} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Tidak ada piutang aktif yang cocok dengan kriteria
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
              Menampilkan {Math.min(listSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(listSorted.length, halaman * itemPerHalaman)} dari {listSorted.length} debitur
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

        {/* Kolom Kanan: Log Cicilan Terakhir */}
        <div
          className="rounded-xl p-5 space-y-4 shadow-sm h-fit w-full max-w-full min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider pb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            <Icons.ReceiptIcon size={16} style={{ color: 'var(--primary)' }} /> Riwayat Cicilan Terakhir
          </h3>
          <div className="space-y-3.5">
            {riwayatCicilan.map((r, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs border-b pb-2.5 last:border-0 last:pb-0" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{r.nama}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {formatWaktuLokal(r.tanggal)} • <span className="uppercase">{r.metode}</span>
                  </p>
                </div>
                <span className="font-semibold" style={{ color: 'var(--success)' }}>
                  +{formatRupiah(r.nominal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Cicil Bon */}
      {pelangganDipilih !== null && selectedPelangganObj && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
            onClick={() => setPelangganDipilih(null)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <form
              onSubmit={handleBayarBon}
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Icons.ReceiptIcon style={{ color: 'var(--primary)' }} /> Pembayaran Cicilan Bon
                </h2>
                <button
                  type="button"
                  onClick={() => setPelangganDipilih(null)}
                  className="text-lg"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-4">
                <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pelanggan</p>
                  <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedPelangganObj.nama}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3" style={{ borderTop: '1px dashed var(--border)' }}>
                    <div>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>TOTAL BON AKTIF</p>
                      <p className="text-sm font-bold text-red-500">{formatRupiah(selectedPelangganObj.total_bon)}</p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>LIMIT BON</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatRupiah(selectedPelangganObj.limit_bon)}</p>
                    </div>
                  </div>
                </div>

                {/* Nominal Bayar */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nominal Pembayaran (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    max={selectedPelangganObj.total_bon}
                    min="100"
                    placeholder="Masukkan jumlah cicilan..."
                    value={nominalBayar}
                    onChange={(e) => setNominalBayar(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-base font-bold text-right"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {/* Quick buttons */}
                  <div className="flex gap-2 mt-2">
                    {[50000, 100000, selectedPelangganObj.total_bon].filter(v => v <= selectedPelangganObj.total_bon).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setNominalBayar(v.toString())}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        {v === selectedPelangganObj.total_bon ? 'Lunas' : formatRupiah(v)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['tunai', 'transfer'].map((met) => (
                      <button
                        key={met}
                        type="button"
                        onClick={() => setMetodeBayar(met as 'tunai' | 'transfer')}
                        className="py-2 rounded-lg text-xs font-medium capitalize transition-all"
                        style={{
                          background: metodeBayar === met ? 'rgba(20,184,166,0.15)' : 'var(--bg)',
                          color: metodeBayar === met ? 'var(--primary)' : 'var(--text-secondary)',
                          border: `1px solid ${metodeBayar === met ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                      >
                        {met === 'tunai' ? 'Tunai' : 'Transfer'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cicilan pertama, pembayaran lunas, titip uang..."
                    value={catatanCicilan}
                    onChange={(e) => setCatatanCicilan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Form Footer */}
              <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <button
                  type="button"
                  onClick={() => setPelangganDipilih(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                  style={{ background: 'var(--primary-gradient)' }}
                >
                  Catat Cicilan
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
