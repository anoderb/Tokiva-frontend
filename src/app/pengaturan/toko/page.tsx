/**
 * pengaturan/toko/page.tsx
 * Halaman Pengaturan Toko — nama toko, alamat, kontak, logo toko,
 * kode QRIS pembayaran, pemilih tema warna, dan isi kop/footer struk kasir thermal.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon, ReceiptIcon, ChevronLeftIcon, CameraIcon } from '@/components/ui/Icons';
import { useTheme, COLOR_PRESETS } from '@/hooks/useTheme';

export default function PengaturanToko() {
  const router = useRouter();
  const { warnaTema, setWarnaTema, setCustomColor, customColorHex } = useTheme();

  // Form State
  const [namaToko, setNamaToko] = useState('Tokiva Mart');
  const [alamat, setAlamat] = useState('Jl. Gajah Mada No. 12, Batang');
  const [nomorHp, setNomorHp] = useState('081234567890');
  const [kopStruk, setKopStruk] = useState('Selamat Datang di Tokiva Mart');
  const [footerStruk, setFooterStruk] = useState('Terima kasih telah berbelanja!');
  const [logoToko, setLogoToko] = useState<string | null>(null);
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [metodePembayaranSetting, setMetodePembayaranSetting] = useState({
    tunai: true,
    qris: true,
    transfer: true,
    bon: true
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage if exists
  useEffect(() => {
    const saved = localStorage.getItem('tokiva_pengaturan_toko');
    if (saved) {
      const data = JSON.parse(saved);
      setNamaToko(data.namaToko || 'Tokiva Mart');
      setAlamat(data.alamat || 'Jl. Gajah Mada No. 12, Batang');
      setNomorHp(data.nomorHp || '081234567890');
      setKopStruk(data.kopStruk || 'Selamat Datang di Tokiva Mart');
      setFooterStruk(data.footerStruk || 'Terima kasih telah berbelanja!');
      if (data.logoToko) setLogoToko(data.logoToko);
      if (data.qrisImage) setQrisImage(data.qrisImage);
    }

    const savedMethods = localStorage.getItem('tokiva_metode_pembayaran');
    if (savedMethods) {
      try {
        setMetodePembayaranSetting(JSON.parse(savedMethods));
      } catch {}
    }
  }, []);

  // Handle file upload → base64
  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setter(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Form submit handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    const payload = {
      namaToko,
      alamat,
      nomorHp,
      kopStruk,
      footerStruk,
      logoToko,
      qrisImage,
    };

    localStorage.setItem('tokiva_pengaturan_toko', JSON.stringify(payload));
    localStorage.setItem('tokiva_metode_pembayaran', JSON.stringify(metodePembayaranSetting));

    // Trigger sidebar refresh via storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tokiva_pengaturan_toko',
      newValue: JSON.stringify(payload),
    }));

    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
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
            Profil Toko
          </span>
        </div>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <HomeIcon size={24} style={{ color: 'var(--primary)' }} /> Profil Toko & Kop Struk
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Atur informasi utama bisnis Anda yang akan ditampilkan di web kasir dan struk kertas belanja thermal.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">
        {/* Kolom Kiri & Tengah: Form Settings */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 rounded-2xl p-5 md:p-6 space-y-4 w-full max-w-full min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          {/* ═══════════════ Identitas Toko ═══════════════ */}
          <h2 className="text-sm font-bold pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            Form Identitas Toko
          </h2>

          {/* Logo & Nama Toko Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Logo Upload */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl flex items-center justify-center cursor-pointer border-2 border-dashed overflow-hidden transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                title="Upload Logo Toko"
              >
                {logoToko ? (
                  <img src={logoToko} alt="Logo Toko" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <CameraIcon size={24} style={{ color: 'var(--text-tertiary)' }} className="mx-auto" />
                    <p className="text-[8px] mt-1 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Upload Logo</p>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setLogoToko)}
              />
              {logoToko && (
                <button
                  type="button"
                  onClick={() => setLogoToko(null)}
                  className="text-[9px] font-semibold transition-colors hover:opacity-80"
                  style={{ color: 'var(--danger)' }}
                >
                  Hapus Logo
                </button>
              )}
            </div>

            {/* Nama & HP */}
            <div className="flex-1 grid sm:grid-cols-2 gap-4 w-full">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nama Toko / Outlet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nomor Telepon / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomorHp}
                  onChange={(e) => setNomorHp(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Alamat Toko <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* ═══════════════ QRIS ═══════════════ */}
          <h2 className="text-sm font-bold pb-2 pt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            <ReceiptIcon size={16} style={{ color: 'var(--primary)' }} /> Kode QRIS Pembayaran
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div
              onClick={() => qrisInputRef.current?.click()}
              className="w-28 h-28 rounded-2xl flex items-center justify-center cursor-pointer border-2 border-dashed overflow-hidden transition-all hover:opacity-80 shrink-0"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              title="Upload Kode QRIS"
            >
              {qrisImage ? (
                <img src={qrisImage} alt="QRIS" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center px-2">
                  <CameraIcon size={24} style={{ color: 'var(--text-tertiary)' }} className="mx-auto" />
                  <p className="text-[8px] mt-1 font-semibold leading-tight" style={{ color: 'var(--text-tertiary)' }}>Upload QRIS</p>
                </div>
              )}
            </div>
            <input
              ref={qrisInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setQrisImage)}
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Upload gambar kode QRIS pembayaran toko Anda. Gambar ini akan ditampilkan saat pelanggan memilih metode pembayaran QRIS di kasir.
              </p>
              {qrisImage && (
                <button
                  type="button"
                  onClick={() => setQrisImage(null)}
                  className="text-[10px] font-semibold transition-colors hover:opacity-80"
                  style={{ color: 'var(--danger)' }}
                >
                  Hapus QRIS
                </button>
              )}
            </div>
          </div>

          {/* ═══════════════ Tema Warna ═══════════════ */}
          <h2 className="text-sm font-bold pb-2 pt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            🎨 Tema Warna Aplikasi
          </h2>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Pilih warna utama yang akan diterapkan ke seluruh tampilan aplikasi. Anda juga bisa memilih warna kustom.
          </p>
          <div className="flex flex-wrap gap-2.5 py-1">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setWarnaTema(preset.key)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: warnaTema === preset.key ? preset.primary : 'var(--border)',
                  background: warnaTema === preset.key ? `color-mix(in srgb, ${preset.primary} 8%, transparent)` : 'transparent',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.primaryLight})` }}
                />
                <span className="text-[9px] font-bold" style={{ color: warnaTema === preset.key ? preset.primary : 'var(--text-tertiary)' }}>
                  {preset.label}
                </span>
              </button>
            ))}

            {/* Custom Color */}
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200" style={{
              borderColor: warnaTema === 'custom' ? customColorHex : 'var(--border)',
              background: warnaTema === 'custom' ? `color-mix(in srgb, ${customColorHex} 8%, transparent)` : 'transparent',
            }}>
              <label className="cursor-pointer">
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 block"
                  style={{ background: 'transparent' }}
                />
              </label>
              <span className="text-[9px] font-bold" style={{ color: warnaTema === 'custom' ? customColorHex : 'var(--text-tertiary)' }}>
                Custom
              </span>
            </div>
          </div>

          {/* ═══════════════ Metode Pembayaran ═══════════════ */}
          <h2 className="text-sm font-bold pb-2 pt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            💳 Metode Pembayaran Kasir
          </h2>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Aktifkan atau nonaktifkan metode pembayaran yang tersedia di halaman kasir belanja.
          </p>
          <div className="grid grid-cols-2 gap-4 py-2">
            {(['tunai', 'qris', 'transfer', 'bon'] as const).map((method) => {
              const labelMap = {
                tunai: 'Tunai (Cash)',
                qris: 'QRIS',
                transfer: 'Transfer Bank',
                bon: 'Bon / Piutang'
              };
              return (
                <label
                  key={method}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: metodePembayaranSetting[method] ? 'var(--primary)' : 'var(--border)',
                    background: metodePembayaranSetting[method] ? 'rgba(20,184,166,0.06)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={metodePembayaranSetting[method]}
                    onChange={(e) => {
                      setMetodePembayaranSetting({
                        ...metodePembayaranSetting,
                        [method]: e.target.checked
                      });
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {labelMap[method]}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                      {method === 'bon' ? 'Khusus pelanggan terdaftar' : 'Metode pembayaran retail umum'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* ═══════════════ Struk ═══════════════ */}
          <h2 className="text-sm font-bold pb-2 pt-2 flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
            <ReceiptIcon size={16} style={{ color: 'var(--primary)' }} /> Teks Struk Thermal Belanja
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Header Text */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Header Kop Struk
              </label>
              <input
                type="text"
                value={kopStruk}
                onChange={(e) => setKopStruk(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Footer Text */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Footer / Teks Bawah Struk
              </label>
              <input
                type="text"
                value={footerStruk}
                onChange={(e) => setFooterStruk(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {success && (
            <div
              className="p-3 rounded-xl text-xs font-semibold text-center animate-scale-check"
              style={{ background: 'var(--success-light)', color: 'var(--success)' }}
            >
              Pengaturan Toko Berhasil Disimpan!
            </div>
          )}

          {/* Buttons Submit */}
          <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => router.push('/pengaturan')}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
            >
              {isLoading ? 'Saving...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>

        {/* Kolom Kanan: Preview Struk */}
        <div
          className="rounded-2xl p-5 md:p-6 space-y-4 shadow-sm h-fit text-xs w-full max-w-full min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider pb-2 border-b" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
            Preview Struk Kertas
          </h3>
          
          <div className="p-4 rounded-xl space-y-4 shadow-inner" style={{ background: 'var(--bg)' }}>
            {/* Toko Kop */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed" style={{ borderColor: 'var(--border)' }}>
              {logoToko && (
                <img src={logoToko} alt="Logo" className="w-10 h-10 mx-auto mb-1 rounded-lg object-cover" />
              )}
              <p className="font-extrabold text-sm uppercase" style={{ color: 'var(--text-primary)' }}>{namaToko}</p>
              <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{alamat}</p>
              <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Telp: {nomorHp}</p>
            </div>

            {/* Mock Items list */}
            <div className="space-y-1.5 py-1 border-b border-dashed" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[9px] italic text-center" style={{ color: 'var(--text-tertiary)' }}>-- {kopStruk} --</p>
              <div className="flex justify-between mt-1.5">
                <span>Indomie Goreng x 2</span>
                <span className="font-semibold">Rp 7.000</span>
              </div>
              <div className="flex justify-between">
                <span>Beras Rojolele 5kg x 1</span>
                <span className="font-semibold">Rp 68.000</span>
              </div>
            </div>

            {/* Total */}
            <div className="space-y-1 font-bold">
              <div className="flex justify-between">
                <span>Total Belanja:</span>
                <span>Rp 75.000</span>
              </div>
            </div>

            {/* Receipt Footer Message */}
            <div className="text-center pt-2" style={{ color: 'var(--text-tertiary)' }}>
              <p className="text-[9px] italic">{footerStruk}</p>
            </div>
          </div>

          {/* QRIS Preview */}
          {qrisImage && (
            <div className="pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Kode QRIS Toko
              </h4>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                <img src={qrisImage} alt="QRIS" className="w-full object-contain max-h-48" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
