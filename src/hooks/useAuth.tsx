/**
 * useAuth.tsx
 * Hook autentikasi untuk login, logout, dan cek session.
 * Menggunakan React Context + localStorage untuk mock JWT.
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Pengguna, LoginRequest, LoginResponse } from '@/types/pengguna';
import { dataPengguna, PASSWORD_MOCK } from '@/lib/data/pengguna';

interface AuthContextType {
  pengguna: Pengguna | null;
  sedangMemuat: boolean;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  logout: () => void | Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'tokiva_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pengguna, setPengguna] = useState<Pengguna | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(true);

  // Cek session saat pertama kali load
  useEffect(() => {
    try {
      const tersimpan = localStorage.getItem(STORAGE_KEY);
      if (tersimpan) {
        const data = JSON.parse(tersimpan);
        if (data?.pengguna) {
          setPengguna(data.pengguna);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setSedangMemuat(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const resData = await response.json();
      
      if (!response.ok || !resData.sukses) {
        return {
          sukses: false,
          data: null,
          pesan: resData.pesan || 'Username atau password salah',
        };
      }

      // Construct standard Pengguna object from flat fields returned by backend
      const userObj = {
        id: resData.data.id || (resData.data.role === 'admin' ? 1 : 2),
        nama: resData.data.nama || (resData.data.role === 'admin' ? 'Administrator Tokiva' : 'Kasir Tokiva'),
        username: data.username,
        role: resData.data.role,
        nomor_hp: resData.data.nomor_hp || null,
        foto_url: resData.data.foto_url || null,
        aktif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const sessionData = {
        access_token: resData.data.access_token,
        refresh_token: resData.data.refresh_token,
        pengguna: userObj,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      setPengguna(userObj);

      return {
        sukses: true,
        data: sessionData,
        pesan: resData.pesan || 'Login berhasil',
      };
    } catch (e: any) {
      return {
        sukses: false,
        data: null,
        pesan: 'Gagal menghubungkan ke server backend: ' + (e.message || String(e)),
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const authDataStr = localStorage.getItem(STORAGE_KEY);
      if (authDataStr) {
        const authData = JSON.parse(authDataStr);
        const token = authData.access_token || '';
        if (token) {
          // 1. Cek apakah ada shift aktif untuk kasir ini
          const shiftResp = await fetch(`${baseUrl}/api/shift/aktif`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (shiftResp.ok) {
            const shiftJson = await shiftResp.json();
            if (shiftJson.sukses && shiftJson.data) {
              // 2. Jika ada shift aktif, tutup otomatis dengan kas fisik 0 (penutupan paksa)
              await fetch(`${baseUrl}/api/shift/tutup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  modal_akhir_fisik: 0,
                  catatan: 'Tutup shift otomatis (Sesi Keluar/Logout)'
                })
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Gagal menutup shift otomatis saat logout:', e);
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('tokiva_shift_aktif');
      setPengguna(null);
    }
  }, []);

  const isAdmin = pengguna?.role === 'admin';

  return (
    <AuthContext.Provider value={{ pengguna, sedangMemuat, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return context;
}
