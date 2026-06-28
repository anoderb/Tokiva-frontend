/**
 * pemasok/page.tsx
 * Halaman manajemen pemasok / supplier.
 * Mengelola pendaftaran supplier baru, kontak pic, alamat, dan total tagihan/hutang supplier.
 */

'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import { PlusIcon, SearchIcon, TruckIcon, EditIcon, TrashIcon } from '@/components/ui/Icons';

export default function DaftarPemasok() {
  const { pemasokList, tambahPemasok, updatePemasok, hapusPemasok } = useData();

  const [pencarian, setPencarian] = useState('');
  const [tampilModal, setTampilModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form State
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [hutang, setHutang] = useState('0');
  const [aktif, setAktif] = useState(true);

  // Filters & Pagination States
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'nonaktif' | 'hutang'>('semua');
  const [sortKey, setSortKey] = useState<string>('nama-asc');
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Filter suppliers
  const listFiltered = useMemo(() => {
    return pemasokList.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(pencarian.toLowerCase()) ||
        (p.kontak && p.kontak.toLowerCase().includes(pencarian.toLowerCase())) ||
        (p.nomor_hp && p.nomor_hp.includes(pencarian));

      const matchStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && p.aktif) ||
        (statusFilter === 'nonaktif' && !p.aktif) ||
        (statusFilter === 'hutang' && p.hutang > 0);

      return matchSearch && matchStatus;
    });
  }, [pemasokList, pencarian, statusFilter]);

  // Sort suppliers
  const listSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...listFiltered].sort((a, b) => {
      let valA: any = a[field === 'hutang' ? 'hutang' : (field as keyof typeof a)];
      let valB: any = b[field === 'hutang' ? 'hutang' : (field as keyof typeof b)];
      
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
    setKontak('');
    setNomorHp('');
    setAlamat('');
    setHutang('0');
    setAktif(true);
    setTampilModal(true);
  }

  // Open modal for edit
  function bukaEdit(id: number) {
    const p = pemasokList.find((x) => x.id === id);
    if (!p) return;
    setEditId(id);
    setNama(p.nama);
    setKontak(p.kontak || '');
    setNomorHp(p.nomor_hp || '');
    setAlamat(p.alamat || '');
    setHutang(p.hutang.toString());
    setAktif(p.aktif);
    setTampilModal(true);
  }

  // Handle submit form
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama) return;

    const payload = {
      nama,
      kontak: kontak || null,
      nomor_hp: nomorHp || null,
      alamat: alamat || null,
      hutang: parseFloat(hutang) || 0,
      aktif,
    };

    if (editId === null) {
      tambahPemasok(payload);
    } else {
      updatePemasok(editId, payload);
    }

    setTampilModal(false);
  }

  // Handle delete supplier
  async function handleDelete(id: number) {
    if (confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
      try {
        const res = await hapusPemasok(id);
        if (res && res.sukses) {
          alert(res.pesan);
        } else {
          alert(res?.pesan || 'Gagal menghapus supplier');
        }
      } catch (err) {
        console.error(err);
        alert('Koneksi terganggu atau gagal menghapus supplier.');
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Daftar Pemasok / Supplier
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Kelola data pemasok barang toko, kontak perwakilan, dan pencatatan hutang dagang ({listFiltered.length} supplier)
          </p>
        </div>
        <button
          onClick={bukaTambah}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
          style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
        >
          <PlusIcon size={16} /> Tambah Supplier
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
            placeholder="Cari pemasok..."
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
            <option value="hutang">Memiliki Tagihan/Hutang</option>
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
            <option value="hutang-desc">Hutang Terbesar</option>
            <option value="hutang-asc">Hutang Terkecil</option>
          </select>
        </div>
      </div>

      {/* Supplier Table */}
      <div
        className="rounded-xl overflow-hidden shadow-sm w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="hidden md:block overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>ID</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Pemasok</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Nama Kontak PIC</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>No. WhatsApp</th>
                <th className="p-3.5 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Alamat Kantor</th>
                <th className="p-3.5 font-semibold text-right" style={{ color: 'var(--text-tertiary)' }}>Hutang Dagang</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {listPaginasi.map((p) => (
                <tr key={p.id} className="hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  <td className="p-3.5 font-semibold">{p.id}</td>
                  <td className="p-3.5 font-bold text-sm">{p.nama}</td>
                  <td className="p-3.5 font-medium">{p.kontak || '-'}</td>
                  <td className="p-3.5 font-medium">{p.nomor_hp || '-'}</td>
                  <td className="p-3.5 max-w-[200px] truncate">{p.alamat || '-'}</td>
                  <td className="p-3.5 text-right font-bold text-red-500">
                    {p.hutang > 0 ? formatRupiah(p.hutang) : 'Lunas / Nihil'}
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
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 hover:opacity-80"
                        style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      >
                        <EditIcon size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 hover:opacity-80"
                        style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                      >
                        <TrashIcon size={14} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {listFiltered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                      <TruckIcon size={48} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Pemasok tidak ditemukan
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {listPaginasi.map((p) => (
            <div key={p.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
              {/* Header: Nama & Status */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm leading-tight">{p.nama}</h3>
                  <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    ID Supplier: {p.id}
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

              {/* Detail Info: PIC, Phone, Office, Debt */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>PIC Kontak</p>
                  <p className="font-semibold mt-0.5">{p.kontak || '-'}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>No. WhatsApp</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--primary)' }}>{p.nomor_hp || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Alamat Kantor</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{p.alamat || '-'}</p>
                </div>
                <div className="col-span-2 border-t pt-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Hutang Dagang</p>
                  <p className="font-bold mt-0.5 text-red-500 text-xs">
                    {p.hutang > 0 ? formatRupiah(p.hutang) : 'Lunas / Nihil'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => bukaEdit(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <EditIcon size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 hover:opacity-80"
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                >
                  <TrashIcon size={12} /> Hapus
                </button>
              </div>
            </div>
          ))}

          {listFiltered.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                <TruckIcon size={48} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Pemasok tidak ditemukan
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
              Menampilkan {Math.min(listSorted.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(listSorted.length, halaman * itemPerHalaman)} dari {listSorted.length} supplier
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
                  {editId === null ? 'Registrasi Supplier Baru' : 'Edit Detail Supplier'}
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
                {/* Nama Pemasok */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nama Pemasok / PT / CV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Indofood Sukses Makmur"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Nama PIC */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nama Kontak perwakilan (PIC)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Haji Ahmad"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Nomor HP */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Hutang */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Total Hutang ke Supplier ini (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 500000"
                    value={hutang}
                    onChange={(e) => setHutang(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Alamat Supplier
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Alamat kantor / gudang supplier..."
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
                    id="supplier-aktif"
                    checked={aktif}
                    onChange={(e) => setAktif(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primary)]"
                  />
                  <label htmlFor="supplier-aktif" className="text-xs font-semibold select-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    Aktifkan supplier (bisa dipilih saat input barang masuk)
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
