/**
 * pengaturan/pengguna/page.tsx
 * Halaman Pengaturan Pengguna — manajemen staff kasir dan administrator toko, peran (role), dan status aktif.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { dataPengguna } from '@/lib/data/pengguna';
import { PlusIcon, EditIcon, LockIcon, ChevronLeftIcon } from '@/components/ui/Icons';

interface StaffUser {
  id: number;
  nama: string;
  username: string;
  role: 'admin' | 'kasir';
  nomor_hp: string;
  aktif: boolean;
}

export default function PengaturanPengguna() {
  const [users, setUsers] = useState<StaffUser[]>([
    { id: 1, nama: 'Budi Santoso', username: 'admin', role: 'admin', nomor_hp: '081234567890', aktif: true },
    { id: 2, nama: 'Ani Wulandari', username: 'ani', role: 'kasir', nomor_hp: '085678901234', aktif: true },
    { id: 3, nama: 'Citra Dewi', username: 'citra', role: 'kasir', nomor_hp: '087890123456', aktif: false },
  ]);

  const [tampilModal, setTampilModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Search, Filter, Sort, Pagination states
  const [pencarian, setPencarian] = useState('');
  const [peranFilter, setPeranFilter] = useState<'semua' | 'admin' | 'kasir'>('semua');
  const [sortKey, setSortKey] = useState('nama-asc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  const usersFiltered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nama.toLowerCase().includes(pencarian.toLowerCase()) ||
        u.username.toLowerCase().includes(pencarian.toLowerCase()) ||
        (u.nomor_hp && u.nomor_hp.includes(pencarian));
      const matchPeran = peranFilter === 'semua' || u.role === peranFilter;
      return matchSearch && matchPeran;
    });
  }, [users, pencarian, peranFilter]);

  const usersSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...usersFiltered].sort((a, b) => {
      const valA = field === 'nama' ? a.nama : a.username;
      const valB = field === 'nama' ? b.nama : b.username;
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [usersFiltered, sortKey]);

  const totalHalaman = Math.ceil(usersSorted.length / itemPerHalaman) || 1;

  const usersPaginasi = useMemo(() => {
    const start = (halaman - 1) * itemPerHalaman;
    return usersSorted.slice(start, start + itemPerHalaman);
  }, [usersSorted, halaman]);

  // Form State
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'kasir'>('kasir');
  const [nomorHp, setNomorHp] = useState('');
  const [aktif, setAktif] = useState(true);

  // Open modal for add
  function bukaTambah() {
    setEditId(null);
    setNama('');
    setUsername('');
    setPassword('');
    setRole('kasir');
    setNomorHp('');
    setAktif(true);
    setTampilModal(true);
  }

  // Open modal for edit
  function bukaEdit(id: number) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setEditId(id);
    setNama(u.nama);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setNomorHp(u.nomor_hp);
    setAktif(u.aktif);
    setTampilModal(true);
  }

  // Form submit handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama || !username) return;

    const payload: StaffUser = {
      id: editId === null ? Date.now() : editId,
      nama,
      username,
      role,
      nomor_hp: nomorHp,
      aktif,
    };

    if (editId === null) {
      setUsers((prev) => [...prev, payload]);
    } else {
      setUsers((prev) => prev.map((u) => (u.id === editId ? payload : u)));
    }

    setTampilModal(false);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/pengaturan" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon size={14} /> Pengaturan
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            Pengguna
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <LockIcon size={24} style={{ color: 'var(--primary)' }} /> Manajemen Hak Akses Pengguna
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Daftarkan akun kasir baru, ubah peran akses, atau nonaktifkan kasir yang tidak bekerja lagi.
        </p>
      </div>

      {/* Header action & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama, username..."
                value={pencarian}
                onChange={(e) => { setPencarian(e.target.value); setHalaman(1); }}
                className="w-full sm:w-60 pl-3 pr-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={peranFilter}
                onChange={(e) => { setPeranFilter(e.target.value as any); setHalaman(1); }}
                className="px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="semua">Semua Peran</option>
                <option value="admin">Administrator</option>
                <option value="kasir">Staff Kasir</option>
              </select>
              <select
                value={sortKey}
                onChange={(e) => { setSortKey(e.target.value); setHalaman(1); }}
                className="px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="nama-asc">Nama (A-Z)</option>
                <option value="nama-desc">Nama (Z-A)</option>
                <option value="username-asc">Username (A-Z)</option>
                <option value="username-desc">Username (Z-A)</option>
              </select>
            </div>
          </div>

          <button
            onClick={bukaTambah}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95 shrink-0"
            style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
          >
            <PlusIcon size={16} /> Registrasi Staff Baru
          </button>
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden shadow-sm w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="hidden md:block overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Lengkap</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Username</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>No. Handphone</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Hak Akses Peran</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {usersPaginasi.map((u) => (
                <tr key={u.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  <td className="p-3.5 font-bold text-sm">{u.nama}</td>
                  <td className="p-3.5 font-medium">{u.username}</td>
                  <td className="p-3.5 font-medium">{u.nomor_hp}</td>
                  <td className="p-3.5 text-center">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                      style={{
                        background: u.role === 'admin' ? 'rgba(20,184,166,0.15)' : 'var(--bg)',
                        color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                      style={{
                        background: u.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                        color: u.aktif ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {u.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => bukaEdit(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      >
                        <EditIcon size={14} /> Edit Staff
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usersFiltered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                    Tidak ada staff pengguna ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {usersPaginasi.map((u) => (
            <div key={u.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
              {/* Header: Nama & Role */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm leading-tight">{u.nama}</h3>
                  <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Username: {u.username}
                  </p>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    background: u.role === 'admin' ? 'rgba(20,184,166,0.15)' : 'var(--bg)',
                    color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                  }}
                >
                  {u.role}
                </span>
              </div>

              {/* Detail Info: Phone & Status */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>No. Handphone</p>
                  <p className="font-semibold mt-0.5">{u.nomor_hp || '-'}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status Akun</p>
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-0.5 inline-block"
                    style={{
                      background: u.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                      color: u.aktif ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {u.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => bukaEdit(u.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <EditIcon size={12} /> Edit Staff
                </button>
              </div>
            </div>
          ))}
          {usersFiltered.length === 0 && (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Tidak ada staff pengguna ditemukan
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
              Menampilkan {Math.min(usersSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(usersSorted.length, halaman * itemPerHalaman)} dari {usersSorted.length} staff
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
                  {editId === null ? 'Registrasi Staff Baru' : 'Edit Profil Staff'}
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
                    placeholder="Contoh: Ani Wulandari"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Username Login <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ani"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Password Login {editId === null && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      required={editId === null}
                      placeholder={editId !== null ? 'Kosongkan jika tidak diubah' : '******'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hak Akses */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Hak Akses Peran
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="kasir">Staff Kasir</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {/* Nomor HP */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Nomor HP / WA
                    </label>
                    <input
                      type="text"
                      placeholder="0856..."
                      value={nomorHp}
                      onChange={(e) => setNomorHp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="staff-aktif"
                    checked={aktif}
                    onChange={(e) => setAktif(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primary)]"
                  />
                  <label htmlFor="staff-aktif" className="text-xs font-semibold select-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    Aktifkan akun staff ini (bisa login ke sistem)
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
                  {editId === null ? 'Daftarkan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
