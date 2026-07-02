/**
 * useChatbot.tsx
 * React hook untuk state management chatbot.
 * Mengelola conversation, API calls, dan confirmation flow.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface PesanChat {
  id: string;
  role: 'user' | 'assistant';
  konten: string;
  waktu: string;
  konfirmasi?: {
    aksiId: string;
    preview: string;
    toolName: string;
    status: 'pending' | 'confirmed' | 'cancelled';
  };
}

interface ChatbotHookReturn {
  pesanList: PesanChat[];
  sedangMemuat: boolean;
  isOpen: boolean;
  kirimPesan: (teks: string) => Promise<void>;
  konfirmasiAksi: (aksiId: string) => Promise<void>;
  batalAksi: (aksiId: string) => void;
  bersihkanRiwayat: () => void;
  toggleOpen: () => void;
  setIsOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'tokiva_chatbot_riwayat';
const MAX_STORED_MESSAGES = 50;

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function getTimestamp(): string {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function useChatbot(): ChatbotHookReturn {
  const [pesanList, setPesanList] = useState<PesanChat[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const initializedRef = useRef(false);

  // Load riwayat dari localStorage saat mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PesanChat[];
        setPesanList(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Simpan ke localStorage setiap kali pesanList berubah
  useEffect(() => {
    if (!initializedRef.current) return;
    try {
      const toStore = pesanList.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore — localStorage full
    }
  }, [pesanList]);

  // Helper untuk API call
  const fetchChatbot = useCallback(async (path: string, body: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const authDataStr = localStorage.getItem('tokiva_auth');
    let token = '';
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        token = authData.access_token || '';
      } catch {}
    }

    const response = await fetch(`${baseUrl}/api/chatbot${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    return response;
  }, []);

  // Kirim pesan
  const kirimPesan = useCallback(async (teks: string) => {
    if (!teks.trim() || sedangMemuat) return;

    // Tambah pesan user
    const pesanUser: PesanChat = {
      id: generateId(),
      role: 'user',
      konten: teks.trim(),
      waktu: getTimestamp(),
    };
    setPesanList((prev) => [...prev, pesanUser]);
    setSedangMemuat(true);

    try {
      const response = await fetchChatbot('/pesan', { pesan: teks.trim() });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.pesan || 'Gagal menghubungi server');
      }

      const data = await response.json();

      if (data.sukses && data.data) {
        const pesanBot: PesanChat = {
          id: generateId(),
          role: 'assistant',
          konten: data.data.balasan || 'Maaf, tidak ada respons.',
          waktu: getTimestamp(),
          konfirmasi: data.data.konfirmasi
            ? {
                aksiId: data.data.konfirmasi.aksiId,
                preview: data.data.konfirmasi.preview,
                toolName: data.data.konfirmasi.toolName,
                status: 'pending',
              }
            : undefined,
        };
        setPesanList((prev) => [...prev, pesanBot]);
      } else {
        throw new Error(data.pesan || 'Respons tidak valid');
      }
    } catch (err: any) {
      const pesanError: PesanChat = {
        id: generateId(),
        role: 'assistant',
        konten: `⚠️ ${err.message || 'Terjadi kesalahan. Silakan coba lagi.'}`,
        waktu: getTimestamp(),
      };
      setPesanList((prev) => [...prev, pesanError]);
    } finally {
      setSedangMemuat(false);
    }
  }, [sedangMemuat, fetchChatbot]);

  // Konfirmasi aksi
  const konfirmasiAksi = useCallback(async (aksiId: string) => {
    setSedangMemuat(true);

    // Update status konfirmasi jadi confirmed
    setPesanList((prev) =>
      prev.map((p) =>
        p.konfirmasi?.aksiId === aksiId
          ? { ...p, konfirmasi: { ...p.konfirmasi, status: 'confirmed' as const } }
          : p
      )
    );

    try {
      const response = await fetchChatbot('/konfirmasi', {
        aksiId,
        setuju: true,
      });

      const data = await response.json();

      if (data.sukses && data.data) {
        const pesanBot: PesanChat = {
          id: generateId(),
          role: 'assistant',
          konten: data.data.balasan || '✅ Aksi berhasil dijalankan.',
          waktu: getTimestamp(),
        };
        setPesanList((prev) => [...prev, pesanBot]);
      }
    } catch (err: any) {
      const pesanError: PesanChat = {
        id: generateId(),
        role: 'assistant',
        konten: `❌ Gagal mengeksekusi: ${err.message}`,
        waktu: getTimestamp(),
      };
      setPesanList((prev) => [...prev, pesanError]);
    } finally {
      setSedangMemuat(false);
    }
  }, [fetchChatbot]);

  // Batalkan aksi
  const batalAksi = useCallback((aksiId: string) => {
    // Update status konfirmasi jadi cancelled
    setPesanList((prev) =>
      prev.map((p) =>
        p.konfirmasi?.aksiId === aksiId
          ? { ...p, konfirmasi: { ...p.konfirmasi, status: 'cancelled' as const } }
          : p
      )
    );

    // Tambah pesan batal
    const pesanBatal: PesanChat = {
      id: generateId(),
      role: 'assistant',
      konten: '❌ Aksi dibatalkan. Ada yang lain yang bisa saya bantu?',
      waktu: getTimestamp(),
    };
    setPesanList((prev) => [...prev, pesanBatal]);

    // Kirim ke backend (fire and forget)
    fetchChatbot('/konfirmasi', { aksiId, setuju: false }).catch(() => {});
  }, [fetchChatbot]);

  // Bersihkan riwayat
  const bersihkanRiwayat = useCallback(() => {
    setPesanList([]);
    localStorage.removeItem(STORAGE_KEY);
    
    // Kirim ke backend untuk hapus session (fire and forget)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const authDataStr = localStorage.getItem('tokiva_auth');
    let token = '';
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        token = authData.access_token || '';
      } catch {}
    }
    fetch(`${baseUrl}/api/chatbot/riwayat`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }).catch(() => {});
  }, []);

  // Toggle open/close
  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    pesanList,
    sedangMemuat,
    isOpen,
    kirimPesan,
    konfirmasiAksi,
    batalAksi,
    bersihkanRiwayat,
    toggleOpen,
    setIsOpen,
  };
}
