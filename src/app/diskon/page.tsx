/**
 * diskon/page.tsx
 * Halaman Diskon & Promo — mengelola promosi toko, diskon langsung, dan poin keanggotaan.
 */

'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from '@/components/ui/Icons';

interface Promo {
  id: number;
  nama: string;
  tipe: 'persentase' | 'nominal';
  nilai: number;
  minBelanja: number;
  tglMulai: string;
  tglSelesai: string;
  aktif: boolean;
}

export default function DiskonPromo() {
  const { pelangganList } = useData();

  const [tampilModal, setTampilModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Mock Promos
  const [promos, setPromos] = useState<Promo[]>([
    { id: 1, nama: 'Promo Pembukaan Toko', tipe: 'persentase', nilai: 10, minBelanja: 50000, tglMulai: '2026-06-01', tglSelesai: '2026-07-31', aktif: true },
    { id: 2, nama: 'Potongan Langsung Jumat Berkah', tipe: 'nominal', nilai: 5000, minBelanja: 75000, tglMulai: '2026-06-01', tglSelesai: '2026-12-31', aktif: true },
  ]);

  // Filters & Pagination States
  const [pencarian, setPencarian] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [sortKey, setSortKey] = useState<string>('nama-asc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Filter promos
  const listFiltered = useMemo(() => {
    return promos.filter((p) => {
      const matchSearch = p.nama.toLowerCase().includes(pencarian.toLowerCase());
      const matchStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && p.aktif) ||
        (statusFilter === 'nonaktif' && !p.aktif);
      return matchSearch && matchStatus;
    });
  }, [promos, pencarian, statusFilter]);

  // Sort promos
  const listSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...listFiltered].sort((a, b) => {
      let valA: any = a[field === 'nilai' ? 'nilai' : (field as keyof typeof a)];
      let valB: any = b[field === 'nilai' ? 'nilai' : (field as keyof typeof b)];
      
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

  // Form State
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<'persentase' | 'nominal'>('persentase');
  const [nilai, setNilai] = useState('');
  const [minBelanja, setMinBelanja] = useState('0');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [aktif, setAktif] = useState(true);

  // Open modal for add
  function bukaTambah() {
    setEditId(null);
    setNama('');
    setTipe('persentase');
    setNilai('');
    setMinBelanja('0');
    setTglMulai('');
    setTglSelesai('');
    setAktif(true);
    setTampilModal(true);
  }

  // Open modal for edit
  function bukaEdit(id: number) {
    const pr = promos.find((p) => p.id === id);
    if (!pr) return;
    setEditId(id);
    setNama(pr.nama);
    setTipe(pr.tipe);
    setNilai(pr.nilai.toString());
    setMinBelanja(pr.minBelanja.toString());
    setTglMulai(pr.tglMulai);
    setTglSelesai(pr.tglSelesai);
    setAktif(pr.aktif);
    setTampilModal(true);
  }

  // Form submit handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama || !nilai) return;

    const payload: Promo = {
      id: editId === null ? Date.now() : editId,
      nama,
      tipe,
      nilai: parseFloat(nilai) || 0,
      minBelanja: parseFloat(minBelanja) || 0,
      tglMulai: tglMulai || new Date().toISOString().slice(0, 10),
      tglSelesai: tglSelesai || new Date().toISOString().slice(0, 10),
      aktif,
    };

    if (editId === null) {
      setPromos((prev) => [...prev, payload]);
    } else {
      setPromos((prev) => prev.map((p) => (p.id === editId ? payload : p)));
    }

    setTampilModal(false);
  }

  // Handle delete
  function handleDelete(id: number) {
    if (confirm('Apakah Anda yakin ingin menghapus promo ini?')) {
      setPromos((prev) => prev.filter((p) => p.id !== id));
    }
  }  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Diskon & Promosi Toko
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Buat skema potongan harga langsung, kode voucher, dan atur promo musiman ({listFiltered.length} promo)
          </p>
        </div>
        <button
          onClick={bukaTambah}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
          style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
        >
          <PlusIcon className="w-4 h-4" /> Tambah Promosi
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div
        className="rounded-xl p-4 grid md:grid-cols-3 gap-3.5 w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari promo..."
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
            <option value="nama-asc">Nama Promo (A-Z)</option>
            <option value="nama-desc">Nama Promo (Z-A)</option>
            <option value="nilai-desc">Potongan Terbesar</option>
            <option value="nilai-asc">Potongan Terkecil</option>
          </select>
        </div>
      </div>

      {/* Promos Table */}
      <div
        className="rounded-xl overflow-hidden shadow-sm w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="overflow-x-auto w-full max-w-full min-w-0 hidden md:block">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Promosi</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nilai Potongan</th>
                <th className="p-3.5 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Min. Belanja</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Masa Berlaku</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {listPaginasi.map((p) => (
                <tr key={p.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  <td className="p-3.5 font-bold text-sm">{p.nama}</td>
                  <td className="p-3.5 font-bold" style={{ color: 'var(--primary)' }}>
                    {p.tipe === 'persentase' ? `${p.nilai}%` : formatRupiah(p.nilai)}
                  </td>
                  <td className="p-3.5 text-right font-medium">{formatRupiah(p.minBelanja)}</td>
                  <td className="p-3.5 text-center" style={{ color: 'var(--text-secondary)' }}>
                    {p.tglMulai} s/d {p.tglSelesai}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                      style={{
                        background: p.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                        color: p.aktif ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {p.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => bukaEdit(p.id)}
                        className="px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 hover:opacity-80"
                          style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      >
                        <EditIcon size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-2 py-1 rounded text-[10px] font-bold text-white transition-colors flex items-center gap-1"
                        style={{ background: 'var(--danger)' }}
                      >
                        <TrashIcon size={12} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {listPaginasi.map((p) => (
            <div key={p.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
              {/* Header: Nama Promosi & Status */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm leading-tight">{p.nama}</h3>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    ID Promo: {p.id}
                  </p>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    background: p.aktif ? 'var(--success-light)' : 'var(--danger-light)',
                    color: p.aktif ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {p.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Detail Info: Nilai Potongan, Min Belanja, Masa Berlaku */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Nilai Potongan</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--primary)' }}>
                    {p.tipe === 'persentase' ? `${p.nilai}%` : formatRupiah(p.nilai)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Min. Belanja</p>
                  <p className="font-semibold mt-0.5">{formatRupiah(p.minBelanja)}</p>
                </div>
                <div className="col-span-2 border-t pt-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Masa Berlaku</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{p.tglMulai} s/d {p.tglSelesai}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => bukaEdit(p.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <EditIcon size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors flex items-center gap-1"
                  style={{ background: 'var(--danger)' }}
                >
                  <TrashIcon size={12} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        {totalHalaman > 1 && (
          <div
            className="px-4 py-3 flex items-center justify-between shadow-sm border-t"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Menampilkan {Math.min(listSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(listSorted.length, halaman * itemPerHalaman)} dari {listSorted.length} promo
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
                  {editId === null ? 'Tambah Promosi Baru' : 'Edit Detail Promosi'}
                </h2>
                <button
                  type="button"
                  onClick={() => setTampilModal(false)}
                  className="text-lg hover:opacity-75 flex items-center justify-center p-1 rounded-lg hover:bg-[var(--surface-hover)]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-4">
                {/* Nama Promo */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nama Promosi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Diskon Kemerdekaan"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipe Promo */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Tipe Potongan
                    </label>
                    <select
                      value={tipe}
                      onChange={(e) => setTipe(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="persentase">Persentase (%)</option>
                      <option value="nominal">Nominal Rupiah (Rp)</option>
                    </select>
                  </div>

                  {/* Nilai Promo */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Nilai Potongan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder={tipe === 'persentase' ? '10' : '5000'}
                      value={nilai}
                      onChange={(e) => setNilai(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Min Belanja */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Minimal Belanja Syarat (Rp)
                  </label>
                  <input
                    type="number"
                    value={minBelanja}
                    onChange={(e) => setMinBelanja(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tgl Mulai */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Mulai Berlaku
                    </label>
                    <input
                      type="date"
                      required
                      value={tglMulai}
                      onChange={(e) => setTglMulai(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Tgl Selesai */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Berakhir Pada
                    </label>
                    <input
                      type="date"
                      required
                      value={tglSelesai}
                      onChange={(e) => setTglSelesai(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="promo-aktif"
                    checked={aktif}
                    onChange={(e) => setAktif(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="promo-aktif" className="text-xs font-semibold select-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    Aktifkan promo ini sekarang
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
