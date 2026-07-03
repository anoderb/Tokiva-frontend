/**
 * shift/page.tsx
 * Halaman manajemen shift kasir (buka shift, tutup shift, hitung uang kas, hitung selisih).
 * Menghitung otomatis dari transaksi lunas/tunai di register.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/format_rupiah';
import { LockIcon, ReceiptIcon, PlusIcon } from '@/components/ui/Icons';

function formatWaktuLokal(isoString: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString;
  }
}

interface RiwayatShift {
  id: number;
  kasir: string;
  waktuBuka: string;
  waktuTutup: string | null;
  modalAwal: number;
  uangSistem: number;
  uangFisik: number | null;
  selisih: number | null;
  status: 'buka' | 'tutup';
}

export default function ShiftKasir() {
  const { transaksiList, shiftAktif, setShiftAktif, bukaShift, tutupShift } = useData();
  const { isAdmin, pengguna } = useAuth();

  // Shift state in localStorage
  const [riwayatList, setRiwayatList] = useState<RiwayatShift[]>([]);

  // Filter history list for cashier
  const riwayatListFiltered = useMemo(() => {
    if (isAdmin) return riwayatList;
    return riwayatList.filter((r) => r.kasir === pengguna?.nama || r.kasir === 'Budi Santoso');
  }, [riwayatList, isAdmin, pengguna]);

  // Form State
  const [modalAwalInput, setModalAwalInput] = useState('100000');
  const [uangFisikInput, setUangFisikInput] = useState('');
  const [catatanTutup, setCatatanTutup] = useState('');
  
  const [tampilModalBuka, setTampilModalBuka] = useState(false);
  const [tampilModalTutup, setTampilModalTutup] = useState(false);

  // Fetch shift history from backend
  useEffect(() => {
    async function fetchShiftHistory() {
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
        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        };

        const resp = await fetch(`${baseUrl}/api/shift/riwayat`, { headers });
        if (resp.ok) {
          const json = await resp.json();
          if (json.sukses && Array.isArray(json.data)) {
            const mapped: RiwayatShift[] = json.data.map((s: any) => ({
              id: s.id,
              kasir: s.user?.nama || 'Kasir',
              waktuBuka: s.waktu_buka,
              waktuTutup: s.waktu_tutup,
              modalAwal: Number(s.modal_awal),
              uangSistem: Number(s.modal_awal) + Number(s.total_tunai),
              uangFisik: s.waktu_tutup ? Number(s.modal_awal) + Number(s.total_tunai) + Number(s.total_selisih) : null,
              selisih: s.waktu_tutup ? Number(s.total_selisih) : null,
              status: s.status,
            }));
            setRiwayatList(mapped);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil riwayat shift:', err);
      }
    }
    fetchShiftHistory();
  }, [shiftAktif]);

  // Calculate current shift dynamic metrics
  const statsHariIni = useMemo(() => {
    let tunai = 0;
    let qris = 0;
    let transfer = 0;
    let bon = 0;
    let total = 0;

    // We assume transactions for the active shift (since it was opened)
    if (shiftAktif) {
      const tglBuka = new Date(shiftAktif.waktuBuka);
      transaksiList.forEach((tx) => {
        const tglTx = new Date(tx.created_at);
        if (tglTx >= tglBuka) {
          total += Number(tx.total);
          
          if (tx.pembayaran && tx.pembayaran.length > 0) {
            tx.pembayaran.forEach((p) => {
              const nominal = Number(p.nominal) || 0;
              const metode = p.metode?.toLowerCase();
              if (metode === 'tunai') {
                tunai += nominal;
              } else if (metode === 'qris') {
                qris += nominal;
              } else if (metode === 'transfer') {
                transfer += nominal;
              } else if (metode === 'bon') {
                bon += nominal;
              } else if (metode === 'voucher') {
                qris += nominal; // voucher dimasukkan ke kategori non-tunai/qris
              }
            });
            // Uang kembalian diambil dari kas tunai
            const kembalian = Number(tx.kembalian) || 0;
            if (kembalian > 0) {
              tunai -= kembalian;
            }
          } else {
            // Fallback jika tidak ada data detail pembayaran
            if (tx.status === 'bon') {
              bon += (Number(tx.total) - Number(tx.bayar));
              tunai += Number(tx.bayar);
            } else {
              const metode = tx.metode_pembayaran?.toLowerCase();
              if (metode === 'qris') {
                qris += Number(tx.total);
              } else if (metode === 'transfer') {
                transfer += Number(tx.total);
              } else if (metode === 'bon') {
                bon += Number(tx.total);
              } else {
                tunai += Number(tx.total);
              }
            }
          }
        }
      });
    }

    return { tunai, qris, transfer, bon, total };
  }, [transaksiList, shiftAktif]);

  const uangSistem = useMemo(() => {
    if (!shiftAktif) return 0;
    return Number(shiftAktif.modalAwal) + Number(statsHariIni.tunai); // Starting cash + cash sales
  }, [shiftAktif, statsHariIni.tunai]);

  const selisihUang = useMemo(() => {
    if (uangFisikInput === '') return 0;
    return parseFloat(uangFisikInput) - uangSistem;
  }, [uangFisikInput, uangSistem]);

  // Buka Shift
  async function handleBukaShift(e: React.FormEvent) {
    e.preventDefault();
    const modal = parseFloat(modalAwalInput) || 0;
    
    // Call backend API
    const res = await bukaShift(modal, 'Buka shift register');
    if (!res.sukses) {
      alert(res.pesan);
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newShift: RiwayatShift = {
      id: res.data?.id || Date.now(),
      kasir: pengguna?.nama || 'Budi Santoso', // Active cashier name
      waktuBuka: nowStr,
      waktuTutup: null,
      modalAwal: modal,
      uangSistem: modal,
      uangFisik: null,
      selisih: null,
      status: 'buka',
    };

    setShiftAktif(newShift);
    localStorage.setItem('tokiva_shift_aktif', JSON.stringify(newShift));
    setTampilModalBuka(false);
  }

  // Tutup Shift
  async function handleTutupShift(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftAktif || uangFisikInput === '') return;

    const fisik = parseFloat(uangFisikInput);

    // Call backend API
    const res = await tutupShift(fisik, catatanTutup || 'Tutup shift register');
    if (!res.sukses) {
      alert(res.pesan);
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const closedShift: RiwayatShift = {
      ...shiftAktif,
      waktuTutup: nowStr,
      uangSistem: uangSistem,
      uangFisik: fisik,
      selisih: selisihUang,
      status: 'tutup',
    };

    setShiftAktif(null);
    localStorage.removeItem('tokiva_shift_aktif');
    
    setTampilModalTutup(false);
    setUangFisikInput('');
    setCatatanTutup('');
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Manajemen Shift Kasir
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Buka shift, tutup shift, dan audit laci kas (rekonsiliasi uang kas).
          </p>
        </div>
        {!shiftAktif ? (
          <button
            onClick={() => setTampilModalBuka(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
            style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
          >
            <PlusIcon size={16} /> Buka Shift Baru
          </button>
        ) : (
          <button
            onClick={() => setTampilModalTutup(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
            style={{ background: 'var(--danger)' }}
          >
            <LockIcon size={16} /> Tutup Shift Aktif
          </button>
        )}
      </div>

      {/* Active Shift Panel */}
      {shiftAktif ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Status Shift Aktif */}
          <div
            className="lg:col-span-2 rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between pb-3 animate-pulse" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Shift Kasir Sedang Aktif
                </h2>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                Running
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Nama Kasir</p>
                <p className="font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{shiftAktif.kasir}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Waktu Buka</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{shiftAktif.waktuBuka} WIB</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Modal Awal Kas (Laci)</p>
                <p className="font-bold mt-0.5" style={{ color: 'var(--primary)' }}>{formatRupiah(shiftAktif.modalAwal)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Total Penjualan Shift ini</p>
                <p className="font-bold mt-0.5" style={{ color: 'var(--primary)' }}>+{formatRupiah(statsHariIni.total)}</p>
              </div>
            </div>

            {/* Total Uang Laci Kas Sistem */}
            {isAdmin && (
              <div className="p-4 rounded-xl flex items-center justify-between mt-2" style={{ background: 'var(--bg)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Uang Laci Kas Teoritis (Sistem)</span>
                <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatRupiah(uangSistem)}</span>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Rincian Metode */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Rincian Penjualan Shift
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Uang Tunai Masuk:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatRupiah(statsHariIni.tunai)}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>QRIS / Cashless:</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatRupiah(statsHariIni.qris)}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Bank Transfer:</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatRupiah(statsHariIni.transfer)}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Bon / Pembayaran Tempo:</span>
                <span className="font-semibold text-red-500">{formatRupiah(statsHariIni.bon)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>Total Omzet:</span>
                <span className="font-bold" style={{ color: 'var(--primary)' }}>{formatRupiah(statsHariIni.total)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 text-center max-w-lg mx-auto border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-4">
            <LockIcon size={64} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Shift Belum Dibuka</h3>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Sebelum memulai transaksi kasir, Anda harus membuka shift terlebih dahulu dan memasukkan modal awal laci mesin kasir (cash register).
          </p>
          <button
            onClick={() => setTampilModalBuka(true)}
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
            style={{ background: 'var(--primary-gradient)' }}
          >
            Buka Shift Sekarang
          </button>
        </div>
      )}

      {/* Riwayat Shift */}
      <div
        className="rounded-xl p-5 space-y-4 w-full max-w-full min-w-0 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
          Riwayat Shift Kasir Terakhir
        </h2>

        <div className="hidden md:block overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Kasir</th>
                <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Waktu Buka / Tutup</th>
                <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Modal Awal</th>
                {isAdmin && <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Uang Sistem</th>}
                <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Uang Fisik</th>
                {isAdmin && <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Selisih</th>}
                <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {riwayatListFiltered.map((r) => (
                <tr key={r.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  <td className="p-3 font-bold">{r.kasir}</td>
                  <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                    <p>Buka: {formatWaktuLokal(r.waktuBuka)}</p>
                    <p className="mt-0.5">Tutup: {formatWaktuLokal(r.waktuTutup)}</p>
                  </td>
                  <td className="p-3 text-right font-medium">{formatRupiah(r.modalAwal)}</td>
                  {isAdmin && <td className="p-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatRupiah(r.uangSistem)}</td>}
                  <td className="p-3 text-right font-semibold">{r.uangFisik !== null ? formatRupiah(r.uangFisik) : '-'}</td>
                  {isAdmin && (
                    <td
                      className="p-3 text-right font-bold"
                      style={{
                        color:
                          r.selisih === null || r.selisih === 0
                            ? 'var(--success)'
                            : r.selisih > 0
                            ? 'var(--primary)'
                            : 'var(--danger)',
                      }}
                    >
                      {r.selisih === null ? '-' : r.selisih === 0 ? 'Sesuai' : (r.selisih > 0 ? `+${formatRupiah(r.selisih)}` : `-${formatRupiah(Math.abs(r.selisih))}`)}
                    </td>
                  )}
                  <td className="p-3 text-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase"
                      style={{
                        background: r.status === 'buka' ? 'var(--success-light)' : 'var(--danger-light)',
                        color: r.status === 'buka' ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {r.status === 'buka' ? 'Aktif' : 'Tutup'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {riwayatListFiltered.map((r) => (
            <div key={r.id} className="py-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
              {/* Header: Kasir & Status */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm leading-tight">{r.kasir}</h3>
                  <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    ID Shift: {r.id}
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    background: r.status === 'buka' ? 'var(--success-light)' : 'var(--danger-light)',
                    color: r.status === 'buka' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {r.status === 'buka' ? 'Aktif' : 'Tutup'}
                </span>
              </div>

              {/* Info Detail: Waktu & Kas */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                <div className="col-span-2">
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Waktu Buka / Tutup</p>
                  <p className="font-semibold mt-0.5 text-[9px] sm:text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Buka: {formatWaktuLokal(r.waktuBuka)} <br />
                    Tutup: {formatWaktuLokal(r.waktuTutup)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Modal Awal</p>
                  <p className="font-bold mt-0.5">{formatRupiah(r.modalAwal)}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Uang Sistem</p>
                    <p className="font-bold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{formatRupiah(r.uangSistem)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Uang Fisik</p>
                  <p className="font-bold mt-0.5">{r.uangFisik !== null ? formatRupiah(r.uangFisik) : '-'}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Selisih</p>
                    <p className="font-bold mt-0.5" style={{
                      color: r.selisih === null || r.selisih === 0 ? 'var(--success)' : r.selisih > 0 ? 'var(--primary)' : 'var(--danger)'
                    }}>
                      {r.selisih === null ? '-' : r.selisih === 0 ? 'Sesuai' : (r.selisih > 0 ? `+${formatRupiah(r.selisih)}` : `-${formatRupiah(Math.abs(r.selisih))}`)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Buka Shift */}
      {tampilModalBuka && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
            onClick={() => setTampilModalBuka(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 animate-slide-up">
            <form
              onSubmit={handleBukaShift}
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <LockIcon size={18} style={{ color: 'var(--primary)' }} /> Buka Shift Baru
                </h2>
                <button type="button" onClick={() => setTampilModalBuka(false)} className="text-lg">✕</button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Modal Awal Uang Laci (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={modalAwalInput}
                    onChange={(e) => setModalAwalInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-lg font-bold text-right"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Masukkan jumlah pecahan kecil untuk kembalian pembeli awal shift.
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <button
                  type="button"
                  onClick={() => setTampilModalBuka(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'var(--primary-gradient)' }}
                >
                  🚀 Buka Shift
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal Tutup Shift */}
      {tampilModalTutup && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
            onClick={() => setTampilModalTutup(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <form
              onSubmit={handleTutupShift}
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <LockIcon size={18} className="text-red-500" /> Tutup Shift & Audit Uang Kas
                </h2>
                <button type="button" onClick={() => setTampilModalTutup(false)} className="text-lg">✕</button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>UANG LACI SYSTEM</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{formatRupiah(uangSistem)}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Modal Awal ({formatRupiah(shiftAktif?.modalAwal || 0)}) + Tunai Masuk ({formatRupiah(statsHariIni.tunai)})
                  </p>
                </div>

                {/* Uang Fisik */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Total Uang Fisik di Laci Sebenarnya (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Hitung manual uang di laci kas..."
                    value={uangFisikInput}
                    onChange={(e) => setUangFisikInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-lg font-bold text-right"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Selisih Indicator */}
                {uangFisikInput !== '' && (
                  <div
                    className="p-3 rounded-xl flex items-center justify-between text-xs font-bold"
                    style={{
                      background:
                        selisihUang === 0
                          ? 'var(--success-light)'
                          : selisihUang > 0
                          ? 'rgba(20,184,166,0.1)'
                          : 'var(--danger-light)',
                      color:
                        selisihUang === 0
                          ? 'var(--success)'
                          : selisihUang > 0
                          ? 'var(--primary)'
                          : 'var(--danger)',
                    }}
                  >
                    <span>Selisih Audit:</span>
                    <span>
                      {selisihUang === 0 ? 'Sesuai' : (selisihUang > 0 ? `Surplus +${formatRupiah(selisihUang)}` : `Minus -${formatRupiah(Math.abs(selisihUang))}`)}
                    </span>
                  </div>
                )}

                {/* Catatan Alasan */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Catatan Penutupan Shift
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Selisih Rp 5.000 karena kembalian permen..."
                    value={catatanTutup}
                    onChange={(e) => setCatatanTutup(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <button
                  type="button"
                  onClick={() => setTampilModalTutup(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'var(--danger)' }}
                >
                  🔒 Tutup Shift & Audit
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
