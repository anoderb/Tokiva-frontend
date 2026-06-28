/**
 * produk/[id]/page.tsx
 * Halaman detail produk — menampilkan info detail, stok status, margin keuangan, dan barcode preview.
 */

'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import { getStatusStok } from '@/types/produk';
import { ChevronLeftIcon, EditIcon, TrashIcon, PackageIcon, ReceiptIcon } from '@/components/ui/Icons';

interface DetailProdukProps {
  params: Promise<{ id: string }>;
}

export default function DetailProduk({ params }: DetailProdukProps) {
  const router = useRouter();
  const { id } = use(params);
  const prodId = parseInt(id);

  const { produkList, kategoriList, pemasokList, hargaTingkatList, hapusProduk } = useData();

  const produk = useMemo(() => {
    return produkList.find((p) => p.id === prodId);
  }, [produkList, prodId]);

  const kategori = useMemo(() => {
    if (!produk) return null;
    return kategoriList.find((k) => k.id === produk.kategori_id);
  }, [kategoriList, produk]);

  const supplier = useMemo(() => {
    if (!produk || !produk.supplier_id) return null;
    return pemasokList.find((s) => s.id === produk.supplier_id);
  }, [pemasokList, produk]);

  const tingkatHarga = useMemo(() => {
    return hargaTingkatList.filter((h) => h.produk_id === prodId);
  }, [hargaTingkatList, prodId]);

  if (!produk) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-4">
          <PackageIcon size={64} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Produk Tidak Ditemukan
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          Produk yang Anda cari tidak ada atau sudah dihapus.
        </p>
        <Link
          href="/produk"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--primary)' }}
        >
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const status = getStatusStok(produk);
  const profitNominal = produk.harga_jual - produk.harga_beli;
  const profitMargin = ((profitNominal / produk.harga_jual) * 100) || 0;

  async function handleHapus() {
    if (confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) {
      try {
        const res = await hapusProduk(produk!.id);
        if (res && res.sukses) {
          router.push('/produk');
        } else {
          alert(res?.pesan || 'Gagal menghapus produk');
        }
      } catch (err) {
        console.error(err);
        alert('Koneksi terganggu atau gagal menghapus.');
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/produk" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <ChevronLeftIcon size={14} /> Produk
            </Link>
            <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              Detail
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
            {produk.nama}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Kode: {produk.kode} {produk.barcode && `| Barcode: ${produk.barcode}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/produk/tambah?edit=${produk.id}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--primary)' }}
          >
            <EditIcon size={14} /> Edit
          </Link>
          <button
            onClick={handleHapus}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95"
            style={{ background: 'var(--danger)' }}
          >
            <TrashIcon size={14} /> Hapus
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">
        {/* Kolom Kiri & Tengah: Info Utama */}
        <div className="lg:col-span-2 space-y-6 w-full max-w-full min-w-0">
          {/* Card Info */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Spesifikasi Produk
            </h2>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nama Produk</p>
                <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{produk.nama}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Kategori</p>
                <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {kategori ? kategori.nama : 'Lainnya'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Kode SKU / PLU</p>
                <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{produk.kode}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Barcode EAN</p>
                <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{produk.barcode || '-'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Satuan</p>
                <p className="font-semibold mt-1 uppercase" style={{ color: 'var(--text-primary)' }}>{produk.satuan}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pemasok / Supplier</p>
                <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {supplier ? supplier.nama : 'Tidak ditentukan'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Deskripsi</p>
              <p className="mt-1.5 leading-relaxed text-sm" style={{ color: 'var(--text-secondary)' }}>
                {produk.deskripsi || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>
          </div>

          {/* Card Harga Bertingkat */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-bold pb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              <ReceiptIcon size={16} style={{ color: 'var(--primary)' }} /> Skema Harga Bertingkat
            </h2>

            <div className="grid grid-cols-3 gap-4 text-center py-3 rounded-xl" style={{ background: 'var(--bg)' }}>
              <div>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>ECERAN</p>
                <p className="text-base font-bold mt-1" style={{ color: 'var(--primary)' }}>
                  {formatRupiah(produk.harga_jual)}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Min. 1 {produk.satuan}</p>
              </div>
              {tingkatHarga.map((h, i) => (
                <div key={h.id}>
                  <p className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>{h.tingkat}</p>
                  <p className="text-base font-bold mt-1" style={{ color: 'var(--primary)' }}>
                    {formatRupiah(h.harga)}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Min. {h.min_qty} {produk.satuan}</p>
                </div>
              ))}
              {tingkatHarga.length === 0 && (
                <div className="col-span-2 flex items-center justify-center">
                  <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
                    Tidak ada harga grosir / partai
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Finansial & Stok */}
        <div className="space-y-6 w-full max-w-full min-w-0">
          {/* Foto Produk */}
          {produk.foto_url && (
            <div
              className="rounded-2xl p-5 md:p-6 flex flex-col items-start justify-center space-y-4 animate-fade-in animate-slide-up"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider w-full pb-2 border-b text-zinc-400" style={{ borderColor: 'var(--border)' }}>
                Foto Produk ({
                  (() => {
                    try {
                      if (produk.foto_url.startsWith('[')) {
                        return JSON.parse(produk.foto_url).length;
                      }
                    } catch {}
                    return 1;
                  })()
                })
              </h3>
              <div className="flex flex-wrap gap-2 w-full justify-center sm:justify-start">
                {(() => {
                  let urls = [];
                  try {
                    if (produk.foto_url.startsWith('[')) {
                      urls = JSON.parse(produk.foto_url);
                    } else {
                      urls = [produk.foto_url];
                    }
                  } catch {
                    urls = [produk.foto_url];
                  }
                  return urls.map((url: string, idx: number) => (
                    <div key={idx} className="w-24 h-24 rounded-xl border overflow-hidden bg-zinc-50 dark:bg-zinc-800" style={{ borderColor: 'var(--border)' }}>
                      <img
                        src={url}
                        alt={`${produk.nama} - Angle ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Card Stok Status */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Status Persediaan
            </h2>

            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Stok Saat Ini</span>
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  background:
                    status === 'expired'
                      ? 'var(--danger-light)'
                      : status === 'habis'
                      ? 'var(--danger-light)'
                      : status === 'rendah'
                      ? 'var(--warning-light)'
                      : 'var(--success-light)',
                  color:
                    status === 'expired'
                      ? 'var(--danger)'
                      : status === 'habis'
                      ? 'var(--danger)'
                      : status === 'rendah'
                      ? 'var(--warning)'
                      : 'var(--success)',
                }}
              >
                {produk.stok} {produk.satuan}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Stok Minimal</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {produk.stok_min} {produk.satuan}
              </span>
            </div>

            {produk.expired_date && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Kadaluarsa</span>
                <span className="font-semibold" style={{ color: status === 'expired' ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {produk.expired_date}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Status Stok</span>
              <span
                className="font-bold uppercase tracking-wider text-xs"
                style={{
                  color:
                    status === 'ok'
                      ? 'var(--success)'
                      : status === 'rendah'
                      ? 'var(--warning)'
                      : 'var(--danger)',
                }}
              >
                {status === 'ok' ? 'Normal (OK)' : status === 'rendah' ? 'Rendah' : status === 'expired' ? 'Kadaluarsa' : 'Habis'}
              </span>
            </div>
          </div>

          {/* Card Finansial Margin */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Analisis Profit
            </h2>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Harga Beli</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatRupiah(produk.harga_beli)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Harga Jual</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatRupiah(produk.harga_jual)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Laba Kotor / Item</span>
              <span className="font-bold" style={{ color: 'var(--success)' }}>
                +{formatRupiah(profitNominal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Persentase Margin</span>
              <span className="font-bold" style={{ color: 'var(--success)' }}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
