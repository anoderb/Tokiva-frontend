/**
 * pelanggan/[id]/page.tsx
 * Halaman detail profil member / pelanggan — menampilkan statistik poin loyalitas, limit kredit, dan riwayat transaksi belanja.
 */

'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import { ChevronLeftIcon, UsersIcon, ReceiptIcon, CartIcon } from '@/components/ui/Icons';

interface DetailPelangganProps {
  params: Promise<{ id: string }>;
}

export default function DetailPelanggan({ params }: DetailPelangganProps) {
  const { id } = use(params);
  const mId = parseInt(id);

  const { pelangganList, transaksiList } = useData();

  const member = useMemo(() => {
    return pelangganList.find((p) => p.id === mId);
  }, [pelangganList, mId]);

  // Transaction history of this member
  const riwayatBelanja = useMemo(() => {
    return transaksiList.filter((tx) => tx.member_id === mId);
  }, [transaksiList, mId]);

  if (!member) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-4">
          <UsersIcon size={64} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Member Tidak Ditemukan
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          Profil pelanggan tidak ditemukan atau keanggotaan sudah dihapus.
        </p>
        <Link
          href="/pelanggan"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--primary)' }}
        >
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const totalBelanjaNominal = riwayatBelanja.reduce((sum, tx) => sum + tx.total, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/pelanggan" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon size={14} /> Pelanggan
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            Profil Detail
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
          {member.nama}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          ID Member: {member.kode} • Terdaftar sejak: {new Date(member.created_at).toLocaleDateString('id-ID')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Profil & Statistik */}
        <div className="space-y-6">
          {/* Card Info Profil */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Detail Profil
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Nama Lengkap</p>
                <p className="font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{member.nama}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Nomor WhatsApp / HP</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{member.nomor_hp}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Alamat Rumah</p>
                <p className="font-medium mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {member.alamat || 'Tidak dicantumkan.'}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Status Member</p>
                <span
                  className="px-2 py-0.5 rounded-full font-semibold uppercase inline-block mt-1"
                  style={{
                    background: member.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                    color: member.aktif ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {member.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Card Poin & Kredit */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Finansial & Loyalitas
            </h3>

            <div className="flex justify-between items-center text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Loyalty Points</span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
                {member.total_poin} poin
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Outstanding Bon</span>
              <span className="text-sm font-bold text-red-500">{formatRupiah(member.total_bon)}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Limit Kredit</span>
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatRupiah(member.limit_bon)}</span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Transaksi Belanja</span>
              <span className="font-bold" style={{ color: 'var(--primary)' }}>{formatRupiah(totalBelanjaNominal)}</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Riwayat Transaksi */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 md:p-6 space-y-4 w-full max-w-full min-w-0 overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h3 className="text-sm font-bold pb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            <ReceiptIcon size={16} style={{ color: 'var(--primary)' }} /> Riwayat Kunjungan & Belanja
          </h3>

          <div className="overflow-x-auto w-full max-w-full min-w-0 hidden md:block">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>No. Transaksi</th>
                  <th className="p-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Tanggal / Waktu</th>
                  <th className="p-3 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Total Belanja</th>
                  <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Metode</th>
                  <th className="p-3 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {riwayatBelanja.map((tx) => (
                  <tr key={tx.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                    <td className="p-3 font-semibold">{tx.no_transaksi}</td>
                    <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{tx.tanggal} • {tx.waktu}</td>
                    <td className="p-3 text-right font-bold">{formatRupiah(tx.total)}</td>
                    <td className="p-3 text-center uppercase font-semibold text-[10px]">{tx.status === 'bon' ? 'Tempo / Bon' : 'Lunas'}</td>
                    <td className="p-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase"
                        style={{
                          background: tx.status === 'bon' ? 'var(--danger-light)' : 'var(--success-light)',
                          color: tx.status === 'bon' ? 'var(--danger)' : 'var(--success)',
                        }}
                      >
                        {tx.status === 'bon' ? 'Belum Lunas' : 'Lunas'}
                      </span>
                    </td>
                  </tr>
                ))}

                {riwayatBelanja.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                        <CartIcon size={48} />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Member ini belum pernah melakukan transaksi belanja
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card List Mobile */}
          <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
            {riwayatBelanja.map((tx) => (
              <div key={tx.id} className="py-3.5 space-y-3" style={{ color: 'var(--text-primary)' }}>
                {/* Header: No. Transaksi & Status */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs">{tx.no_transaksi}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: tx.status === 'bon' ? 'var(--danger-light)' : 'var(--success-light)',
                      color: tx.status === 'bon' ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {tx.status === 'bon' ? 'Belum Lunas' : 'Lunas'}
                  </span>
                </div>

                {/* Detail: Tanggal, Metode, Total */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg text-[10px]" style={{ background: 'var(--bg)' }}>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Tanggal / Waktu</span>
                    <span className="font-semibold mt-0.5">{tx.tanggal} • {tx.waktu}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Metode Pembayaran</span>
                    <span className="font-semibold mt-0.5 uppercase">{tx.status === 'bon' ? 'Tempo / Bon' : 'Lunas'}</span>
                  </div>
                  <div className="col-span-2 border-t pt-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <span className="block text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Total Belanja</span>
                    <span className="font-bold mt-0.5 text-xs" style={{ color: 'var(--primary)' }}>{formatRupiah(tx.total)}</span>
                  </div>
                </div>
              </div>
            ))}

            {riwayatBelanja.length === 0 && (
              <div className="text-center py-12">
                <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                  <CartIcon size={48} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Member ini belum pernah melakukan transaksi belanja
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
