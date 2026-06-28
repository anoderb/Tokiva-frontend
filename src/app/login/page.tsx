/**
 * login/page.tsx
 * Halaman login Tokiva.
 * Menampilkan form login dengan username + password.
 * Redirect ke /dashboard setelah login berhasil.
 */

'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import * as Icons from '@/components/ui/Icons';

export default function HalamanLogin() {
  const router = useRouter();
  const { login, pengguna, sedangMemuat } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tampilPassword, setTampilPassword] = useState(false);
  const [sedangLogin, setSedangLogin] = useState(false);
  const [pesanError, setPesanError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');

  // Redirect jika sudah login
  useEffect(() => {
    if (!sedangMemuat && pengguna) {
      router.replace('/dashboard');
    }
  }, [sedangMemuat, pengguna, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPesanError('');
    setPesanSukses('');

    // Validasi client-side
    if (username.length < 3) {
      setPesanError('Username minimal 3 karakter');
      return;
    }
    if (password.length < 6) {
      setPesanError('Password minimal 6 karakter');
      return;
    }

    setSedangLogin(true);

    try {
      const hasil = await login({ username, password });

      if (hasil.sukses) {
        setPesanSukses('Login Berhasil! Selamat datang, ' + (hasil.data?.pengguna?.nama || username) + '.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        setPesanError(hasil.pesan || 'Username atau password salah.');
      }
    } catch {
      setPesanError('Koneksi ke backend gagal atau terjadi kesalahan.');
    } finally {
      setSedangLogin(false);
    }
  }

  if (sedangMemuat || pengguna) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <main
      className="min-h-dvh flex items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg)' }}
    >
      {/* Gradient orbs background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--primary)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--accent)' }}
        />
      </div>

      <div
        className="relative w-full max-w-sm animate-slide-up"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <Icons.CartIcon size={32} />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Tokiva</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Masuk ke akun Anda
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Toast */}
            {pesanError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm animate-slide-up"
                style={{
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: 'var(--danger)', color: 'white' }}>Gagal</span>
                <span>{pesanError}</span>
              </div>
            )}

            {/* Success Toast */}
            {pesanSukses && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm animate-slide-up"
                style={{
                  background: 'rgba(20, 184, 166, 0.1)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                }}
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: 'var(--primary)', color: 'white' }}>Sukses</span>
                <span>{pesanSukses}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label
                htmlFor="input-username"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Username
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <Icons.UserIcon size={18} className="opacity-60" />
                </span>
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="input-password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <Icons.LockIcon size={18} className="opacity-60" />
                </span>
                <input
                  id="input-password"
                  type={tampilPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-20 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setTampilPassword(!tampilPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:text-teal-500"
                  style={{ color: 'var(--text-tertiary)' }}
                  tabIndex={-1}
                  aria-label={tampilPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {tampilPassword ? 'SEMBUNYI' : 'TAMPIL'}
                </button>
              </div>
            </div>

            {/* Tombol Login */}
            <button
              id="btn-login"
              type="submit"
              disabled={sedangLogin}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] mt-2"
              style={{
                background: sedangLogin ? 'var(--primary-dark)' : 'var(--primary-gradient)',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
              }}
            >
              {sedangLogin ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Lupa password?{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Hubungi admin</span>
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
          Tokiva v1.0.0
        </p>
      </div>
    </main>
  );
}
