/**
 * stok/masuk/page.tsx
 * Halaman barang masuk / restock.
 * Mendukung input manual, scan foto/kamera, dan mock OCR Nota Supplier (fitur inovasi) dengan simulasi loading.
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/hooks/useData';
import { formatRupiah } from '@/lib/format_rupiah';
import * as Icons from '@/components/ui/Icons';
import { BarcodeScanner } from '@/lib/barcode_scanner';

export default function BarangMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('produk_id') ? parseInt(searchParams.get('produk_id')!) : null;

  const { produkList, pemasokList, tambahStokMasuk } = useData();

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
        
        const matched = produkList.find(
          (p) => !p.deleted_at && p.barcode === decodedText
        );
        
        if (matched) {
          handleProdukChange(matched.id);
          tampilkanToast(`Berhasil Scan: ${matched.nama}`);
        } else {
          tampilkanToast(`Barcode ${decodedText} tidak cocok dengan produk manapun.`, 'warning');
        }

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
          const matched = produkList.find(
            (p) => !p.deleted_at && p.barcode === decodedText
          );
          if (matched) {
            handleProdukChange(matched.id);
            tampilkanToast(`Berhasil Scan: ${matched.nama}`);
          } else {
            tampilkanToast(`Barcode ${decodedText} tidak cocok dengan produk manapun.`, 'warning');
          }
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
        throw new Error('Tidak ada produk terdaftar yang memiliki foto embedding.');
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

  // Form State
  const [produkId, setProdukId] = useState<number | ''>('');
  const [cariKata, setCariKata] = useState('');
  const [tampilSaran, setTampilSaran] = useState(false);
  const [qty, setQty] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [expiredDate, setExpiredDate] = useState('');
  const [catatan, setCatatan] = useState('');

  // OCR state
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [fotoNota, setFotoNota] = useState<string | null>(null);
  
  // Real OCR additional states
  const [ocrProgress, setOcrProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);

  // Filter out deleted products
  const produkTersedia = useMemo(() => {
    return produkList.filter((p) => !p.deleted_at);
  }, [produkList]);

  // Filter products based on search keywords
  const saranProduk = useMemo(() => {
    if (!cariKata) return produkTersedia;
    return produkTersedia.filter((p) =>
      p.nama.toLowerCase().includes(cariKata.toLowerCase()) ||
      p.kode.toLowerCase().includes(cariKata.toLowerCase()) ||
      (p.barcode && p.barcode.includes(cariKata))
    );
  }, [produkTersedia, cariKata]);

  // Set initial product if pre-selected
  useEffect(() => {
    if (preSelectedId) {
      setProdukId(preSelectedId);
      const prod = produkList.find((p) => p.id === preSelectedId);
      if (prod) {
        setCariKata(prod.nama);
        setHargaBeli(prod.harga_beli.toString());
        setExpiredDate(prod.expired_date || '');
        if (prod.supplier_id) {
          setSupplierId(prod.supplier_id);
        }
      }
    }
  }, [preSelectedId, produkList]);

  // Handle product selection change
  function handleProdukChange(id: number) {
    setProdukId(id);
    const prod = produkList.find((p) => p.id === id);
    if (prod) {
      setCariKata(prod.nama);
      setHargaBeli(prod.harga_beli.toString());
      setExpiredDate(prod.expired_date || '');
      if (prod.supplier_id) {
        setSupplierId(prod.supplier_id);
      }
    }
  }

  // Handle submit form
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!produkId || !qty || !hargaBeli) return;

    tambahStokMasuk(
      produkId,
      parseInt(qty),
      parseFloat(hargaBeli),
      supplierId ? supplierId : null,
      expiredDate || null,
      catatan || null
    );

    router.push('/stok');
  }

  // Real OCR processing
  async function handleRealOcr(file: File) {
    setIsOcrLoading(true);
    setOcrSuccess(false);
    setOcrProgress(0);
    setParsedItems([]);
    setRawText('');

    try {
      const { ocrNota, parseNotaText } = await import('@/lib/ocr_nota');
      const text = await ocrNota(file, (progress) => {
        setOcrProgress(progress);
      });

      setRawText(text);
      const items = parseNotaText(text);

      // Match products in database by name similarity
      const matchedItems = items.map((item) => {
        const matchedProduk = produkList.find((p) => {
          const nameClean = item.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
          const pName = p.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameClean.includes(pName) || pName.includes(nameClean);
        });

        return {
          ...item,
          produk_id: matchedProduk ? matchedProduk.id : null,
          match_nama: matchedProduk ? matchedProduk.nama : null,
        };
      });

      setParsedItems(matchedItems);
      setOcrSuccess(true);
      playBeep();
      tampilkanToast(`OCR Berhasil: Terdeteksi ${items.length} item.`);

      // Pre-fill first item if match exists
      if (matchedItems.length > 0) {
        const first = matchedItems[0];
        if (first.produk_id) {
          handleProdukChange(first.produk_id);
        } else {
          setProdukId('');
          setCariKata(first.nama);
        }
        setQty(first.qty.toString());
        setHargaBeli(first.harga.toString());
        setCatatan(`OCR SCAN: Terbaca "${first.nama}"`);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      tampilkanToast('Gagal memproses OCR Nota.');
    } finally {
      setIsOcrLoading(false);
    }
  }



  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link href="/stok" className="text-xs font-bold uppercase tracking-wider hover:opacity-85 transition-opacity" style={{ color: 'var(--text-tertiary)' }}>
            Stok
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>&bull;</span>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
            Barang Masuk
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
          Input Barang Masuk (Restock)
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Tambahkan persediaan produk baru baik secara manual maupun otomatis dengan memindai nota belanja.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">
        {/* Kolom Kiri: Form Input */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 rounded-2xl p-5 md:p-6 space-y-4 w-full max-w-full min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            Form Restock Produk
          </h2>

          {/* Pilih Produk dengan Pencarian Barcode & Gambar */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Pilih & Cari Produk <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setTampilDialogScan(true); }}
                  title="Scan Barcode Produk"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--surface)' }}
                >
                  <Icons.ScanIcon size={12} /> Scan Barcode
                </button>
                <button
                  type="button"
                  onClick={() => { setTampilDialogCariGambar(true); }}
                  title="Cari via Kamera/Gambar"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--surface)' }}
                >
                  <Icons.CameraIcon size={12} /> Cari Gambar
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama, kode PLU, atau barcode produk..."
                value={cariKata}
                onChange={(e) => {
                  setCariKata(e.target.value);
                  setTampilSaran(true);
                  if (!e.target.value) {
                    setProdukId('');
                  }
                }}
                onFocus={() => setTampilSaran(true)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm pr-20"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />

              {produkId && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-[9px] uppercase px-2 py-0.5 rounded border pointer-events-none select-none" style={{ color: 'var(--primary)', background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  Terpilih
                </span>
              )}

              {/* Floating Suggestion List */}
              {tampilSaran && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTampilSaran(false)} />
                  <div
                    className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl shadow-lg border z-20"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    {saranProduk.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          handleProdukChange(p.id);
                          setTampilSaran(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--surface-hover)] transition-colors border-b last:border-b-0 flex justify-between items-center"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      >
                        <div>
                          <p className="font-bold">{p.nama}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Kode: {p.kode} {p.barcode ? `• Barcode: ${p.barcode}` : ''}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-400">
                          Stok: {p.stok} {p.satuan}
                        </span>
                      </button>
                    ))}
                    {saranProduk.length === 0 && (
                      <div className="p-4 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Produk tidak ditemukan
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Jumlah Masuk */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Jumlah Barang Masuk <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Harga Beli */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Harga Beli Baru per Satuan (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="0"
                value={hargaBeli}
                onChange={(e) => setHargaBeli(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Pemasok / Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value) : '')}
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

            {/* Expired Date */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Tanggal Kadaluarsa Baru
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

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Catatan / Keterangan
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Nomor Invoice, Kondisi Barang, Diskon supplier..."
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
              className="flex-[2] py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
            >
              Simpan Barang Masuk
            </button>
          </div>
        </form>

        {/* Kolom Kanan: OCR / Scanner Mock */}
        <div className="space-y-6 w-full max-w-full min-w-0">
          {/* Inovasi OCR Nota */}
          <div
            className="rounded-2xl p-5 md:p-6 space-y-4 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              onClick={() => document.getElementById('input-file-nota')?.click()}
              className="flex justify-center mb-1 mx-auto w-24 h-24 rounded-2xl cursor-pointer transition-colors items-center overflow-hidden border border-dashed"
              style={{ color: 'var(--primary)', background: 'var(--bg)', borderColor: 'var(--primary)' }}
              title="Unggah Nota Belanja"
            >
              {fotoNota ? (
                <img src={fotoNota} alt="Nota" className="w-full h-full object-cover" />
              ) : (
                <Icons.CameraIcon size={32} />
              )}
            </div>
            <input
              type="file"
              id="input-file-nota"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setFotoNota(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                  handleRealOcr(file);
                }
              }}
            />
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Fitur Cerdas: OCR Nota Belanja
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Scan foto nota belanja dari supplier Anda. AI kami akan mengekstrak nama produk, kuantitas, dan harga beli secara otomatis!
            </p>

            {/* OCR Processing Indicator */}
            {isOcrLoading && (
              <div className="py-4 space-y-2 animate-pulse">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[10px] font-semibold" style={{ color: 'var(--primary)' }}>
                  Menganalisis Nota Supplier ({Math.round(ocrProgress * 100)}%)...
                </p>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 max-w-[200px] mx-auto overflow-hidden">
                  <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${ocrProgress * 100}%` }} />
                </div>
              </div>
            )}

            {ocrSuccess && (
              <div className="space-y-4 text-left animate-fade-in">
                <div
                  className="py-2.5 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center mb-2 animate-scale-check"
                  style={{ background: 'var(--success-light)', color: 'var(--success)' }}
                >
                  Nota Berhasil Diekstrak!
                </div>
                
                <div 
                  className="p-5 rounded-2xl border space-y-4 backdrop-blur-sm"
                  style={{ 
                    borderColor: 'rgba(20, 184, 166, 0.3)', 
                    background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                    <Icons.CheckIcon size={14} /> Hasil Deteksi Item Nota
                  </h4>
                  
                  {parsedItems.length === 0 ? (
                    <p className="text-xs text-zinc-500">Tidak ada item terdeteksi. Silakan input manual.</p>
                  ) : (
                    <div className="space-y-2">
                      {parsedItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-3 rounded-xl border text-left bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                          style={{ borderColor: item.produk_id ? 'rgba(20, 184, 166, 0.3)' : 'var(--border)' }}
                          onClick={() => {
                            if (item.produk_id) {
                              handleProdukChange(item.produk_id);
                            } else {
                              setProdukId('');
                              setCariKata(item.nama);
                            }
                            setQty(item.qty.toString());
                            setHargaBeli(item.harga.toString());
                            setCatatan(`OCR SCAN: Terbaca "${item.nama}"`);
                            tampilkanToast(`Memuat item: ${item.nama}`);
                          }}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                              {item.nama}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{
                              background: item.produk_id ? 'var(--success-light)' : 'var(--danger-light)',
                              color: item.produk_id ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {item.produk_id ? 'Match' : 'Belum Match'}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <span>Qty: {item.qty}x</span>
                            <span>Harga: {formatRupiah(item.harga)}</span>
                          </div>
                          {item.match_nama && (
                            <p className="text-[9px] text-zinc-400 mt-1 italic">
                              Terhubung ke: {item.match_nama}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw OCR Text Toggle */}
                  <div className="pt-2">
                    <details className="cursor-pointer">
                      <summary className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-500">
                        Lihat Teks Mentah OCR
                      </summary>
                      <pre className="mt-2 p-2 rounded-lg bg-black text-green-400 text-[10px] overflow-auto max-h-40 text-left font-mono whitespace-pre-wrap leading-tight">
                        {rawText}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* Quick info status */}
          {produkId && (
            <div
              className="rounded-2xl p-5 md:p-6 space-y-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Info Stok Saat Ini
              </h3>
              {(() => {
                const p = produkList.find((x) => x.id === produkId);
                if (!p) return null;
                return (
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Produk:</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Stok Sekarang:</span>
                      <span className="font-bold" style={{ color: 'var(--primary)' }}>{p.stok} {p.satuan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Harga Beli Saat Ini:</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatRupiah(p.harga_beli)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

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
                          handleProdukChange(produk.id);
                          tampilkanToast(`Berhasil Scan: ${produk.nama}`);
                          input.value = '';
                          matikanKamera();
                          setTampilDialogScan(false);
                        } else {
                          tampilkanToast('Barcode produk tidak terdaftar!', 'warning');
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
                      handleProdukChange(hasilDeteksiGambar.id);
                      setHasilDeteksiGambar(null);
                      setTampilDialogCariGambar(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700"
                  >
                    Pilih Produk & Terapkan
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
