/**
 * stok/opname/page.tsx
 * Halaman Stok Opname — Penyesuaian stok sistem dengan jumlah fisik di toko.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { ChevronLeftIcon, ReceiptIcon } from '@/components/ui/Icons';

export default function StokOpname() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('produk_id') ? parseInt(searchParams.get('produk_id')!) : null;

  const { produkList, opnameStok } = useData();

  // Form State
  const [produkId, setProdukId] = useState<number | ''>('');
  const [qtyFisik, setQtyFisik] = useState('');
  const [catatan, setCatatan] = useState('');

  // Selected product detail helper
  const produk = useMemo(() => {
    if (!produkId) return null;
    return produkList.find((p) => p.id === produkId);
  }, [produkList, produkId]);

  // Selisih calculation
  const selisih = useMemo(() => {
    if (!produk || qtyFisik === '') return 0;
    return parseInt(qtyFisik) - produk.stok;
  }, [produk, qtyFisik]);

  // Pre-fill selection
  useEffect(() => {
    if (preSelectedId) {
      setProdukId(preSelectedId);
    }
  }, [preSelectedId]);

  // Handle submit form
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!produkId || qtyFisik === '') return;

    opnameStok(produkId, parseInt(qtyFisik), catatan || null);
    router.push('/stok');
  }

  // Filter out deleted products
  const produkTersedia = useMemo(() => {
    return produkList.filter((p) => !p.deleted_at);
  }, [produkList]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/stok" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon size={14} /> Persediaan
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            Stok Opname
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <ReceiptIcon size={24} style={{ color: 'var(--primary)' }} /> Stok Opname
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Cocokkan stok yang tercatat di sistem dengan stok fisik barang yang ada di toko/rak.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">
        {/* Kolom Kiri: Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 rounded-2xl p-5 md:p-6 space-y-4 w-full max-w-full min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            Form Penyesuaian Stok
          </h2>

          {/* Pilih Produk */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Pilih Produk <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={produkId}
              onChange={(e) => setProdukId(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">-- Pilih Produk --</option>
              {produkTersedia.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.kode}] {p.nama} (Stok Sistem: {p.stok} {p.satuan})
                </option>
              ))}
            </select>
          </div>

          {produk && (
            <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
              {/* Stok Sistem (Locked) */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Stok Sistem Saat Ini
                </label>
                <div
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  {produk.stok} {produk.satuan}
                </div>
              </div>

              {/* Stok Fisik */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Jumlah Fisik Sebenarnya <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Masukkan jumlah fisik..."
                  value={qtyFisik}
                  onChange={(e) => setQtyFisik(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

          {/* Selisih Indicator */}
          {produk && qtyFisik !== '' && (
            <div
              className="p-3.5 rounded-xl flex items-center justify-between animate-slide-up text-xs font-semibold"
              style={{
                background:
                  selisih === 0
                    ? 'var(--success-light)'
                    : selisih > 0
                    ? 'rgba(20,184,166,0.1)'
                    : 'var(--danger-light)',
                color:
                  selisih === 0
                    ? 'var(--success)'
                    : selisih > 0
                    ? 'var(--primary)'
                    : 'var(--danger)',
              }}
            >
              <span>Selisih Penyesuaian:</span>
              <span className="text-sm font-bold">
                {selisih > 0 ? `+${selisih}` : selisih} {produk.satuan} ({selisih === 0 ? 'Sesuai' : selisih > 0 ? 'Surplus' : 'Defisit'})
              </span>
            </div>
          )}

          {/* Catatan Alasan */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Alasan Selisih / Catatan
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Barang pecah di rak, salah hitung sebelumnya, dicuri, expired..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => router.push('/stok')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
            >
              Simpan & Sesuaikan
            </button>
          </div>
        </form>

        {/* Kolom Kanan: Panduan */}
        <div
          className="rounded-2xl p-5 md:p-6 space-y-4 shadow-sm h-fit w-full max-w-full min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Panduan Stok Opname
          </h3>
          <ul className="text-xs space-y-2.5 list-disc pl-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <li>
              Lakukan stok opname secara berkala (misal: akhir bulan) untuk mencocokkan stok fisik barang dengan catatan sistem.
            </li>
            <li>
              Pilih produk yang ingin disesuaikan dari menu dropdown.
            </li>
            <li>
              Hitung jumlah fisik barang di rak secara teliti, lalu masukkan ke dalam kolom <strong>Jumlah Fisik</strong>.
            </li>
            <li>
              Jika terjadi selisih minus (defisit), berikan alasan di kolom catatan seperti <em>barang rusak</em>, <em>expired</em>, atau <em>hilang</em>.
            </li>
            <li>
              Menekan tombol <strong>Simpan & Sesuaikan</strong> akan langsung memperbarui stok sistem menjadi sama dengan jumlah fisik yang diinput.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
