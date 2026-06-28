/**
 * produk/tambah/page.tsx
 * Halaman tambah / edit produk dengan input lengkap, harga bertingkat, dan preview barcode.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { OPSI_SATUAN } from '@/lib/konstanta';
import type { TingkatHarga } from '@/types/produk';
import { ChevronLeftIcon, PlusIcon, CameraIcon, ScanIcon, CloseIcon, CheckIcon, PackageIcon } from '@/components/ui/Icons';
import { BarcodeScanner } from '@/lib/barcode_scanner';

interface RowHargaTingkat {
  tingkat: TingkatHarga;
  min_qty: number;
  harga: number;
}

export default function TambahEditProduk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') ? parseInt(searchParams.get('edit')!) : null;

  const {
    produkList,
    kategoriList,
    pemasokList,
    hargaTingkatList,
    tambahProduk,
    updateProduk,
  } = useData();

  // Basic Form State
  const [kode, setKode] = useState('');
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [tampilDialogScan, setTampilDialogScan] = useState(false);
  const [tampilDialogFotoProduct, setTampilDialogFotoProduct] = useState(false);
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
        setBarcode(decodedText);
        tampilkanToast(`Berhasil Scan Barcode: ${decodedText}`);
        tutupScannerBarcode();
      },
      (err) => {
        // Frame-by-frame scan error silent
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

  // Audio synthesizer beep
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
          setBarcode(decodedText);
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

  const ambilSnapshotKamera = () => {
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setFotoUrls((prev) => [...prev, dataUrl]);
          playBeep();
          tampilkanToast('Foto produk berhasil diambil!');
        }
      } catch (err) {
        console.error(err);
        ambilFotoSimulasi();
      }
    } else {
      ambilFotoSimulasi();
    }
    matikanKamera();
    setTampilDialogFotoProduct(false);
  };

  const ambilFotoSimulasi = () => {
    const nextId = produkList.length > 0 ? Math.max(...produkList.map((p) => p.id)) + 1 : 1;
    const colors = ['%230D9488', '%230F766E', '%2314B8A6', '%23F59E0B', '%233B82F6', '%23EF4444', '%2322C55E'];
    const randomColor = colors[nextId % colors.length];
    // A beautiful SVG mock product placeholder image
    const mockImage = `data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'200'%20height%3D'200'%20viewBox%3D'0%200%20200%20200'%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'${randomColor}'%2F%3E%3Ctext%20x%3D'50%25'%20y%3D'45%25'%20dominant-baseline%3D'middle'%20text-anchor%3D'middle'%20fill%3D'white'%20font-size%3D'14'%20font-weight%3D'black'%20font-family%3D'sans-serif'%3ETOKIVA%3C%2Ftext%3E%3Ctext%20x%3D'50%25'%20y%3D'60%25'%20dominant-baseline%3D'middle'%20text-anchor%3D'middle'%20fill%3D'white'%20opacity%3D'0.8'%20font-size%3D'10'%20font-weight%3D'bold'%20font-family%3D'sans-serif'%3EFOTO%20PRODUK%20%23${nextId}%3C%2Ftext%3E%3C%2Fsvg%3E`;
    setFotoUrls((prev) => [...prev, mockImage]);
    playBeep();
    tampilkanToast('Foto simulasi produk berhasil diambil!');
    matikanKamera();
    setTampilDialogFotoProduct(false);
  };
  const [barcode, setBarcode] = useState('');
  const [nama, setNama] = useState('');
  const [kategoriId, setKategoriId] = useState(1);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [satuan, setSatuan] = useState('pcs');
  const [hargaBeli, setHargaBeli] = useState('');
  const [hargaJual, setHargaJual] = useState('');
  const [stok, setStok] = useState('0');
  const [stokMin, setStokMin] = useState('5');
  const [expiredDate, setExpiredDate] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isEcer, setIsEcer] = useState(true);
  const [isAktif, setIsAktif] = useState(true);

  // Harga Bertingkat State
  const [rowsHargaTingkat, setRowsHargaTingkat] = useState<RowHargaTingkat[]>([]);

  // Load product if editing
  useEffect(() => {
    if (editId) {
      const prod = produkList.find((p) => p.id === editId);
      if (prod) {
        setKode(prod.kode);
        setBarcode(prod.barcode || '');
        setNama(prod.nama);
        setKategoriId(prod.kategori_id);
        setSupplierId(prod.supplier_id);
        setSatuan(prod.satuan);
        setHargaBeli(prod.harga_beli.toString());
        setHargaJual(prod.harga_jual.toString());
        setStok(prod.stok.toString());
        setStokMin(prod.stok_min.toString());
        setExpiredDate(prod.expired_date || '');
        setDeskripsi(prod.deskripsi || '');
        setIsEcer(prod.is_ecer);
        setIsAktif(prod.is_aktif);
        if (prod.foto_url) {
          try {
            if (prod.foto_url.startsWith('[')) {
              setFotoUrls(JSON.parse(prod.foto_url));
            } else {
              setFotoUrls([prod.foto_url]);
            }
          } catch {
            setFotoUrls([prod.foto_url]);
          }
        } else {
          setFotoUrls([]);
        }

        // Load harga bertingkat
        const matchingTingkat = hargaTingkatList
          .filter((h) => h.produk_id === editId)
          .map((h) => ({
            tingkat: h.tingkat,
            min_qty: h.min_qty,
            harga: h.harga,
          }));
        setRowsHargaTingkat(matchingTingkat);
      }
    } else {
      // Generate default PLU code for new product
      const nextId = produkList.length > 0 ? Math.max(...produkList.map((p) => p.id)) + 1 : 1;
      setKode(`PLU-${nextId.toString().padStart(3, '0')}`);
    }
  }, [editId, produkList, hargaTingkatList]);

  // Generate feature vector embedding from product photo
  async function generateEmbeddingFromBase64(base64Str: string): Promise<number[] | null> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = base64Str;
        img.onload = async () => {
          try {
            const { getImageEmbedding } = await import('@/lib/image_classifier');
            const emb = await getImageEmbedding(img);
            resolve(emb);
          } catch (e) {
            console.error('Gagal mengekstrak embedding dari gambar:', e);
            resolve(null);
          }
        };
        img.onerror = () => {
          console.error('Gagal memuat image source untuk embedding.');
          resolve(null);
        };
      } catch (err) {
        console.error(err);
        resolve(null);
      }
    });
  }

  // Handle submit form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama || !kode || !hargaBeli || !hargaJual) return;

    tampilkanToast('Sedang memproses & menyimpan produk...');

    let foto_embeddings: number[][] = [];
    if (fotoUrls && fotoUrls.length > 0) {
      for (const url of fotoUrls) {
        if (!url.startsWith('data:image/svg+xml')) {
          const emb = await generateEmbeddingFromBase64(url);
          if (emb) {
            foto_embeddings.push(emb);
          }
        }
      }
    }

    const dataPayload = {
      kode,
      barcode: barcode || null,
      nama,
      kategori_id: kategoriId,
      supplier_id: supplierId,
      satuan,
      harga_beli: parseFloat(hargaBeli) || 0,
      harga_jual: parseFloat(hargaJual) || 0,
      stok: parseInt(stok) || 0,
      stok_min: parseInt(stokMin) || 0,
      expired_date: expiredDate || null,
      foto_url: fotoUrls.length > 0 ? JSON.stringify(fotoUrls) : null,
      qr_url: null,
      deskripsi: deskripsi || null,
      is_ecer: isEcer,
      is_aktif: isAktif,
      foto_embedding: foto_embeddings.length > 0 ? foto_embeddings : null,
    };

    try {
      let res;
      if (editId) {
        res = await updateProduk(editId, dataPayload);
      } else {
        res = await tambahProduk(dataPayload);
      }
      
      if (res && res.sukses) {
        tampilkanToast(res.pesan, 'success');
        setTimeout(() => {
          router.push('/produk');
        }, 1200);
      } else {
        tampilkanToast(res?.pesan || 'Gagal menyimpan produk', 'warning');
      }
    } catch (err) {
      tampilkanToast('Koneksi terganggu atau terjadi kesalahan.', 'warning');
      console.error(err);
    }
  }

  // Harga Bertingkat Actions
  const tambahBarisHarga = (tingkat: TingkatHarga) => {
    setRowsHargaTingkat((prev) => [...prev, { tingkat, min_qty: 6, harga: parseFloat(hargaJual) - 200 || 0 }]);
  };

  const hapusBarisHarga = (index: number) => {
    setRowsHargaTingkat((prev) => prev.filter((_, i) => i !== index));
  };

  const ubahBarisHarga = (index: number, key: keyof RowHargaTingkat, val: any) => {
    setRowsHargaTingkat((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: val } : row))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/produk" className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon size={14} /> Produk
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            {editId ? 'Edit Produk' : 'Tambah Produk'}
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
          {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Lengkapi formulir di bawah untuk menyimpan informasi produk
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        {/* Kolom Kiri & Tengah: Form Utama */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Informasi Umum
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Kode Produk */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Kode Produk (PLU) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Barcode EAN / UPC
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Scan atau ketik barcode..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setTampilDialogScan(true); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer flex items-center" style={{ color: 'var(--text-tertiary)' }}
                    title="Scan Barcode"
                  >
                    <CameraIcon size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Nama Produk */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Indomie Goreng Spesial"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Kategori
                </label>
                <select
                  value={kategoriId}
                  onChange={(e) => setKategoriId(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {kategoriList.map((kat) => (
                    <option key={kat.id} value={kat.id}>
                      {kat.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier / Pemasok */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Pemasok / Supplier
                </label>
                <select
                  value={supplierId || ''}
                  onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Pilih Pemasok (Opsional)</option>
                  {pemasokList.map((pem) => (
                    <option key={pem.id} value={pem.id}>
                      {pem.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Satuan */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Satuan Produk
                </label>
                <select
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {OPSI_SATUAN.map((sat) => (
                    <option key={sat.nilai} value={sat.nilai}>
                      {sat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Deskripsi
              </label>
              <textarea
                rows={2}
                placeholder="Catatan tambahan detail produk..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Foto Produk */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Foto Produk (File / Ambil Gambar)
              </label>
              
              <div className="flex flex-col gap-4">
                {/* Previews */}
                <div className="flex flex-wrap gap-2 w-full">
                  {fotoUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl border flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-800" style={{ borderColor: 'var(--border)' }}>
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFotoUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 shadow"
                        title="Hapus Foto"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {fotoUrls.length === 0 && (
                    <div className="w-20 h-20 rounded-xl border flex items-center justify-center bg-zinc-50 dark:bg-zinc-800" style={{ borderColor: 'var(--border)' }}>
                      <CameraIcon size={24} className="opacity-30 text-zinc-400" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="input-file-foto"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setFotoUrls((prev) => [...prev, reader.result as string]);
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('input-file-foto')?.click()}
                      className="px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors border"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTampilDialogFotoProduct(true); aktifkanKamera(); }}
                      className="px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 text-white bg-teal-600 hover:bg-teal-700 active:scale-95"
                    >
                      Ambil Foto
                    </button>
                  </div>
                  
                  {fotoUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFotoUrls([])}
                      className="text-[9px] font-extrabold uppercase tracking-wider text-red-500 hover:underline"
                    >
                      Hapus Semua Foto ({fotoUrls.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Harga Bertingkat */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Harga Bertingkat (Grosir/Partai)
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => tambahBarisHarga('grosir')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <PlusIcon size={10} /> Grosir
                </button>
                <button
                  type="button"
                  onClick={() => tambahBarisHarga('partai')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <PlusIcon size={10} /> Partai
                </button>
              </div>
            </div>

            {rowsHargaTingkat.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                Belum ada harga bertingkat. Produk ini hanya memiliki satu harga eceran.
              </p>
            ) : (
              <div className="space-y-3">
                {rowsHargaTingkat.map((row, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-[2]">
                      <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        Level
                      </label>
                      <select
                        value={row.tingkat}
                        onChange={(e) => ubahBarisHarga(idx, 'tingkat', e.target.value as TingkatHarga)}
                        className="w-full px-2 py-1.5 rounded-lg text-xs capitalize"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        <option value="grosir">Grosir</option>
                        <option value="partai">Partai</option>
                      </select>
                    </div>

                    <div className="flex-[2]">
                      <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        Min. Qty ({satuan})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={row.min_qty}
                        onChange={(e) => ubahBarisHarga(idx, 'min_qty', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>

                    <div className="flex-[3]">
                      <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        Harga Jual (Rp)
                      </label>
                      <input
                        type="number"
                        value={row.harga}
                        onChange={(e) => ubahBarisHarga(idx, 'harga', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => hapusBarisHarga(idx)}
                      className="px-2 py-1.5 rounded-lg text-xs hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      style={{ color: 'var(--danger)', border: '1px solid var(--border)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Harga & Stok */}
        <div className="space-y-6">
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Keuangan & Stok
            </h2>

            {/* Harga Beli */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Harga Beli <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>Rp</span>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={hargaBeli}
                  onChange={(e) => setHargaBeli(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Harga Jual */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Harga Jual (Ecer) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>Rp</span>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={hargaJual}
                  onChange={(e) => setHargaJual(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--primary)' }}
                />
              </div>
            </div>

            {/* Stok Awal & Stok Min */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Stok Awal
                </label>
                <input
                  type="number"
                  disabled={editId !== null} // Stok awal dikunci saat edit (gunakan menu restock/opname)
                  value={stok}
                  onChange={(e) => setStok(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm disabled:opacity-60"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Stok Min
                </label>
                <input
                  type="number"
                  value={stokMin}
                  onChange={(e) => setStokMin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Expired Date */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Tanggal Kadaluarsa
              </label>
              <input
                type="date"
                value={expiredDate}
                onChange={(e) => setExpiredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl p-5 md:p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Status & Akses
            </h2>

            {/* Toggle Aktif */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Produk Aktif</span>
              <input
                type="checkbox"
                checked={isAktif}
                onChange={(e) => setIsAktif(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--primary)]"
              />
            </div>

            {/* Toggle Ecer */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Eceran</span>
              <input
                type="checkbox"
                checked={isEcer}
                onChange={(e) => setIsEcer(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--primary)]"
              />
            </div>

            {/* Buttons Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/produk')}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-[2] py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
              >
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      </form>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up text-xs font-bold uppercase tracking-wider ${toastType === 'warning' ? 'bg-rose-600' : 'bg-teal-600'}`}>
          {toastType === 'warning' ? <CloseIcon size={16} strokeWidth={3} /> : <CheckIcon size={16} strokeWidth={3} />}
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
                  <ScanIcon size={18} style={{ color: 'var(--primary)' }} /> Pemindai Barcode Kamera
                </h2>
                <button
                  type="button"
                  onClick={tutupScannerBarcode}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              {/* Viewfinder Area */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <div id="barcode-viewfinder" className="w-full h-full object-cover" />

                {!kameraAktif && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-center p-6 text-zinc-500 z-10">
                    {errorKamera ? (
                      <div>
                        <CloseIcon size={32} className="mx-auto mb-2 text-rose-500 opacity-80" />
                        <p className="text-[10px] uppercase font-bold tracking-wider text-rose-500">Gagal Mengakses Kamera</p>
                        <p className="text-[9px] text-amber-500 mt-1.5 max-w-xs mx-auto">{errorKamera}</p>
                      </div>
                    ) : (
                      <div>
                        <CameraIcon size={32} className="mx-auto mb-2 opacity-40 animate-pulse" />
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
                    Atau Ketik Barcode Manual
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('barcode-input') as HTMLInputElement;
                      const code = input.value.trim();
                      if (code) {
                        playBeep();
                        setBarcode(code);
                        tampilkanToast(`Berhasil Set Barcode: ${code}`);
                        input.value = '';
                        matikanKamera();
                        setTampilDialogScan(false);
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
                      Set
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
                      <CameraIcon size={14} /> Pilih File Gambar Barcode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Ambil Foto Produk (Webcam Capture) */}
      {tampilDialogFotoProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50 animate-fade-in"
            onClick={() => { matikanKamera(); setTampilDialogFotoProduct(false); }}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CameraIcon size={18} style={{ color: 'var(--primary)' }} /> Ambil Foto Produk via Webcam
                </h2>
                <button
                  type="button"
                  onClick={() => { matikanKamera(); setTampilDialogFotoProduct(false); }}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              {/* Viewfinder */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {kameraAktif ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-zinc-500">
                    {errorKamera ? (
                      <>
                        <CloseIcon size={32} className="mx-auto mb-2 text-rose-500 opacity-80" />
                        <p className="text-[10px] uppercase font-bold tracking-wider text-rose-500">Gagal Mengakses Kamera</p>
                        <p className="text-[9px] text-amber-500 mt-1.5 max-w-xs mx-auto">{errorKamera}</p>
                      </>
                    ) : (
                      <>
                        <CameraIcon size={32} className="mx-auto mb-2 opacity-40 animate-pulse" />
                        <p className="text-[10px] uppercase font-bold tracking-wider">Menghubungkan Kamera...</p>
                      </>
                    )}
                  </div>
                )}

                {/* Target overlay */}
                <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="text-[9px] font-black uppercase text-white/40 tracking-widest">Pusatkan Barang</div>
                </div>
              </div>

              {/* Controls */}
              <div className="p-5 space-y-4 text-center">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Posisikan produk di depan webcam Anda lalu klik tombol "Ambil Foto" untuk menjepret gambar secara langsung.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={ambilSnapshotKamera}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700 active:scale-95 flex items-center gap-1.5 mx-auto"
                  >
                    <CameraIcon size={16} /> Ambil Foto Produk
                  </button>
                  <button
                    type="button"
                    onClick={ambilFotoSimulasi}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    Simulasi Foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
