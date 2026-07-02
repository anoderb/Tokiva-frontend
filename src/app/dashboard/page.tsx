'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatRupiah, formatRupiahSingkat } from '@/lib/format_rupiah';
import { getSapaan, formatTanggal } from '@/lib/konstanta';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { getStatusStok } from '@/types/produk';
import * as Icons from '@/components/ui/Icons';


export default function HalamanDashboard() {
  const { produkList, pelangganList } = useData();
  const { isAdmin, pengguna } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [sedangMemuat, setSedangMemuat] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

        // Fetch summary
        const resp = await fetch(`${baseUrl}/api/dashboard/summary`, { headers });
        if (resp.ok) {
          const json = await resp.json();
          if (json.sukses) {
            setSummary(json.data);
          }
        }

        // Fetch active shift if user is cashier
        if (pengguna && pengguna.role !== 'admin') {
          const shiftResp = await fetch(`${baseUrl}/api/shift/aktif`, { headers });
          if (shiftResp.ok) {
            const json = await shiftResp.json();
            if (json.sukses) {
              setActiveShift(json.data);
            }
          }
        }
      } catch (e) {
        console.error('Gagal mengambil data dashboard:', e);
      } finally {
        setSedangMemuat(false);
      }
    }
    fetchDashboardData();
  }, [pengguna]);

  const omzetHariIni = summary?.penjualan_hari_ini ?? 0;
  const transaksiHariIni = summary?.jumlah_transaksi_hari_ini ?? 0;
  const rataRataTransaksi = transaksiHariIni > 0 ? (omzetHariIni / transaksiHariIni) : 0;
  const labaHariIni = summary ? (omzetHariIni * 0.15) : 0; // Estimasi laba bersih 15%

  const dataChart = summary?.grafik_penjualan_7_hari?.map((d: any) => ({
    hari: d.tanggal,
    omzet: Number(d.nominal)
  })) ?? [
    { hari: 'Sen', omzet: 0 },
    { hari: 'Sel', omzet: 0 },
    { hari: 'Rab', omzet: 0 },
    { hari: 'Kam', omzet: 0 },
    { hari: 'Jum', omzet: 0 },
    { hari: 'Sab', omzet: 0 },
    { hari: 'Min', omzet: 0 },
  ];
  const maxOmzet = Math.max(...dataChart.map((d: any) => d.omzet)) || 1;

  // Stok warning dari data produk
  const stokBermasalah = produkList
    .filter((p) => {
      const status = getStatusStok(p);
      return status === 'rendah' || status === 'habis';
    })
    .slice(0, 5);

  // Bon jatuh tempo terupdate dari data pelanggan/member
  const bonJatuhTempo = pelangganList
    .filter((m) => m.total_bon > 0)
    .map((m) => ({
      nama: m.nama,
      nominal: m.total_bon,
      jatuhTempo: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0], // H+7
      status: m.total_bon > m.limit_bon * 0.8 ? ('macet' as const) : ('aktif' as const)
    }))
    .slice(0, 5);

  const listBonTampil = summary?.bon_jatuh_tempo ?? bonJatuhTempo;
  const produkTerlarisList = summary?.produk_terlaris ?? [];

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Dashboard Kasir
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {formatTanggal(new Date(), false)} — {getSapaan()}
          </p>
        </div>

        {/* Shift Status Widget */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Icons.ShiftIcon className={activeShift ? 'text-teal-500' : 'text-amber-500 animate-pulse'} size={20} />
                Status Shift Anda: <span className={activeShift ? 'text-teal-600' : 'text-amber-600'}>{activeShift ? 'AKTIF (BUKA)' : 'TUTUP'}</span>
              </h2>
              {activeShift ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Kode Shift</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{activeShift.kode}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Modal Awal</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatRupiah(activeShift.modal_awal)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Total Transaksi</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{activeShift.total_transaksi} Transaksi</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Waktu Buka</span>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">{new Date(activeShift.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Shift Anda belum dibuka. Silakan buka shift terlebih dahulu di halaman Shift sebelum melayani pelanggan.
                </p>
              )}
            </div>
            <div>
              <Link
                href="/shift"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] text-white border-0 cursor-pointer"
                style={{
                  background: 'var(--primary-gradient)',
                  boxShadow: 'var(--shadow-primary)',
                }}
              >
                <Icons.ShiftIcon size={18} />
                {activeShift ? 'Detail Shift Kasir' : 'Buka Shift Baru'}
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
            Akses Pintas Menu Kasir
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { 
                label: 'Transaksi Baru', 
                href: '/kasir', 
                icon: Icons.PlusIcon, 
                desc: 'Menu Checkout Kasir', 
                disabled: !activeShift,
                onClick: () => {
                  if (!activeShift) {
                    alert("Shift kasir belum dibuka! Silakan buka shift terlebih dahulu di halaman Kelola Shift.");
                  }
                }
              },
              { label: 'Riwayat Transaksi', href: '/kasir/riwayat', icon: Icons.ReceiptIcon, desc: 'Cek struk & penjualan' },
              { label: 'Daftar Pelanggan', href: '/pelanggan', icon: Icons.UsersIcon, desc: 'Cari & daftar member' },
              { label: 'Kelola Kasbon', href: '/bon', icon: Icons.PromoIcon, desc: 'Piutang & cicilan member' },
            ].map((act) => {
              const IconComp = act.icon;
              return (
                <Link
                  key={act.label}
                  href={act.disabled ? '#' : act.href}
                  onClick={(e) => {
                    if (act.disabled) {
                      e.preventDefault();
                      if (act.onClick) act.onClick();
                    }
                  }}
                  className={`flex flex-col items-center text-center p-4 rounded-xl transition-all border ${
                    act.disabled 
                      ? 'opacity-40 cursor-not-allowed border-zinc-200' 
                      : 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                  }`}
                  style={{
                    background: 'var(--bg)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <span className={`p-2.5 rounded-xl mb-3 ${act.disabled ? 'bg-zinc-200 text-zinc-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                    <IconComp size={22} />
                  </span>
                  <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{act.label}</span>
                  <span className="block text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{act.desc}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Warnings Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Peringatan Stok */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Icons.BellIcon size={16} className="text-amber-500 animate-pulse" /> Peringatan Stok
            </h2>
            {stokBermasalah.length === 0 ? (
              <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500" /> Semua stok aman
              </p>
            ) : (
              <div className="space-y-2.5">
                {stokBermasalah.map((p) => {
                  const status = getStatusStok(p);
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: status === 'habis' ? 'var(--danger)' : 'var(--warning)' }} />
                      <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.nama}
                      </span>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{
                          background: status === 'habis' ? 'var(--danger-light)' : 'var(--warning-light)',
                          color: status === 'habis' ? 'var(--danger)' : 'var(--warning)',
                        }}
                      >
                        {p.stok} {p.satuan}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bon Jatuh Tempo */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Icons.ReceiptIcon size={16} className="text-red-500" /> Bon Jatuh Tempo
            </h2>
            <div className="space-y-2.5">
              {listBonTampil.length === 0 ? (
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" /> Tidak ada bon jatuh tempo
                </p>
              ) : (
                listBonTampil.map((b: any) => (
                  <div key={b.nama} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0 animate-pulse-dot" style={{ background: b.status === 'macet' ? 'var(--danger)' : 'var(--warning)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {b.nama}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        Jatuh tempo: {b.jatuhTempo ? formatTanggal(b.jatuhTempo) : 'Belum diatur'}
                      </p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: b.status === 'macet' ? 'var(--danger)' : 'var(--warning)' }}>
                      {formatRupiah(b.nominal)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {formatTanggal(new Date(), false)} — {getSapaan()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Omzet Hari Ini',
            nilai: formatRupiah(omzetHariIni),
            icon: Icons.ReceiptIcon,
            warna: '--primary',
          },
          {
            label: 'Transaksi',
            nilai: transaksiHariIni.toString(),
            icon: Icons.CartIcon,
            warna: '--info',
          },
          {
            label: 'Rata² Transaksi',
            nilai: formatRupiah(rataRataTransaksi),
            icon: Icons.StockIcon,
            warna: '--accent',
          },
          {
            label: 'Laba Hari Ini (Est)',
            nilai: formatRupiah(labaHariIni),
            icon: Icons.ReportIcon,
            warna: '--success',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-3 sm:p-4 lg:p-5 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                {card.label}
              </span>
              <span className="text-teal-600 dark:text-teal-400">
                {card.icon && <card.icon size={16} />}
              </span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {card.nilai}
            </p>
          </div>
        ))}
      </div>

      {/* Charts & Top Products Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Bar Chart — Penjualan 7 Hari */}
        <div
          className="lg:col-span-3 rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
            Penjualan 7 Hari Terakhir
          </h2>
          <div className="flex items-end gap-2 h-40">
            {dataChart.map((d: any) => {
              const height = (d.omzet / maxOmzet) * 100;
              return (
                <div key={d.hari} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold" style={{ color: 'var(--text-tertiary)' }}>
                    {formatRupiahSingkat(d.omzet)}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all duration-500 hover:opacity-80 cursor-pointer"
                    style={{
                      height: `${height}%`,
                      background: 'var(--primary-gradient)',
                      minHeight: '8px',
                    }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    {d.hari}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Produk Terlaris */}
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Icons.PromoIcon className="text-teal-500" size={16} /> Produk Terlaris (7 hari)
          </h2>
          <div className="space-y-3">
            {produkTerlarisList.length === 0 ? (
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" /> Belum ada penjualan
              </p>
            ) : (
              produkTerlarisList.map((p: any, i: number) => (
                <div key={p.nama} className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: i < 3 ? 'var(--primary)' : 'var(--surface-hover)',
                      color: i < 3 ? 'white' : 'var(--text-tertiary)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {p.nama}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                    {p.terjual}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Warnings Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Peringatan Stok */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Icons.BellIcon size={16} className="text-amber-500 animate-pulse" /> Peringatan Stok
          </h2>
          {stokBermasalah.length === 0 ? (
            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> Semua stok aman
            </p>
          ) : (
            <div className="space-y-2.5">
              {stokBermasalah.map((p) => {
                const status = getStatusStok(p);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: status === 'habis' ? 'var(--danger)' : 'var(--warning)' }} />
                    <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {p.nama}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: status === 'habis' ? 'var(--danger-light)' : 'var(--warning-light)',
                        color: status === 'habis' ? 'var(--danger)' : 'var(--warning)',
                      }}
                    >
                      {p.stok} {p.satuan}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bon Jatuh Tempo */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Icons.ReceiptIcon size={16} className="text-red-500" /> Bon Jatuh Tempo
          </h2>
          <div className="space-y-2.5">
            {listBonTampil.length === 0 ? (
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" /> Tidak ada bon jatuh tempo
              </p>
            ) : (
              listBonTampil.map((b: any) => (
                <div key={b.nama} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0 animate-pulse-dot" style={{ background: b.status === 'macet' ? 'var(--danger)' : 'var(--warning)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {b.nama}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Jatuh tempo: {b.jatuhTempo ? formatTanggal(b.jatuhTempo) : 'Belum diatur'}
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: b.status === 'macet' ? 'var(--danger)' : 'var(--warning)' }}>
                    {formatRupiah(b.nominal)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
