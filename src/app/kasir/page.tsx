/**
 * kasir/page.tsx
 * Halaman utama kasir — search produk, grid kategori, daftar produk, keranjang, pembayaran.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/format_rupiah';
import { useData } from '@/hooks/useData';
import type { ItemKeranjang, MetodePembayaran, TransaksiDetail } from '@/types/transaksi';
import type { Produk, HargaTingkat } from '@/types/produk';
import * as Icons from '@/components/ui/Icons';
import { BarcodeScanner } from '@/lib/barcode_scanner';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Dapatkan harga berdasarkan qty (harga bertingkat) */
function getHarga(produk: Produk, qty: number, hargaTingkatList: HargaTingkat[]): number {
  const tingkatList = hargaTingkatList
    .filter((h) => h.produk_id === produk.id)
    .sort((a, b) => b.min_qty - a.min_qty);

  for (const tingkat of tingkatList) {
    if (qty >= tingkat.min_qty) {
      return tingkat.harga;
    }
  }
  return produk.harga_jual;
}

export default function HalamanKasir() {
  const router = useRouter();

  const {
    produkList,
    kategoriList,
    pelangganList,
    hargaTingkatList,
    tambahTransaksi,
    shiftAktif,
  } = useData();

  const [pencarian, setPencarian] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState<number | null>(null);
  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);
  const [memberDipilih, setMemberDipilih] = useState<number | null>(null);
  const [tampilDialogBayar, setTampilDialogBayar] = useState(false);
  const [tampilDialogMember, setTampilDialogMember] = useState(false);
  const [tampilSukses, setTampilSukses] = useState(false);
  const [tabAktifMobile, setTabAktifMobile] = useState<'produk' | 'keranjang'>('produk');

  // Scanner & Camera Search State
  const [tampilDialogScan, setTampilDialogScan] = useState(false);
  const [tampilDialogFoto, setTampilDialogFoto] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const [sedangMenganalisisFoto, setSedangMenganalisisFoto] = useState(false);
  const [fotoHasilAnalisis, setFotoHasilAnalisis] = useState<string | null>(null);
  const [autoCloseScan, setAutoCloseScan] = useState(true);

  // Webcam stream handlers
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [errorKamera, setErrorKamera] = useState('');
  const [errorAnalisis, setErrorAnalisis] = useState('');
  const [scanRealtime, setScanRealtime] = useState(false);

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
          (p) => p.is_aktif && !p.deleted_at && p.barcode === decodedText
        );

        if (matched) {
          tambahKeKeranjang(matched);
          tampilkanToast(`Berhasil Scan: ${matched.nama}`);
        } else {
          tampilkanToast(`Barcode ${decodedText} tidak terdaftar di database.`, 'warning');
        }

        if (autoCloseScan) {
          tutupScannerBarcode();
        }
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
          const matched = produkList.find(
            (p) => p.is_aktif && !p.deleted_at && p.barcode === decodedText
          );
          if (matched) {
            tambahKeKeranjang(matched);
            tampilkanToast(`Berhasil Scan: ${matched.nama}`);
          } else {
            tampilkanToast(`Barcode ${decodedText} tidak terdaftar di database.`, 'warning');
          }
          if (autoCloseScan) {
            setTampilDialogScan(false);
          } else {
            // Jika tidak tutup otomatis, nyalakan kembali scanner kamera
            mulaiScannerCamera();
          }
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
      setErrorKamera('Kamera fisik tidak terdeteksi atau izin akses ditolak.');
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
  const tangkapFotoDanCari = async () => {
    if (!videoRef.current) return;
    setErrorKamera('');
    setErrorAnalisis('');
    setSedangMenganalisisFoto(true);
    if (!scanRealtime) {
      setFotoHasilAnalisis(null);
    }

    try {
      // 1. Capture frame ke canvas
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Gagal inisialisasi context canvas.');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Tampilkan preview foto yang sedang dianalisis
      const dataUrl = canvas.toDataURL('image/jpeg');
      if (!scanRealtime) {
        setFotoHasilAnalisis(dataUrl);
      }

      // 2. Load model & hitung embedding
      const { getImageEmbedding, findNearestProduct } = await import('@/lib/image_classifier');
      const queryEmb = await getImageEmbedding(canvas);

      // Filter produk aktif yang memiliki embedding
      const productsToMatch = produkList.filter(p => p.is_aktif && !p.deleted_at && p.foto_embedding);

      if (productsToMatch.length === 0) {
        throw new Error('Tidak ada produk terdaftar yang memiliki foto embedding.');
      }

      const matches = findNearestProduct(queryEmb, productsToMatch as any);

      if (matches && matches.length > 0) {
        const bestMatch = matches[0];
        if (bestMatch.similarity > 0.50) {
          const matchedProd = produkList.find(p => p.id === bestMatch.product.id);
          if (matchedProd) {
            playBeep();
            tambahKeKeranjang(matchedProd);
            tampilkanToast(`AI Menemukan: ${matchedProd.nama} (Cocok ${Math.round(bestMatch.similarity * 100)}%)`);
            matikanKamera();
            setTampilDialogFoto(false);
            setFotoHasilAnalisis(null);
          } else {
            throw new Error('Produk tidak ditemukan di database.');
          }
        } else {
          throw new Error(`Tingkat kemiripan rendah (${Math.round(bestMatch.similarity * 100)}%). Produk tidak terdaftar.`);
        }
      } else {
        throw new Error('Produk tidak dikenali.');
      }
    } catch (err: any) {
      const isValidationError = err.message && (
        err.message.includes('kemiripan') ||
        err.message.includes('dikenali') ||
        err.message.includes('ditemukan') ||
        err.message.includes('Tidak ada produk')
      );
      if (isValidationError) {
        console.warn('AI Vision:', err.message);
      } else {
        console.error('AI Vision Error:', err);
      }
      setErrorAnalisis(err.message || 'Gagal menganalisis gambar.');
      if (!scanRealtime) {
        setFotoHasilAnalisis(null);
      }
    } finally {
      setSedangMenganalisisFoto(false);
    }
  };

  // Loop deteksi otomatis (real-time)
  useEffect(() => {
    let timer: any;
    if (tampilDialogFoto && kameraAktif && scanRealtime && !sedangMenganalisisFoto) {
      timer = setTimeout(() => {
        tangkapFotoDanCari();
      }, 1500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [tampilDialogFoto, kameraAktif, scanRealtime, sedangMenganalisisFoto]);

  const handleFileUploadAnalisis = async (file: File) => {
    setErrorKamera('');
    setErrorAnalisis('');
    setSedangMenganalisisFoto(true);
    setFotoHasilAnalisis(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFotoHasilAnalisis(dataUrl);

      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        try {
          const { getImageEmbedding, findNearestProduct } = await import('@/lib/image_classifier');
          const queryEmb = await getImageEmbedding(img);

          const productsToMatch = produkList.filter(p => p.is_aktif && !p.deleted_at && p.foto_embedding);
          if (productsToMatch.length === 0) {
            throw new Error('Tidak ada produk terdaftar yang memiliki foto embedding.');
          }

          const matches = findNearestProduct(queryEmb, productsToMatch as any);
          if (matches && matches.length > 0) {
            const bestMatch = matches[0];
            if (bestMatch.similarity > 0.50) {
              const matchedProd = produkList.find(p => p.id === bestMatch.product.id);
              if (matchedProd) {
                playBeep();
                tambahKeKeranjang(matchedProd);
                tampilkanToast(`AI Menganalisis File: ${matchedProd.nama} (Cocok ${Math.round(bestMatch.similarity * 100)}%)`);
                matikanKamera();
                setTampilDialogFoto(false);
                setFotoHasilAnalisis(null);
              } else {
                throw new Error('Produk tidak ditemukan di database.');
              }
            } else {
              throw new Error(`Tingkat kemiripan rendah (${Math.round(bestMatch.similarity * 100)}%). Produk tidak terdaftar.`);
            }
          } else {
            throw new Error('Produk tidak dikenali.');
          }
        } catch (err: any) {
          const isValidationError = err.message && (
            err.message.includes('kemiripan') ||
            err.message.includes('dikenali') ||
            err.message.includes('ditemukan') ||
            err.message.includes('Tidak ada produk')
          );
          if (isValidationError) {
            console.warn('File Analysis:', err.message);
          } else {
            console.error('File Analysis Error:', err);
          }
          setErrorAnalisis(err.message || 'Gagal menganalisis file.');
          setFotoHasilAnalisis(null);
        } finally {
          setSedangMenganalisisFoto(false);
        }
      };
    };
    reader.readAsDataURL(file);
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

  // Payment state
  const [metodeBayar, setMetodeBayar] = useState<MetodePembayaran>('tunai');
  const [nominalBayar, setNominalBayar] = useState('');

  // Filter produk
  const produkFiltered = useMemo(() => {
    return produkList.filter((p) => {
      if (!p.is_aktif || p.deleted_at) return false;
      // Filter expired
      if (p.expired_date && new Date(p.expired_date) < new Date()) return false;
      // Filter pencarian
      if (pencarian && !p.nama.toLowerCase().includes(pencarian.toLowerCase()) && !p.kode.toLowerCase().includes(pencarian.toLowerCase())) return false;
      // Filter kategori
      if (kategoriAktif && p.kategori_id !== kategoriAktif) return false;
      return true;
    });
  }, [pencarian, kategoriAktif, produkList]);

  // Total keranjang
  const totalKeranjang = useMemo(() => {
    return keranjang.reduce((sum, item) => sum + Number(item.subtotal), 0);
  }, [keranjang]);

  const totalItem = useMemo(() => {
    return keranjang.reduce((sum, item) => sum + item.qty, 0);
  }, [keranjang]);

  // Kembalian
  const kembalian = useMemo(() => {
    const bayar = parseFloat(nominalBayar) || 0;
    return bayar - totalKeranjang;
  }, [nominalBayar, totalKeranjang]);

  // Member selected
  const member = memberDipilih ? pelangganList.find((m) => m.id === memberDipilih) : null;

  // Load enabled payment methods from localStorage
  const activeMethods = useMemo<MetodePembayaran[]>(() => {
    if (typeof window === 'undefined') return ['tunai', 'qris', 'transfer'];
    const saved = localStorage.getItem('tokiva_metode_pembayaran');
    let enabledObj = { tunai: true, qris: true, transfer: true, bon: true };
    if (saved) {
      try {
        enabledObj = JSON.parse(saved);
      } catch {}
    }
    const active = Object.keys(enabledObj).filter((k) => enabledObj[k as keyof typeof enabledObj] === true) as MetodePembayaran[];
    return active.filter((m) => m !== 'bon' || !!memberDipilih);
  }, [tampilDialogBayar, memberDipilih]);

  const openPaymentDialog = () => {
    let firstActive: MetodePembayaran = 'tunai';
    if (activeMethods.length > 0) {
      firstActive = activeMethods[0] as MetodePembayaran;
    }
    setMetodeBayar(firstActive);
    setTampilDialogBayar(true);
    setNominalBayar(totalKeranjang.toString());
  };

  // Tambah ke keranjang
  const tambahKeKeranjang = useCallback((produk: Produk) => {
    if (produk.stok <= 0) return;

    let sudahAda = false;
    setKeranjang((prev) => {
      const existing = prev.find((item) => item.produk_id === produk.id);
      if (existing) {
        sudahAda = true;
        return prev;
      }
      const harga = getHarga(produk, 1, hargaTingkatList);
      return [
        ...prev,
        {
          produk_id: produk.id,
          nama_produk: produk.nama,
          foto_url: produk.foto_url,
          qty: 1,
          satuan: produk.satuan,
          harga_satuan: Number(harga),
          diskon_item: 0,
          subtotal: Number(harga),
          diskon_id: null,
          batch_id: null,
          stok_tersedia: produk.stok,
        },
      ];
    });

    if (sudahAda) {
      tampilkanToast(`Produk "${produk.nama}" sudah ada di keranjang!`, 'warning');
    }
  }, [hargaTingkatList]);

  // Ubah qty
  const ubahQty = useCallback((produkId: number, newQty: number) => {
    if (newQty <= 0) {
      setKeranjang((prev) => prev.filter((item) => item.produk_id !== produkId));
      return;
    }
    const produk = produkList.find((p) => p.id === produkId);
    if (!produk || newQty > produk.stok) return;

    const harga = getHarga(produk, newQty, hargaTingkatList);
    setKeranjang((prev) =>
      prev.map((item) =>
        item.produk_id === produkId
          ? { ...item, qty: newQty, harga_satuan: Number(harga), subtotal: newQty * Number(harga) }
          : item
      )
    );
  }, [produkList, hargaTingkatList]);

  // Hapus item
  const hapusItem = useCallback((produkId: number) => {
    setKeranjang((prev) => prev.filter((item) => item.produk_id !== produkId));
  }, []);

  // Proses pembayaran
  function prosesBayar() {
    // Buat data transaksi
    const now = new Date().toISOString();
    const datePart = now.slice(0, 10);
    const timePart = now.slice(11, 16);
    const orderNo = `TX-${Date.now().toString().slice(-8)}`;

    const detailTx: TransaksiDetail[] = keranjang.map((item, idx) => ({
      id: idx + 1,
      transaksi_id: 0, // di-assign di provider
      produk_id: item.produk_id,
      nama_produk: item.nama_produk,
      qty: item.qty,
      satuan: item.satuan,
      harga_satuan: item.harga_satuan,
      diskon_item: item.diskon_item,
      subtotal: item.subtotal,
      diskon_id: item.diskon_id,
      batch_id: item.batch_id,
      created_at: now,
    }));

    tambahTransaksi({
      no_transaksi: orderNo,
      shift_id: 1,
      user_id: 1,
      member_id: memberDipilih,
      tanggal: datePart,
      waktu: timePart,
      subtotal: totalKeranjang,
      diskon_total: 0,
      diskon_member: 0,
      pajak: 0,
      total: totalKeranjang,
      bayar: parseFloat(nominalBayar) || totalKeranjang,
      kembalian: Math.max(0, kembalian),
      status: metodeBayar === 'bon' ? 'bon' : 'lunas',
      metode_pembayaran: metodeBayar,
      pembayaran: [
        {
          metode: metodeBayar,
          nominal: parseFloat(nominalBayar) || totalKeranjang,
          referensi: null,
        }
      ],
      is_synced: false,
      sync_at: null,
      local_id: null,
      catatan: null,
      detail: detailTx,
    });

    setTampilDialogBayar(false);
    setTampilSukses(true);
    setTimeout(() => {
      setTampilSukses(false);
      setKeranjang([]);
      setMemberDipilih(null);
      setNominalBayar('');
      setMetodeBayar('tunai');
    }, 2500);
  }

  return (
    <div className="animate-fade-in relative pb-20 lg:pb-0">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Kasir
        </h1>
        <div className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
          Shift: Budi • 07:00 WIB
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden w-full border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setTabAktifMobile('produk')}
          className="flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors"
          style={{
            borderColor: tabAktifMobile === 'produk' ? 'var(--primary)' : 'transparent',
            color: tabAktifMobile === 'produk' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          Pilih Produk
        </button>
        <button
          onClick={() => setTabAktifMobile('keranjang')}
          className="flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors relative"
          style={{
            borderColor: tabAktifMobile === 'keranjang' ? 'var(--primary)' : 'transparent',
            color: tabAktifMobile === 'keranjang' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          Keranjang
          {totalItem > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black text-white animate-pulse" style={{ background: 'var(--danger)' }}>
              {totalItem}
            </span>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Left: Product Search + Grid */}
        <div className={`lg:col-span-3 w-full max-w-full min-w-0 ${tabAktifMobile === 'produk' ? 'block' : 'hidden lg:block'}`}>
          <div
            className="rounded-xl overflow-hidden shadow-sm w-full max-w-full"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* Header Pilih Produk */}
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Icons.PackageIcon className="text-teal-600 dark:text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Pilih Produk
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
                  <Icons.SearchIcon size={16} className="opacity-50 sm:scale-110" />
                </span>
                <input
                  id="input-cari-produk"
                  type="text"
                  value={pencarian}
                  onChange={(e) => setPencarian(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-9 pr-20 py-2 sm:pl-11 sm:pr-24 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-200"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
                <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex gap-0.5 sm:gap-1">
                  <button
                    onClick={() => { setTampilDialogScan(true); }}
                    className="p-1.5 sm:p-2 rounded-lg hover:text-teal-500 transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Scan Barcode"
                  >
                    <Icons.ScanIcon size={16} className="sm:scale-110" />
                  </button>
                  <button
                    onClick={() => { setTampilDialogFoto(true); setErrorAnalisis(''); setErrorKamera(''); aktifkanKamera(); }}
                    className="p-1.5 sm:p-2 rounded-lg hover:text-teal-500 transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Ambil Foto"
                  >
                    <Icons.CameraIcon size={16} className="sm:scale-110" />
                  </button>
                </div>
              </div>

              {/* Kategori Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full max-w-full">
                <button
                  onClick={() => setKategoriAktif(null)}
                  className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 shrink-0"
                  style={{
                    background: kategoriAktif === null ? 'var(--primary)' : 'var(--bg)',
                    color: kategoriAktif === null ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${kategoriAktif === null ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  Semua
                </button>
                {kategoriList.map((kat) => (
                  <button
                    key={kat.id}
                    onClick={() => setKategoriAktif(kat.id === kategoriAktif ? null : kat.id)}
                    className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 shrink-0"
                    style={{
                      background: kategoriAktif === kat.id ? 'var(--primary)' : 'var(--bg)',
                      color: kategoriAktif === kat.id ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${kategoriAktif === kat.id ? 'var(--primary)' : 'var(--border)'}`,
                    }}
                  >
                    {kat.nama}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {produkFiltered.map((produk) => {
                  const habis = produk.stok <= 0;
                  const diKeranjang = keranjang.find((k) => k.produk_id === produk.id);
                  return (
                    <button
                      key={produk.id}
                      onClick={() => tambahKeKeranjang(produk)}
                      disabled={habis}
                      className="relative aspect-square rounded-xl p-2 sm:p-3 flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'var(--bg)',
                        border: `1px solid ${diKeranjang ? 'var(--primary)' : 'var(--border)'}`,
                        boxShadow: diKeranjang ? '0 4px 12px rgba(20,184,166,0.1)' : 'var(--shadow-sm)',
                      }}
                    >
                      {/* Top: Image/Initials */}
                      <div className="w-full flex-1 min-h-0 flex items-center justify-center mb-1.5">
                        {produk.foto_url ? (
                          <img
                            src={
                              (() => {
                                try {
                                  if (produk.foto_url.startsWith('[')) {
                                    const parsed = JSON.parse(produk.foto_url);
                                    return parsed[0] || '';
                                  }
                                } catch {}
                                return produk.foto_url;
                              })()
                            }
                            alt={produk.nama}
                            className="w-full h-full object-cover rounded-lg border border-transparent"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-lg flex items-center justify-center text-xs font-bold tracking-wider"
                            style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                          >
                            {getInitials(produk.nama)}
                          </div>
                        )}
                      </div>

                      {/* Bottom: Text Info */}
                      <div className="w-full shrink-0">
                        <p className="text-[10px] sm:text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                          {produk.nama}
                        </p>
                        <p className="text-[10px] sm:text-xs font-extrabold mt-0.5" style={{ color: 'var(--primary)' }}>
                          {formatRupiah(produk.harga_jual)}
                        </p>
                        <p className="text-[8px] sm:text-[10px] mt-0.5" style={{ color: habis ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                          Stok: {produk.stok} {produk.satuan}
                        </p>
                      </div>

                      {/* Badge di keranjang */}
                      {diKeranjang && (
                        <span
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-md animate-scale-check"
                          style={{ background: 'var(--primary)' }}
                        >
                          {diKeranjang.qty}
                        </span>
                      )}

                      {habis && (
                        <span
                          className="absolute top-2 right-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                        >
                          Habis
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {produkFiltered.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-2">
                    <Icons.SearchIcon size={48} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Produk tidak ditemukan
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className={`lg:col-span-2 ${tabAktifMobile === 'keranjang' ? 'block' : 'hidden lg:block'}`}>
          <div
            className="rounded-xl overflow-hidden sticky top-20 shadow-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Icons.CartIcon className="text-teal-600 dark:text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Keranjang ({totalItem} item)
                </h2>
              </div>
              {keranjang.length > 0 && (
                <button
                  onClick={() => setKeranjang([])}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  style={{ color: 'var(--danger)' }}
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="max-h-[400px] overflow-y-auto">
              {keranjang.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex justify-center text-zinc-300 dark:text-zinc-700 mb-3">
                    <Icons.CartIcon size={48} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Keranjang kosong
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Pilih produk untuk menambahkan transaksi
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {keranjang.map((item) => (
                    <div key={item.produk_id} className="px-4 py-3 flex gap-3 animate-fade-in">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.nama_produk}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--primary)' }}>
                          {formatRupiah(item.harga_satuan)} / {item.satuan}
                        </p>
                      </div>

                      {/* Qty Stepper */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => ubahQty(item.produk_id, item.qty - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-150 hover:bg-[var(--surface-hover)]"
                          style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        >
                          <Icons.MinusIcon size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {item.qty}
                        </span>
                        <button
                          onClick={() => ubahQty(item.produk_id, item.qty + 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-150 hover:opacity-90 active:scale-95 text-white"
                          style={{ background: 'var(--primary)' }}
                        >
                          <Icons.PlusIcon size={14} />
                        </button>
                      </div>

                      {/* Subtotal + Delete */}
                      <div className="text-right flex flex-col items-end justify-between">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatRupiah(item.subtotal)}
                        </p>
                        <button
                          onClick={() => hapusItem(item.produk_id)}
                          className="text-xs transition-colors hover:text-red-500"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <Icons.CloseIcon size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Selection */}
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setTampilDialogMember(!tampilDialogMember)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
                style={{
                  background: member ? 'rgba(20,184,166,0.1)' : 'var(--bg)',
                  color: member ? 'var(--primary)' : 'var(--text-secondary)',
                  border: `1px solid ${member ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                <Icons.UserIcon size={16} />
                <span className="flex-1 text-left">
                  {member ? `${member.nama} (${member.total_poin} POIN)` : 'PILIH MEMBER (OPSIONAL)'}
                </span>
                {member ? (
                  <span
                    onClick={(e) => { e.stopPropagation(); setMemberDipilih(null); }}
                    className="p-1 rounded hover:bg-teal-200/50"
                  >
                    <Icons.CloseIcon size={12} />
                  </span>
                ) : (
                  <Icons.ChevronRightIcon size={14} className="opacity-50" />
                )}
              </button>

              {/* Member dropdown list */}
              {tampilDialogMember && (
                <div className="mt-2 rounded-lg overflow-hidden animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  {pelangganList.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setMemberDipilih(m.id); setTampilDialogMember(false); }}
                      className="w-full text-left px-4 py-3 text-xs font-semibold flex items-center justify-between transition-colors border-b last:border-b-0"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span className="uppercase">{m.nama}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{m.nomor_hp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer — Total & Pay Button */}
            {keranjang.length > 0 && (
              <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Tagihan</span>
                  <span className="text-xl font-black" style={{ color: 'var(--primary)' }}>
                    {formatRupiah(totalKeranjang)}
                  </span>
                </div>
                <button
                  id="btn-bayar"
                  onClick={openPaymentDialog}
                  className="w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                  style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 14px rgba(13,148,136,0.4)' }}
                >
                  PROSES BAYAR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Floating Bottom Bar for Mobile */}
      {tabAktifMobile === 'produk' && totalItem > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 px-4 py-3.5 border-t bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 lg:hidden flex items-center justify-between shadow-lg">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Total Tagihan</span>
            <span className="text-base font-black text-teal-600 dark:text-teal-400">
              {formatRupiah(totalKeranjang)}
            </span>
          </div>
          <button
            onClick={() => setTabAktifMobile('keranjang')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white uppercase tracking-wider shadow-md"
            style={{ background: 'var(--primary-gradient)' }}
          >
            Tinjau Keranjang ({totalItem})
          </button>
        </div>
      )}

      {/* Dialog Pembayaran */}
      {tampilDialogBayar && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 animate-fade-in" onClick={() => setTampilDialogBayar(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Metode & Nominal</h2>
                <button onClick={() => setTampilDialogBayar(false)} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
                  <Icons.CloseIcon size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Total */}
                <div className="text-center py-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>TOTAL AKHIR</p>
                  <p className="text-2xl font-black mt-1" style={{ color: 'var(--primary)' }}>
                    {formatRupiah(totalKeranjang)}
                  </p>
                  {member && (
                    <p className="text-[10px] uppercase font-bold tracking-wider mt-1 text-teal-600 dark:text-teal-400">
                      MEMBER: {member.nama}
                    </p>
                  )}
                </div>

                {/* Metode */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Metode Pembayaran</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeMethods.map((metode) => (
                      <button
                        key={metode}
                        onClick={() => {
                          setMetodeBayar(metode);
                          if (metode !== 'tunai') {
                            setNominalBayar(totalKeranjang.toString());
                          }
                        }}
                        className="py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200"
                        style={{
                          background: metodeBayar === metode ? 'rgba(20,184,166,0.12)' : 'var(--bg)',
                          color: metodeBayar === metode ? 'var(--primary)' : 'var(--text-secondary)',
                          border: `1px solid ${metodeBayar === metode ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                      >
                        {metode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nominal Bayar */}
                {metodeBayar === 'tunai' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nominal Pembayaran</label>
                    <input
                      type="number"
                      value={nominalBayar}
                      onChange={(e) => setNominalBayar(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-lg font-black text-right"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                    {/* Quick amounts */}
                    <div className="flex gap-2 mt-2">
                      {[totalKeranjang, 50000, 100000, 200000].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
                        <button
                          key={v}
                          onClick={() => setNominalBayar(v.toString())}
                          className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                          style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        >
                          {formatRupiah(v)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kembalian */}
                {metodeBayar === 'tunai' && (
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: kembalian >= 0 ? 'var(--success-light)' : 'var(--danger-light)' }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: kembalian >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {kembalian >= 0 ? 'Kembalian' : 'Kekurangan'}
                    </span>
                    <span className="text-base font-black" style={{ color: kembalian >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatRupiah(Math.abs(kembalian))}
                    </span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setTampilDialogBayar(false)}
                    className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={prosesBayar}
                    disabled={metodeBayar === 'tunai' && kembalian < 0}
                    className="flex-[2] py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 14px rgba(13,148,136,0.4)' }}
                  >
                    SELESAI & CETAK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sukses Overlay */}
      {tampilSukses && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-scale-check">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto text-white shadow-xl animate-pulse" style={{ background: 'var(--success)' }}>
              <Icons.CheckIcon size={36} strokeWidth={3} />
            </div>
            <p className="text-lg font-black text-white uppercase tracking-wider mb-1">Transaksi Berhasil</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Total Pembayaran: {formatRupiah(totalKeranjang)}
            </p>
          </div>
        </div>
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
                  <Icons.ScanIcon size={18} className="text-teal-500" /> Pemindai Barcode Kamera
                </h2>
                <button
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

              {/* Control panel & Simulator */}
              <div className="p-5 space-y-4">
                {/* Auto close option */}
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Tutup otomatis setelah scan
                  </label>
                  <input
                    type="checkbox"
                    checked={autoCloseScan}
                    onChange={(e) => setAutoCloseScan(e.target.checked)}
                    className="accent-teal-600 cursor-pointer"
                  />
                </div>

                {/* Keyboard input backup */}
                <div>
                  <p className="text-[9px] text-zinc-400 text-center uppercase font-bold tracking-wider">
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
                            p.is_aktif &&
                            !p.deleted_at &&
                            (p.kode.toLowerCase() === code || (p.barcode && p.barcode.toLowerCase() === code))
                        );
                        if (produk) {
                          playBeep();
                          tambahKeKeranjang(produk);
                          tampilkanToast(`Berhasil Scan: ${produk.nama}`);
                          input.value = '';
                          if (autoCloseScan) {
                            matikanKamera();
                            setTampilDialogScan(false);
                          }
                        } else {
                          tampilkanToast('Barcode produk tidak terdaftar!', 'warning');
                        }
                      }
                    }}
                    className="flex gap-2 mt-2"
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

      {/* Modal Ambil Foto (Visual AI Search) */}
      {tampilDialogFoto && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50 animate-fade-in"
            onClick={() => { matikanKamera(); setTampilDialogFoto(false); setFotoHasilAnalisis(null); setErrorKamera(''); setErrorAnalisis(''); setScanRealtime(false); }}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Icons.CameraIcon size={18} className="text-teal-500" /> Pencarian Visual AI (Foto Barang)
                </h2>
                <button
                  onClick={() => { matikanKamera(); setTampilDialogFoto(false); setFotoHasilAnalisis(null); setErrorKamera(''); setErrorAnalisis(''); setScanRealtime(false); }}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <Icons.CloseIcon size={18} />
                </button>
              </div>

              {/* Viewfinder / Capture Preview */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {fotoHasilAnalisis && (
                  <img
                    src={fotoHasilAnalisis}
                    alt="Captured Item"
                    className="w-full h-full object-cover"
                  />
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${(fotoHasilAnalisis || !kameraAktif) ? 'hidden' : ''}`}
                />

                {!kameraAktif && !fotoHasilAnalisis && (
                  <div className="text-center p-6 text-zinc-500">
                    {errorKamera ? (
                      <>
                        <Icons.CloseIcon size={32} className="mx-auto mb-2 text-rose-500 opacity-80" />
                        <p className="text-[10px] uppercase font-bold tracking-wider text-rose-500">Gagal Mengakses Kamera</p>
                        <p className="text-[9px] text-rose-500 mt-1.5 max-w-xs mx-auto">{errorKamera}</p>
                      </>
                    ) : (
                      <>
                        <Icons.CameraIcon size={32} className="mx-auto mb-2 opacity-40 animate-pulse" />
                        <p className="text-[10px] uppercase font-bold tracking-wider">Menghubungkan Kamera...</p>
                      </>
                    )}
                  </div>
                )}

                {/* AI Scan box animation / real-time scanner indicator */}
                {(sedangMenganalisisFoto || scanRealtime) && (
                  <div className="absolute inset-0 bg-teal-500/5 pointer-events-none flex flex-col items-center justify-center">
                    {/* Laser line effect */}
                    <div className="absolute inset-x-0 h-0.5 bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-scan-laser z-10" />
                    
                    {/* Scanning box */}
                    <div className="w-48 h-48 border-2 border-dashed border-teal-500/50 rounded-xl relative flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400" />
                      
                      {sedangMenganalisisFoto && (
                        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    {scanRealtime && !sedangMenganalisisFoto && (
                      <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mt-3 bg-black/60 px-2.5 py-1 rounded-full animate-pulse">
                        Auto Scanning...
                      </p>
                    )}
                    {sedangMenganalisisFoto && (
                      <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mt-3 bg-black/60 px-2.5 py-1 rounded-full">
                        Menganalisis...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Capture Controls */}
              <div className="p-5 space-y-4 text-center">
                {!fotoHasilAnalisis ? (
                  <>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Arahkan kamera ke produk fisik Anda dan klik tombol di bawah untuk mendeteksi barang secara otomatis menggunakan AI Tokiva.
                    </p>
                    {(errorAnalisis || errorKamera) && (
                      <div className="text-[10px] text-rose-500 font-semibold p-2 bg-rose-500/10 rounded-lg animate-shake">
                        {errorAnalisis || errorKamera}
                      </div>
                    )}
                    
                    {/* Real-time Toggle */}
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Icons.ScanIcon size={14} className="text-teal-500" /> Deteksi Otomatis (Real-time)
                      </label>
                      <input
                        type="checkbox"
                        checked={scanRealtime}
                        onChange={(e) => {
                          setScanRealtime(e.target.checked);
                          setErrorAnalisis('');
                        }}
                        className="accent-teal-600 cursor-pointer w-4 h-4"
                      />
                    </div>

                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={tangkapFotoDanCari}
                        disabled={!kameraAktif || sedangMenganalisisFoto}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700 active:scale-95 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icons.CameraIcon size={16} /> Tangkap Foto & Cari
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-center text-xs font-bold text-teal-600 animate-pulse animate-bounce">
                    Memproses deteksi gambar...
                  </div>
                )}

                {/* Upload alternative */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">
                    Atau Unggah Foto File Barang
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUploadAnalisis(file);
                      }
                      e.target.value = ''; // Reset input to allow uploading the same file again
                    }}
                    className="text-xs mx-auto text-zinc-500 block file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:uppercase file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Shift belum dibuka modal overlay */}
      {!shiftAktif && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-all duration-300"
        >
          <div 
            className="w-full max-w-md p-8 rounded-2xl border text-center shadow-2xl animate-fade-in"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 animate-pulse">
              ⚠️
            </div>
            
            <h3 
              className="text-lg font-black tracking-tight mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              SHIFT KASIR BELUM DIBUKA!
            </h3>
            
            <p 
              className="text-xs mb-6 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Anda tidak dapat memproses transaksi penjualan sebelum membuka shift register. Silakan masukkan modal awal dan aktifkan shift kasir Anda terlebih dahulu.
            </p>
            
            <button
              onClick={() => router.push('/shift')}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700 active:scale-98 transition-all shadow-lg shadow-teal-600/10 hover:shadow-teal-600/20 cursor-pointer"
            >
              🔓 Buka Shift Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
