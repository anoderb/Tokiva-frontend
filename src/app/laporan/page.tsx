/**
 * laporan/page.tsx
 * Halaman Hub Laporan Keuangan & Stok Toko.
 * Menyediakan ringkasan pendapatan, pengeluaran, laba rugi, dan link ke laporan detail.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { formatRupiah, formatRupiahSingkat } from '@/lib/format_rupiah';
import { StockIcon, ReportIcon, ReceiptIcon } from '@/components/ui/Icons';

export default function LaporanHub() {
  const { transaksiList, produkList } = useData();

  // Dynamic calculations based on actual transactions
  const kalkulasi = useMemo(() => {
    let totalOmzet = 0;
    let totalLaba = 0;
    let totalPajak = 0;
    let totalDiskon = 0;
    let totalTransaksi = transaksiList.length;

    transaksiList.forEach((tx) => {
      totalOmzet += Number(tx.total);
      totalDiskon += Number(tx.diskon_total);
      
      // Calculate estimated cost of goods sold (HPP) to calculate gross profit
      let hppTx = 0;
      tx.detail?.forEach((item) => {
        // Find product buying price
        const prodObj = produkList.find((p) => p.id === item.produk_id);
        if (prodObj) {
          hppTx += Number(prodObj.harga_beli) * item.qty;
        } else {
          hppTx += Number(item.harga_satuan) * 0.7 * item.qty; // fallback 30% margin
        }
      });
      
      totalLaba += (Number(tx.total) - hppTx);
    });

    return { totalOmzet, totalLaba, totalPajak, totalDiskon, totalTransaksi };
  }, [transaksiList, produkList]);

  // Chart data: Sales by category (calculated dynamically from transactions)
  const penjualanKategori = useMemo(() => {
    const map: Record<string, number> = {};

    transaksiList.forEach((tx) => {
      tx.detail?.forEach((item: any) => {
        const prodObj = produkList.find((p) => p.id === item.produk_id);
        const kategoriNama = prodObj?.kategori?.nama || 'Lainnya';
        map[kategoriNama] = (map[kategoriNama] || 0) + Number(item.subtotal);
      });
    });

    return Object.entries(map).map(([name, val]) => ({
      kategori: name,
      omzet: val,
    })).sort((a, b) => b.omzet - a.omzet);
  }, [transaksiList, produkList]);

  const maxKategoriOmzet = useMemo(() => {
    return Math.max(...penjualanKategori.map((k) => k.omzet)) || 1;
  }, [penjualanKategori]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Analisis Laporan & Laba Rugi
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Audit pembukuan keuangan toko, marjin penjualan, dan metrik kinerja bisnis Anda.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omzet */}
        <div
          className="rounded-xl p-3 sm:p-4 lg:p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-[10px] sm:text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Total Pendapatan (Omzet)</p>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--primary)' }}>
            {formatRupiah(kalkulasi.totalOmzet)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Dari {kalkulasi.totalTransaksi} transaksi</p>
        </div>

        {/* Estimasi Laba Kotor */}
        <div
          className="rounded-xl p-3 sm:p-4 lg:p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-[10px] sm:text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Estimasi Laba Kotor</p>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--success)' }}>
            {formatRupiah(kalkulasi.totalLaba)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Net Margin: {((kalkulasi.totalLaba / (kalkulasi.totalOmzet || 1)) * 100).toFixed(1)}%
          </p>
        </div>

        {/* Diskon Diberikan */}
        <div
          className="rounded-xl p-3 sm:p-4 lg:p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-[10px] sm:text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Diskon Diberikan</p>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--warning)' }}>
            {formatRupiah(kalkulasi.totalDiskon)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Potongan harga member/langsung</p>
        </div>

        {/* Transaksi Terproses */}
        <div
          className="rounded-xl p-3 sm:p-4 lg:p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-[10px] sm:text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Transaksi Terproses</p>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {kalkulasi.totalTransaksi} invoice
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Rata-rata: {formatRupiah(Math.round(kalkulasi.totalOmzet / (kalkulasi.totalTransaksi || 1)))}/tx</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Kolom Kiri: Menu Laporan Detail */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Pilih Jenis Laporan
          </h2>

          <div className="grid gap-3">
            {[
              { nama: 'Laporan Penjualan Harian', desc: 'Detail omzet harian, transaksi, dan perbandingan omzet.', link: '/laporan/penjualan', iconKey: 'penjualan' },
              { nama: 'Laporan Laba Rugi', desc: 'Perhitungan omzet dikurangi harga pokok penjualan (HPP).', link: '/laporan/laba-rugi', iconKey: 'laba-rugi' },
              { nama: 'Laporan Mutasi & Pergerakan Stok', desc: 'Riwayat barang masuk (restock), opname, dan expired.', link: '/laporan/mutasi-stok', iconKey: 'mutasi-stok' },
            ].map((menu) => {
              let IconComp = StockIcon;
              let iconColorClass = '';
              if (menu.iconKey === 'laba-rugi') {
                IconComp = ReportIcon;
                iconColorClass = 'text-emerald-600 dark:text-emerald-400';
              } else if (menu.iconKey === 'mutasi-stok') {
                IconComp = ReceiptIcon;
                iconColorClass = 'text-purple-600 dark:text-purple-400';
              }

              return (
                <Link
                  key={menu.nama}
                  href={menu.link}
                  className="rounded-xl p-4 flex gap-4 items-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <span className={`p-3.5 rounded-xl ${iconColorClass}`} style={{ background: 'var(--bg)' }}>
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

        {/* Kolom Kanan: Chart Penjualan Kategori */}
        <div
          className="lg:col-span-3 rounded-2xl p-5 md:p-6 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h3 className="text-sm font-bold pb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            <ReportIcon size={16} style={{ color: 'var(--primary)' }} /> Pembagian Omzet berdasarkan Kategori
          </h3>

          <div className="space-y-4">
            {penjualanKategori.map((k) => {
              const barPercent = Math.max(8, Math.round((k.omzet / maxKategoriOmzet) * 100));
              return (
                <div key={k.kategori} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    <span>{k.kategori}</span>
                    <span style={{ color: 'var(--primary)' }}>{formatRupiah(k.omzet)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barPercent}%`,
                        background: 'var(--primary-gradient)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
