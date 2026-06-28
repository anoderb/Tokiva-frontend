/**
 * pelanggan/page.tsx
 * Halaman list pelanggan / member toko.
 * Mengelola pendaftaran member baru, edit profil, status limit bon, dan riwayat poin loyalitas.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/format_rupiah';
import { PlusIcon, SearchIcon, EyeIcon, EditIcon, UsersIcon, TrashIcon } from '@/components/ui/Icons';

export default function DaftarPelanggan() {
  const { pelangganList, tambahPelanggan, updatePelanggan, hapusPelanggan } = useData();
  const { isAdmin } = useAuth();

  const [pencarian, setPencarian] = useState('');
  const [tampilModal, setTampilModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form State
  const [nama, setNama] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [limitBon, setLimitBon] = useState('300000');
  const [aktif, setAktif] = useState(true);

  // Filters & Pagination States
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'nonaktif' | 'hutang'>('semua');
  const [sortKey, setSortKey] = useState<string>('nama-asc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Filter members
  const listFiltered = useMemo(() => {
    return pelangganList.filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(pencarian.toLowerCase()) ||
        m.nomor_hp.includes(pencarian) ||
        m.kode.toLowerCase().includes(pencarian.toLowerCase());
      
      const matchStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && m.aktif) ||
        (statusFilter === 'nonaktif' && !m.aktif) ||
        (statusFilter === 'hutang' && m.total_bon > 0);

      return matchSearch && matchStatus;
    });
  }, [pelangganList, pencarian, statusFilter]);

  // Sort members
  const listSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...listFiltered].sort((a, b) => {
      let valA: any = a[field === 'poin' ? 'total_poin' : field === 'bon' ? 'total_bon' : field === 'limit' ? 'limit_bon' : (field as keyof typeof a)];
      let valB: any = b[field === 'poin' ? 'total_poin' : field === 'bon' ? 'total_bon' : field === 'limit' ? 'limit_bon' : (field as keyof typeof b)];
      
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
  }, [listFiltered, sortKey]);

  // Total pages
  const totalHalaman = Math.ceil(listSorted.length / itemPerHalaman) || 1;

  // Paginated list
  const listPaginasi = useMemo(() => {
    const start = (halaman - 1) * itemPerHalaman;
    return listSorted.slice(start, start + itemPerHalaman);
  }, [listSorted, halaman]);

  // Open modal for add
  function bukaTambah() {
    setEditId(null);
    setNama('');
    setNomorHp('');
    setAlamat('');
    setLimitBon('300000');
    setAktif(true);
    setTampilModal(true);
  }

  // Open modal for edit
  function bukaEdit(id: number) {
    const m = pelangganList.find((x) => x.id === id);
    if (!m) return;
    setEditId(id);
    setNama(m.nama);
    setNomorHp(m.nomor_hp);
    setAlamat(m.alamat || '');
    setLimitBon(m.limit_bon.toString());
    setAktif(m.aktif);
    setTampilModal(true);
  }

  // Handle submit form
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama) return;

    const payload = {
      nama,
      nomor_hp: nomorHp,
      alamat: alamat || null,
      limit_bon: parseFloat(limitBon) || 0,
      aktif,
    };

    if (editId === null) {
      const nextId = pelangganList.length > 0 ? Math.max(...pelangganList.map((x) => x.id)) + 1 : 1;
      const memberCode = `TKV-M${nextId.toString().padStart(3, '0')}`;
      tambahPelanggan({
        ...payload,
        kode: memberCode,
        total_poin: 0,
        total_bon: 0,
        foto_url: null,
      });
    } else {
      updatePelanggan(editId, payload);
    }

    setTampilModal(false);
  }

  // Handle delete member/pelanggan
  async function handleDelete(id: number) {
    const member = pelangganList.find((m) => m.id === id);
    if (!member) return;

    if (member.total_bon > 0) {
      alert(`Tidak dapat menghapus member. Masih memiliki tanggungan kasbon sebesar Rp ${member.total_bon.toLocaleString('id-ID')}`);
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus member ini?')) {
      try {
        const res = await hapusPelanggan(id);
        if (res && res.sukses) {
          alert(res.pesan);
        } else {
          alert(res?.pesan || 'Gagal menghapus member');
        }
      } catch (err) {
        console.error(err);
        alert('Koneksi terganggu atau gagal menghapus member.');
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Daftar Pelanggan / Member
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Kelola data keanggotaan, riwayat poin, dan limit piutang pelanggan ({listFiltered.length} member)
          </p>
        </div>
        <button
          onClick={bukaTambah}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
          style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
        >
          <PlusIcon size={16} /> Registrasi Member
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div
        className="rounded-xl p-4 grid md:grid-cols-3 gap-3.5 w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <SearchIcon size={14} />
          </span>
          <input
            type="text"
            placeholder="Cari member (nama, nomor HP, kode)..."
            value={pencarian}
            onChange={(e) => { setPencarian(e.target.value); setHalaman(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setHalaman(1); }}
            className="w-full px-3 py-2 rounded-lg text-xs"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
            <option value="hutang">Memiliki Kasbon/Hutang</option>
          </select>
        </div>
        <div>
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value); setHalaman(1); }}
            className="w-full px-3 py-2 rounded-lg text-xs"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="nama-asc">Nama (A-Z)</option>
            <option value="nama-desc">Nama (Z-A)</option>
            <option value="poin-desc">Poin Tertinggi</option>
            <option value="poin-asc">Poin Terendah</option>
            <option value="bon-desc">Kasbon Terbesar</option>
            <option value="limit-desc">Limit Bon Terbesar</option>
          </select>
        </div>
      </div>

      {/* Member Table */}
      <div
        className="rounded-xl overflow-hidden shadow-sm w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="overflow-x-auto w-full max-w-full min-w-0 hidden md:block">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Kode Member</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Lengkap</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>No. Handphone</th>
                <th className="p-3.5 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Poin</th>
                <th className="p-3.5 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Limit Bon</th>
                <th className="p-3.5 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Sisa Hutang</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {listPaginasi.map((m) => (
                <tr key={m.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                   <td className="p-3.5 font-semibold">{m.kode}</td>
                  <td className="p-3.5 font-bold text-sm">
                    <Link href={`/pelanggan/${m.id}`} className="hover:underline" style={{ color: 'var(--primary)' }}>
                      {m.nama}
                    </Link>
                  </td>
                  <td className="p-3.5 font-medium">{m.nomor_hp}</td>
                  <td className="p-3.5 text-right font-bold" style={{ color: 'var(--primary)' }}>
                    <span className="px-2.5 py-1 rounded-lg text-[11px]" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
                      {m.total_poin} poin
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {formatRupiah(m.limit_bon)}
                  </td>
                  <td className="p-3.5 text-right font-bold" style={{ color: m.total_bon > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {m.total_bon > 0 ? formatRupiah(m.total_bon) : 'Lunas'}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                      style={{
                        background: m.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                        color: m.aktif ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {m.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                   <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/pelanggan/${m.id}`}
                        title="Lihat Profil & Riwayat"
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        <EyeIcon size={16} />
                      </Link>
                      <button
                        onClick={() => bukaEdit(m.id)}
                        title="Edit Profil"
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors" style={{ color: 'var(--primary)' }}
                      >
                        <EditIcon size={16} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(m.id)}
                          title="Hapus Member"
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-red-500 hover:text-red-700"
                        >
                          <TrashIcon size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {listFiltered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                      <UsersIcon size={48} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Pelanggan tidak ditemukan
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {listPaginasi.map((m) => (
            <div key={m.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
              {/* Header: Nama & Status */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <Link href={`/pelanggan/${m.id}`} className="font-bold text-xs sm:text-sm leading-tight hover:underline" style={{ color: 'var(--primary)' }}>
                    {m.nama}
                  </Link>
                  <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Kode Member: {m.kode}
                  </p>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    background: m.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                    color: m.aktif ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {m.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Detail Info: HP, Poin, Limit Bon, Hutang */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>No. Handphone</p>
                  <p className="font-semibold mt-0.5">{m.nomor_hp || '-'}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Poin Loyalitas</p>
                  <p className="font-semibold mt-0.5 font-bold" style={{ color: 'var(--primary)' }}>{m.total_poin} Poin</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Limit Bon</p>
                  <p className="font-semibold mt-0.5">{formatRupiah(m.limit_bon)}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Sisa Hutang</p>
                  <p className="font-bold mt-0.5" style={{ color: m.total_bon > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {m.total_bon > 0 ? formatRupiah(m.total_bon) : 'Lunas'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-1">
                <Link
                  href={`/pelanggan/${m.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-[var(--surface-hover)] border transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <EyeIcon size={12} /> Profil
                </Link>
                <button
                  onClick={() => bukaEdit(m.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-[var(--surface-hover)] border transition-colors"
                  style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                  <EditIcon size={12} /> Edit
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-[var(--surface-hover)] border transition-colors text-red-500 hover:text-red-700"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <TrashIcon size={12} /> Hapus
                  </button>
                )}
              </div>
            </div>
          ))}

          {listFiltered.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                <UsersIcon size={48} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Pelanggan tidak ditemukan
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalHalaman > 1 && (
          <div
            className="px-4 py-3 flex items-center justify-between shadow-sm"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Menampilkan {Math.min(listSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(listSorted.length, halaman * itemPerHalaman)} dari {listSorted.length} pelanggan
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

      {/* Modal Tambah / Edit */}
      {tampilModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
            onClick={() => setTampilModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editId === null ? 'Registrasi Member Baru' : 'Edit Profil Member'}
                </h2>
                <button
                  type="button"
                  onClick={() => setTampilModal(false)}
                  className="text-lg"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-4">
                {/* Nama */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Dhani"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* HP */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nomor WhatsApp / HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Limit Bon */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Batas Maksimal Piutang / Limit Bon (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 500000"
                    value={limitBon}
                    onChange={(e) => setLimitBon(e.target.value)}
                    disabled={!isAdmin}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold ${!isAdmin ? 'opacity-60 cursor-not-allowed bg-zinc-100' : ''}`}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {isAdmin
                      ? 'Set 0 untuk melarang member ini melakukan pembelian tempo/bon'
                      : 'Hanya Administrator yang dapat mengubah limit bon member'}
                  </p>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Alamat Rumah
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Alamat lengkap member..."
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="member-aktif"
                    checked={aktif}
                    onChange={(e) => setAktif(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primary)]"
                  />
                  <label htmlFor="member-aktif" className="text-xs font-semibold select-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    Aktifkan keanggotaan member (bisa dipilih di kasir)
                  </label>
                </div>
              </div>

              {/* Form Footer */}
              <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <button
                  type="button"
                  onClick={() => setTampilModal(false)}
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
                  {editId === null ? 'Registrasikan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
