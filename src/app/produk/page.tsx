/**
 * produk/page.tsx
 * Halaman list produk — tabel produk, filter kategori, status stok, search, dan pagination.
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import { getStatusStok } from '@/types/produk';
import * as Icons from '@/components/ui/Icons';
import { BarcodeScanner } from '@/lib/barcode_scanner';

export default function DaftarProduk() {
  const { produkList, kategoriList, hapusProduk } = useData();

  // Camera & Scan states
  const [tampilDialogScan, setTampilDialogScan] = useState(false);
  const [tampilDialogCariGambar, setTampilDialogCariGambar] = useState(false);
  const [sedangAnalisisGambar, setSedangAnalisisGambar] = useState(false);
  const [hasilDeteksiGambar, setHasilDeteksiGambar] = useState<{ nama: string; akurasi: number; id: number } | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  // Webcam stream handlers
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [errorKamera, setErrorKamera] = useState('');
  
  // Real Barcode Scanner ref
  const barcodeScannerRef = useRef<BarcodeScanner | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const mulaiScannerCamera = () => {
    setErrorKamera('');
    setKameraAktif(false);
    lastScanTimeRef.current = Date.now();

    const scanner = new BarcodeScanner('barcode-viewfinder');
    barcodeScannerRef.current = scanner;

    scanner.start(
      (decodedText) => {
        playBeep();
        lastScanTimeRef.current = Date.now();
        setPencarian(decodedText);
        setHalaman(1);
        tampilkanToast(`Berhasil Scan Barcode: ${decodedText}`);
        tutupScannerBarcode();
      },
      (err) => {
        // Frame-by-frame error silent
      }
    ).then(() => {
      setKameraAktif(true);
    }).catch((err) => {
      console.error('Barcode scanner start error:', err);
      setErrorKamera('Gagal mengakses kamera fisik untuk barcode.');
      setKameraAktif(false);
    });
  };

  // Effect to automatically run html5-qrcode when barcode scan dialog opens
  useEffect(() => {
    let alertInterval: any;
    let timer: any;

    if (tampilDialogScan) {
      alertInterval = setInterval(() => {
        if (Date.now() - lastScanTimeRef.current >= 7000) {
          tampilkanToast('Tidak ada barcode terdeteksi. Coba arahkan lebih dekat atau gunakan input manual.', 'warning');
        }
      }, 7000);

      timer = setTimeout(() => {
        mulaiScannerCamera();
      }, 300);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(alertInterval);
      if (barcodeScannerRef.current) {
        barcodeScannerRef.current.stop();
      }
    };
  }, [tampilDialogScan]);

  const playBeep = () => {
    try {
      const audio = new Audio('/beep.mp3');
      audio.volume = 0.4;
      audio.play().catch((err) => {
        console.warn('Audio play failed, falling back to Web Audio API oscillator:', err);
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 100);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const tampilkanToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
  };

  // Upload barcode image handler
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleUploadBarcode = async (file: File) => {
    try {
      // 1. Matikan kamera scanner yang sedang berjalan terlebih dahulu agar tidak konflik/gelap
      if (barcodeScannerRef.current) {
        await barcodeScannerRef.current.stop();
      }
      setKameraAktif(false);

      // 2. Gunakan instance baru untuk membaca file gambar
      const fileScanner = new BarcodeScanner('barcode-viewfinder');
      fileScanner.scanFile(
        file,
        (decodedText) => {
          playBeep();
          lastScanTimeRef.current = Date.now();
          setPencarian(decodedText);
          setHalaman(1);
          tampilkanToast(`Berhasil Scan Barcode: ${decodedText}`);
          setTampilDialogScan(false);
        },
        (err) => {
          tampilkanToast('Barcode tidak ditemukan dalam gambar. Pastikan gambar jelas dan dekat.', 'warning');
          // Nyalakan kembali scanner kamera agar user bisa mencoba lagi dengan kamera
          mulaiScannerCamera();
        }
      );
    } catch (e) {
      tampilkanToast('Gagal memproses gambar barcode.', 'warning');
      mulaiScannerCamera();
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const aktifkanKamera = async () => {
    setErrorKamera('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setKameraAktif(true);
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      setErrorKamera('Kamera fisik tidak terdeteksi atau tidak diizinkan. Menggunakan mode simulasi.');
      setKameraAktif(false);
    }
  };

  const matikanKamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setKameraAktif(false);
  };
  const tutupScannerBarcode = async () => {
    if (barcodeScannerRef.current) {
      await barcodeScannerRef.current.stop();
    }
    setTampilDialogScan(false);
    setKameraAktif(false);
  };
  const ambilFotoDanAnalisis = async () => {
    if (!videoRef.current) return;
    setErrorKamera('');
    setSedangAnalisisGambar(true);
    setHasilDeteksiGambar(null);
    
    try {
      // 1. Capture frame ke canvas
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Gagal inisialisasi context canvas.');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Matikan kamera setelah capture
      matikanKamera();

      // 2. Load model & hitung embedding
      const { getImageEmbedding, findNearestProduct } = await import('@/lib/image_classifier');
      const queryEmb = await getImageEmbedding(canvas);

      // Filter produk yang punya foto_embedding
      const productsToMatch = produkList.filter(p => !p.deleted_at && p.foto_embedding);
      
      if (productsToMatch.length === 0) {
        throw new Error('Tidak ada produk terdaftar yang memiliki foto embedding untuk dibandingkan.');
      }

      const matches = findNearestProduct(queryEmb, productsToMatch as any);
      
      if (matches && matches.length > 0) {
        const bestMatch = matches[0];
        if (bestMatch.similarity > 0.70) {
          setHasilDeteksiGambar({
            nama: bestMatch.product.nama,
            akurasi: Math.round(bestMatch.similarity * 100),
            id: bestMatch.product.id
          });
          playBeep();
        } else {
          setErrorKamera(`Produk terdeteksi adalah "${bestMatch.product.nama}" tapi tingkat kemiripan rendah (${Math.round(bestMatch.similarity * 100)}%).`);
        }
      } else {
        setErrorKamera('Produk tidak dikenali. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error('Pencarian Gambar Error:', err);
      setErrorKamera(err.message || 'Gagal memproses pendeteksian produk.');
    } finally {
      setSedangAnalisisGambar(false);
    }
  };

  // Re-attach stream when camera becomes active and video element mounts
  useEffect(() => {
    if (kameraAktif && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [kameraAktif]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const [pencarian, setPencarian] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [produkDipilihHapus, setProdukDipilihHapus] = useState<number | null>(null);

  // Pagination state
  const [halaman, setHalaman] = useState(1);
  const itemPerHalaman = 10;

  // Sorting state
  const [sortKey, setSortKey] = useState<string>('nama-asc');

  // Filter produk yang aktif (belum didelete)
  const produkTersedia = useMemo(() => {
    return produkList.filter((p) => !p.deleted_at);
  }, [produkList]);

  // Filter berdasarkan search, kategori, status stok
  const produkFiltered = useMemo(() => {
    return produkTersedia.filter((p) => {
      // Search
      const matchSearch =
        p.nama.toLowerCase().includes(pencarian.toLowerCase()) ||
        p.kode.toLowerCase().includes(pencarian.toLowerCase()) ||
        (p.barcode && p.barcode.includes(pencarian));
      
      // Kategori
      const matchKategori = kategoriFilter === null || p.kategori_id === kategoriFilter;

      // Status Stok
      const status = getStatusStok(p);
      const matchStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'ok' && status === 'ok') ||
        (statusFilter === 'rendah' && status === 'rendah') ||
        (statusFilter === 'habis' && status === 'habis') ||
        (statusFilter === 'expired' && status === 'expired');

      return matchSearch && matchKategori && matchStatus;
    });
  }, [produkTersedia, pencarian, kategoriFilter, statusFilter]);

  // Sort produk
  const produkSorted = useMemo(() => {
    const [field, order] = sortKey.split('-');
    return [...produkFiltered].sort((a, b) => {
      let valA: any = a[field === 'harga' ? 'harga_jual' : field === 'stok' ? 'stok' : (field as keyof typeof a)];
      let valB: any = b[field === 'harga' ? 'harga_jual' : field === 'stok' ? 'stok' : (field as keyof typeof b)];
      
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
  }, [produkFiltered, sortKey]);

  // Total pages
  const totalHalaman = Math.ceil(produkFiltered.length / itemPerHalaman) || 1;

  // Slice item for current page
  const produkPaginasi = useMemo(() => {
    const start = (halaman - 1) * itemPerHalaman;
    return produkSorted.slice(start, start + itemPerHalaman);
  }, [produkSorted, halaman]);

  // Handle delete
  async function konfirmasiHapus(id: number) {
    try {
      tampilkanToast('Sedang menghapus produk...', 'warning');
      const res = await hapusProduk(id);
      if (res && res.sukses) {
        tampilkanToast(res.pesan, 'success');
      } else {
        tampilkanToast(res?.pesan || 'Gagal menghapus produk', 'warning');
      }
    } catch (err) {
      tampilkanToast('Koneksi terganggu atau gagal menghapus.', 'warning');
      console.error(err);
    }
    setProdukDipilihHapus(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Daftar Produk
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Kelola dan pantau produk toko Anda ({produkFiltered.length} produk)
          </p>
        </div>
        <Link
          href="/produk/tambah"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:shadow-lg active:scale-95"
          style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
        >
          <Icons.PlusIcon size={16} /> Tambah Produk
        </Link>
      </div>

      {/* Filters Bar */}
      <div
        className="rounded-xl p-4 grid md:grid-cols-5 gap-3.5 w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Search */}
        <div className="relative flex gap-1.5 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
              <Icons.SearchIcon size={16} className="opacity-50" />
            </span>
            <input
              type="text"
              placeholder="Cari produk..."
              value={pencarian}
              onChange={(e) => { setPencarian(e.target.value); setHalaman(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm transition-all duration-200"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>
          <button
            onClick={() => { setTampilDialogScan(true); }}
            title="Scan Barcode"
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] border transition-all active:scale-95 shrink-0"
            style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <Icons.ScanIcon size={16} />
          </button>
          <button
            onClick={() => { setTampilDialogCariGambar(true); }}
            title="Cari Berdasarkan Gambar"
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] border transition-all active:scale-95 shrink-0"
            style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <Icons.CameraIcon size={16} />
          </button>
        </div>

        {/* Kategori Filter */}
        <div>
          <select
            value={kategoriFilter || ''}
            onChange={(e) => { setKategoriFilter(e.target.value ? parseInt(e.target.value) : null); setHalaman(1); }}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map((kat) => (
              <option key={kat.id} value={kat.id}>
                {kat.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Status Stok Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setHalaman(1); }}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="semua">Semua Status Stok</option>
            <option value="ok">Stok Normal (OK)</option>
            <option value="rendah">Stok Rendah</option>
            <option value="habis">Stok Habis</option>
            <option value="expired">Kadaluarsa</option>
          </select>
        </div>

        {/* Urutan Filter */}
        <div>
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value); setHalaman(1); }}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="nama-asc">Nama (A-Z)</option>
            <option value="nama-desc">Nama (Z-A)</option>
            <option value="kode-asc">Kode SKU (A-Z)</option>
            <option value="harga-asc">Harga Terendah</option>
            <option value="harga-desc">Harga Tertinggi</option>
            <option value="stok-asc">Stok Tersedikit</option>
            <option value="stok-desc">Stok Terbanyak</option>
          </select>
        </div>

        {/* Kategori link shortcut */}
        <div className="flex items-center justify-end">
          <Link
            href="/produk/kategori"
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-85 transition-opacity"
            style={{ color: 'var(--primary)' }}
          >
            <Icons.PromoIcon size={14} /> Kelola Kategori &rarr;
          </Link>
        </div>
      </div>

      {/* Table Container */}
      <div
        className="rounded-xl overflow-hidden shadow-sm w-full max-w-full min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="hidden md:block overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full min-w-[800px] text-left text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Kode / Barcode</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Nama Produk</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Kategori</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Harga Beli</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Harga Jual</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Stok</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {produkPaginasi.map((produk) => {
                const status = getStatusStok(produk);
                const kategori = kategoriList.find((k) => k.id === produk.kategori_id);
                return (
                  <tr
                    key={produk.id}
                    className="hover:opacity-95 transition-opacity"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <td className="p-4">
                      <p className="font-semibold text-xs">{produk.kode}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {produk.barcode || '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-sm">{produk.nama}</p>
                      {produk.expired_date && (
                        <p className="text-[10px] mt-0.5" style={{ color: status === 'expired' ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                          Exp: {produk.expired_date}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold uppercase tracking-wider">
                      {kategori ? kategori.nama : 'Lainnya'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatRupiah(produk.harga_beli)}
                    </td>
                    <td className="p-4 text-right font-bold" style={{ color: 'var(--primary)' }}>
                      {formatRupiah(produk.harga_jual)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
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
                        {status !== 'ok' && (
                          <span
                            className="text-[9px] font-bold mt-1 uppercase tracking-wider"
                            style={{
                              color: status === 'rendah' ? 'var(--warning)' : 'var(--danger)',
                            }}
                          >
                            {status === 'expired' ? 'Expired' : status === 'habis' ? 'Habis' : 'Stok Rendah'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/produk/${produk.id}`}
                          title="Lihat Detail"
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Icons.EyeIcon size={16} />
                        </Link>
                        <Link
                          href={`/produk/tambah?edit=${produk.id}`}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ color: 'var(--primary)' }}
                        >
                          <Icons.EditIcon size={16} />
                        </Link>
                        <button
                          onClick={() => setProdukDipilihHapus(produk.id)}
                          title="Hapus"
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Icons.TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {produkFiltered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                      <Icons.PackageIcon size={48} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                      Produk tidak ditemukan
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card List Mobile */}
        <div className="block md:hidden divide-y animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          {produkPaginasi.map((produk) => {
            const status = getStatusStok(produk);
            const kategori = kategoriList.find((k) => k.id === produk.kategori_id);
            return (
              <div key={produk.id} className="p-4 space-y-3 hover:opacity-95 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                {/* Header: Nama & Kategori Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight truncate">{produk.nama}</h3>
                    <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Kode: {produk.kode} {produk.barcode && `• Barcode: ${produk.barcode}`}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                      color: 'var(--primary)'
                    }}
                  >
                    {kategori ? kategori.nama : 'Lainnya'}
                  </span>
                </div>

                {/* Info Detail: Harga & Stok */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg text-[10px] sm:text-xs" style={{ background: 'var(--bg)' }}>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Harga Beli</p>
                    <p className="font-semibold mt-0.5">{formatRupiah(produk.harga_beli)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Harga Jual</p>
                    <p className="font-bold mt-0.5" style={{ color: 'var(--primary)' }}>{formatRupiah(produk.harga_jual)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Persediaan</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-bold">{produk.stok} {produk.satuan}</span>
                      <span className="w-1.5 h-1.5 rounded-full" style={{
                        background: status === 'expired' || status === 'habis' ? 'var(--danger)' : status === 'rendah' ? 'var(--warning)' : 'var(--success)'
                      }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status Stok</p>
                    <p className="font-semibold mt-0.5 capitalize text-[9px] sm:text-[10px]" style={{
                      color: status === 'expired' || status === 'habis' ? 'var(--danger)' : status === 'rendah' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {status === 'expired' ? 'Expired' : status === 'habis' ? 'Habis' : 'Normal'}
                    </p>
                  </div>
                </div>

                {/* Footer: Expired & Aksi */}
                <div className="flex items-center justify-between pt-1">
                  {produk.expired_date ? (
                    <span className="text-[9px]" style={{ color: status === 'expired' ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                      Exp: {produk.expired_date}
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/produk/${produk.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-[var(--surface-hover)] border transition-colors"
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                    >
                      <Icons.EyeIcon size={12} /> Detail
                    </Link>
                    <Link
                      href={`/produk/tambah?edit=${produk.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-[var(--surface-hover)] border transition-colors"
                      style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
                    >
                      <Icons.EditIcon size={12} /> Edit
                    </Link>
                    <button
                      onClick={() => setProdukDipilihHapus(produk.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 border transition-colors"
                      style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                    >
                      <Icons.TrashIcon size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {produkFiltered.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                <Icons.PackageIcon size={48} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Produk tidak ditemukan
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalHalaman > 1 && (
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Menampilkan {Math.min(produkFiltered.length, (halaman - 1) * itemPerHalaman + 1)} - {Math.min(produkFiltered.length, halaman * itemPerHalaman)} dari {produkFiltered.length} produk
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

      {/* Dialog Konfirmasi Hapus */}
      {produkDipilihHapus !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
            onClick={() => setProdukDipilihHapus(null)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 animate-scale-check">
            <div
              className="rounded-2xl p-6 space-y-4 shadow-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-base font-bold text-center" style={{ color: 'var(--text-primary)' }}>
                Hapus Produk?
              </h3>
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Apakah Anda yakin ingin menonaktifkan produk ini? Produk yang dihapus tidak akan tampil di kasir.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setProdukDipilihHapus(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors"
                  style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Batal
                </button>
                <button
                  onClick={() => konfirmasiHapus(produkDipilihHapus)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors"
                  style={{ background: 'var(--danger)' }}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up text-xs font-bold uppercase tracking-wider ${toastType === 'warning' ? 'bg-rose-600' : 'bg-teal-600'}`}>
          {toastType === 'warning' ? <Icons.CloseIcon size={16} strokeWidth={3} /> : <Icons.CheckIcon size={16} strokeWidth={3} />}
          {toastMessage}
        </div>
      )}

      {/* Modal Scan Barcode */}
      {tampilDialogScan && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50 animate-fade-in"
            onClick={tutupScannerBarcode}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Icons.ScanIcon size={18} style={{ color: 'var(--primary)' }} /> Pemindai Barcode Kamera
                </h2>
                <button
                  type="button"
                  onClick={tutupScannerBarcode}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <Icons.CloseIcon size={18} />
                </button>
              </div>

              {/* Viewfinder Area */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <div id="barcode-viewfinder" className="w-full h-full object-cover" />

                {!kameraAktif && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-center p-6 text-zinc-500 z-10">
                    {errorKamera ? (
                      <div>
                        <Icons.CloseIcon size={32} className="mx-auto mb-2 text-rose-500 opacity-80" />
                        <p className="text-[10px] uppercase font-bold tracking-wider text-rose-500">Gagal Mengakses Kamera</p>
                        <p className="text-[9px] text-amber-500 mt-1.5 max-w-xs mx-auto">{errorKamera}</p>
                      </div>
                    ) : (
                      <div>
                        <Icons.CameraIcon size={32} className="mx-auto mb-2 opacity-40 animate-pulse" />
                        <p className="text-[10px] uppercase font-bold tracking-wider">Menghubungkan Kamera...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Laser animation */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scan-laser z-10" />

                {/* Scanner corners */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-teal-500 z-10" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-teal-500 z-10" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-teal-500 z-10" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-teal-500 z-10" />
              </div>

              {/* Control panel */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-zinc-400">
                  Arahkan kamera ke barcode EAN/UPC produk untuk memindai secara otomatis.
                </p>

                {/* Keyboard input backup */}
                <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[9px] text-zinc-400 text-center uppercase font-bold tracking-wider mb-2">
                    Atau Ketik Kode Barcode / PLU Manual
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('barcode-input') as HTMLInputElement;
                      const code = input.value.trim().toLowerCase();
                      if (code) {
                        const produk = produkList.find(
                          (p) =>
                            !p.deleted_at &&
                            (p.kode.toLowerCase() === code || (p.barcode && p.barcode.toLowerCase() === code))
                        );
                        if (produk) {
                          playBeep();
                          setPencarian(produk.barcode || produk.kode);
                          setHalaman(1);
                          tampilkanToast(`Berhasil Scan: ${produk.nama}`);
                          input.value = '';
                          matikanKamera();
                          setTampilDialogScan(false);
                        } else {
                          // Allow fallback search filter even if not in DB
                          setPencarian(code);
                          setHalaman(1);
                          tampilkanToast(`Mencari: ${code}`);
                          input.value = '';
                          matikanKamera();
                          setTampilDialogScan(false);
                        }
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      name="barcode-input"
                      type="text"
                      placeholder="Masukkan barcode EAN/UPC..."
                      className="flex-1 px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700 active:scale-95"
                    >
                      Scan
                    </button>
                  </form>

                  {/* Upload Gambar Barcode */}
                  <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-[9px] text-zinc-400 text-center uppercase font-bold tracking-wider mb-2">
                      Atau Upload Gambar Barcode
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadBarcode(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border flex items-center justify-center gap-1.5"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      <Icons.CameraIcon size={14} /> Pilih File Gambar Barcode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Cari Gambar */}
      {tampilDialogCariGambar && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50 animate-fade-in"
            onClick={() => { matikanKamera(); setTampilDialogCariGambar(false); setSedangAnalisisGambar(false); setHasilDeteksiGambar(null); }}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Icons.CameraIcon size={18} style={{ color: 'var(--primary)' }} /> Pencarian Gambar (AI Vision)
                </h2>
                <button
                  type="button"
                  onClick={() => { matikanKamera(); setTampilDialogCariGambar(false); setSedangAnalisisGambar(false); setHasilDeteksiGambar(null); }}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <Icons.CloseIcon size={18} />
                </button>
              </div>

              {/* Viewfinder / Upload Area */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {kameraAktif ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-zinc-500 w-full">
                    {sedangAnalisisGambar ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] uppercase font-bold tracking-wider animate-pulse" style={{ color: 'var(--primary)' }}>Mengidentifikasi Objek Produk...</p>
                      </div>
                    ) : hasilDeteksiGambar ? (
                      <div className="p-4 space-y-3">
                        <Icons.CheckIcon size={40} style={{ color: 'var(--primary)' }} className="mx-auto" />
                        <p className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                          Identifikasi Berhasil!
                        </p>
                        <div className="p-3 rounded-lg border text-left bg-[var(--bg)]" style={{ borderColor: 'var(--border)' }}>
                          <p className="text-[9px] uppercase tracking-wider text-zinc-400">Objek Terdeteksi</p>
                          <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{hasilDeteksiGambar.nama}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Akurasi AI: {hasilDeteksiGambar.akurasi}%</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Icons.CameraIcon size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-[10px] uppercase font-bold tracking-wider mb-2">Gunakan Kamera atau Mock Simulator</p>
                        {errorKamera && <p className="text-[9px] text-amber-500 mb-3 max-w-xs mx-auto">{errorKamera}</p>}
                        <button
                          onClick={aktifkanKamera}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700 transition-colors mx-auto"
                        >
                          Aktifkan Kamera
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Analysis scan line overlay */}
                {sedangAnalisisGambar && (
                  <div className="absolute inset-x-0 h-0.5 bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-bounce top-0 bottom-0" />
                )}
              </div>

              {/* Control Panel */}
              <div className="p-5 space-y-4">
                {kameraAktif && (
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={ambilFotoDanAnalisis}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white uppercase bg-teal-600 hover:bg-teal-700 active:scale-95"
                    >
                      Ambil Foto & Analisis
                    </button>
                  </div>
                )}

                {/* Non-camera mode alternative */}
                {!kameraAktif && !sedangAnalisisGambar && !hasilDeteksiGambar && (
                  <p className="text-xs text-zinc-500">
                    Aktifkan kamera untuk mencari produk secara visual.
                  </p>
                )}

                {hasilDeteksiGambar && (
                  <button
                    onClick={() => {
                      setPencarian(hasilDeteksiGambar.nama);
                      setHalaman(1);
                      setHasilDeteksiGambar(null);
                      setTampilDialogCariGambar(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700"
                  >
                    Terapkan & Filter Produk
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
