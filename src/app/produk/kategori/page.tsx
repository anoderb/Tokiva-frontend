/**
 * produk/kategori/page.tsx
 * Halaman manajemen kategori — tambah, edit, hapus kategori dengan modal dialog.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { PlusIcon, EditIcon, TrashIcon, ChevronLeftIcon } from '@/components/ui/Icons';

export default function KategoriProduk() {
  const { kategoriList, produkList, tambahKategori, updateKategori, hapusKategori } = useData();

  const [tampilModal, setTampilModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form State
  const [nama, setNama] = useState('');
  const [icon, setIcon] = useState('📦');
  const [aktif, setAktif] = useState(true);

  // Filter & Pagination States
  const [pencarian, setPencarian] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [sortKey, setSortKey] = useState<string>('nama-asc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Open modal for add
  function bukaTambah() {
    setEditId(null);
    setNama('');
    setIcon('📦');
    setAktif(true);
    setTampilModal(true);
  }

  // Open modal for edit
  function bukaEdit(id: number) {
    const kat = kategoriList.find((k) => k.id === id);
    if (!kat) return;
    setEditId(id);
    setNama(kat.nama);
    setIcon(kat.icon);
    setAktif(kat.aktif);
    setTampilModal(true);
  }

  // Handle submit form
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;

    if (editId === null) {
      tambahKategori({
        nama,
        icon,
        aktif,
      });
    } else {
      updateKategori(editId, {
        nama,
        icon,
        aktif,
      });
    }

    setTampilModal(false);
  }

  // Handle delete category
  async function handleDelete(id: number) {
    // Check if category is used by products
    const inUse = produkList.some((p) => p.kategori_id === id && !p.deleted_at);
    if (inUse) {
      alert('Kategori tidak bisa dihapus karena masih digunakan oleh beberapa produk. Nonaktifkan saja jika tidak ingin digunakan.');
      return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      try {
        const res = await hapusKategori(id);
        if (res && !res.sukses) {
          alert(res.pesan);
        }
      } catch (err) {
        console.error(err);
        alert('Koneksi terganggu atau gagal menghapus kategori.');
      }
    }
  }

  // Count products per category
  function hitungProduk(kategoriId: number) {
    return produkList.filter((p) => p.kategori_id === kategoriId && !p.deleted_at).length;
  }

  // Filter & Sort Logic
  const listFiltered = useMemo(() => {
    return kategoriList.filter((k) => {
      const matchSearch = k.nama.toLowerCase().includes(pencarian.toLowerCase());
      const matchStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && k.aktif) ||
        (statusFilter === 'nonaktif' && !k.aktif);
      return matchSearch && matchStatus;
    });
  }, [kategoriList, pencarian, statusFilter]);

  const listSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...listFiltered].sort((a, b) => {
      if (field === 'nama') {
        const valA = a.nama.toLowerCase();
        const valB = b.nama.toLowerCase();
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (field === 'produk') {
        const countA = hitungProduk(a.id);
        const countB = hitungProduk(b.id);
        return order === 'asc' ? countA - countB : countB - countA;
      } else { // id
        return order === 'asc' ? a.id - b.id : b.id - a.id;
      }
    });
  }, [listFiltered, sortKey, produkList]);

  const totalHalaman = Math.ceil(listSorted.length / itemPerHalaman) || 1;
  
  const listPaginasi = useMemo(() => {
    const start = (halaman - 1) * itemPerHalaman;
    return listSorted.slice(start, start + itemPerHalaman);
  }, [listSorted, halaman]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
        <div className="flex items-center gap-2">
          <Link href="/produk" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon size={14} /> Produk
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Kategori</span>
        </div>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
          Kategori Produk
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Kelola pengelompokan produk toko Anda ({listFiltered.length} kategori)
        </p>
      </div>
      <button
        onClick={bukaTambah}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
        style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
      >
        <PlusIcon size={16} /> Tambah Kategori
      </button>
      </div>

      {/* Filter / Search Bar */}
      <div
        className="rounded-xl p-4 grid sm:grid-cols-3 gap-3.5 w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari kategori..."
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
            <option value="produk-desc">Produk Terbanyak</option>
            <option value="produk-asc">Produk Tersedikit</option>
            <option value="id-asc">ID Kategori (Kecil ke Besar)</option>
          </select>
        </div>
      </div>

      {/* Grid Kategori */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listPaginasi.map((kat) => {
          const totalProduk = hitungProduk(kat.id);
          return (
            <div
              key={kat.id}
              className="rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                opacity: kat.aktif ? 1 : 0.6,
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider select-none shrink-0" style={{ background: 'var(--bg)', color: 'var(--primary)' }}>
                  {kat.nama.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => bukaEdit(kat.id)}
                    title="Edit"
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <EditIcon size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(kat.id)}
                    title="Hapus"
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                    style={{ color: 'var(--danger)' }}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {kat.nama}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {totalProduk} produk terdaftar
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <span
                  className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: kat.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                    color: kat.aktif ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {kat.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  ID: {kat.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalHalaman > 1 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between shadow-sm"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Menampilkan {Math.min(listSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(listSorted.length, halaman * itemPerHalaman)} dari {listSorted.length} kategori
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={halaman === 1}
              onClick={() => setHalaman((h) => Math.max(1, h - 1))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              style={{
                background: 'var(--bg)',
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
                  background: halaman === pNum ? 'var(--primary)' : 'var(--bg)',
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
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

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
                  {editId === null ? 'Tambah Kategori' : 'Edit Kategori'}
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
                {/* Nama Kategori */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nama Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Makanan Instan"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                </div>

                {/* Visual Initial Preview */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Inisial Kategori
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold tracking-wider select-none shrink-0" style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                      {nama ? nama.slice(0, 2).toUpperCase() : 'KT'}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                      Inisial visual kategori dibuat secara otomatis menggunakan 2 huruf pertama dari nama kategori.
                    </p>
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="kat-aktif"
                    checked={aktif}
                    onChange={(e) => setAktif(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primary)]"
                  />
                  <label htmlFor="kat-aktif" className="text-xs font-semibold select-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    Aktifkan Kategori ini (bisa diakses di kasir & produk)
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
                  {editId === null ? 'Tambahkan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
