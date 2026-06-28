/**
 * useTheme.tsx
 * Pengelola tema (Light Mode / Dark Mode) dan warna utama (Color Theme) menggunakan Context + localStorage.
 * Menghindari hydration mismatch dengan deteksi client-side.
 *
 * Color Theme: Mengubah --primary, --primary-light, --primary-lighter, --primary-dark, --primary-gradient
 * pada runtime melalui manipulasi CSS custom properties di document.documentElement.
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Tema = 'light' | 'dark';

export interface ColorPreset {
  key: string;
  label: string;
  primary: string;
  primaryLight: string;
  primaryLighter: string;
  primaryDark: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { key: 'teal',    label: 'Teal',    primary: '#0D9488', primaryLight: '#14B8A6', primaryLighter: '#5EEAD4', primaryDark: '#0F766E' },
  { key: 'blue',    label: 'Blue',    primary: '#2563EB', primaryLight: '#3B82F6', primaryLighter: '#93C5FD', primaryDark: '#1D4ED8' },
  { key: 'indigo',  label: 'Indigo',  primary: '#4F46E5', primaryLight: '#6366F1', primaryLighter: '#A5B4FC', primaryDark: '#4338CA' },
  { key: 'purple',  label: 'Purple',  primary: '#7C3AED', primaryLight: '#8B5CF6', primaryLighter: '#C4B5FD', primaryDark: '#6D28D9' },
  { key: 'pink',    label: 'Pink',    primary: '#DB2777', primaryLight: '#EC4899', primaryLighter: '#F9A8D4', primaryDark: '#BE185D' },
  { key: 'rose',    label: 'Rose',    primary: '#E11D48', primaryLight: '#F43F5E', primaryLighter: '#FDA4AF', primaryDark: '#BE123C' },
  { key: 'orange',  label: 'Orange',  primary: '#EA580C', primaryLight: '#F97316', primaryLighter: '#FDBA74', primaryDark: '#C2410C' },
  { key: 'emerald', label: 'Emerald', primary: '#059669', primaryLight: '#10B981', primaryLighter: '#6EE7B7', primaryDark: '#047857' },
];

interface ThemeContextType {
  tema: Tema;
  toggleTema: () => void;
  warnaTema: string; // key dari COLOR_PRESETS atau 'custom'
  setWarnaTema: (key: string) => void;
  setCustomColor: (hex: string) => void;
  customColorHex: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Menerapkan variabel warna ke CSS custom properties pada :root
 */
function applyColorToDOM(preset: ColorPreset) {
  const root = document.documentElement;
  root.style.setProperty('--primary', preset.primary);
  root.style.setProperty('--primary-light', preset.primaryLight);
  root.style.setProperty('--primary-lighter', preset.primaryLighter);
  root.style.setProperty('--primary-dark', preset.primaryDark);
  root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${preset.primary}, ${preset.primaryLight})`);
}

/**
 * Menghasilkan variasi warna light/lighter/dark dari sebuah hex utama.
 */
function generateColorVariants(hex: string): ColorPreset {
  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Light: campuran 70% original + 30% putih
  const light = `#${Math.round(r + (255 - r) * 0.2).toString(16).padStart(2, '0')}${Math.round(g + (255 - g) * 0.2).toString(16).padStart(2, '0')}${Math.round(b + (255 - b) * 0.2).toString(16).padStart(2, '0')}`;
  // Lighter: campuran 40% original + 60% putih
  const lighter = `#${Math.round(r + (255 - r) * 0.55).toString(16).padStart(2, '0')}${Math.round(g + (255 - g) * 0.55).toString(16).padStart(2, '0')}${Math.round(b + (255 - b) * 0.55).toString(16).padStart(2, '0')}`;
  // Dark: 80% brightness
  const dark = `#${Math.round(r * 0.8).toString(16).padStart(2, '0')}${Math.round(g * 0.8).toString(16).padStart(2, '0')}${Math.round(b * 0.8).toString(16).padStart(2, '0')}`;

  return {
    key: 'custom',
    label: 'Custom',
    primary: hex,
    primaryLight: light,
    primaryLighter: lighter,
    primaryDark: dark,
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>('light');
  const [warnaTema, setWarnaTemaState] = useState('teal');
  const [customColorHex, setCustomColorHex] = useState('#0D9488');

  // Deteksi awal tema saat load pertama kali
  useEffect(() => {
    const savedTheme = localStorage.getItem('tokiva_theme') as Tema | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTema(initialTheme);
    
    // Terapkan ke DOM html tag
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Deteksi warna tema dari localStorage
    const savedColor = localStorage.getItem('tokiva_color_theme') || 'teal';
    const savedCustomHex = localStorage.getItem('tokiva_custom_color') || '#0D9488';
    setWarnaTemaState(savedColor);
    setCustomColorHex(savedCustomHex);

    if (savedColor === 'custom') {
      applyColorToDOM(generateColorVariants(savedCustomHex));
    } else {
      const preset = COLOR_PRESETS.find((p) => p.key === savedColor);
      if (preset) applyColorToDOM(preset);
    }
  }, []);

  const toggleTema = useCallback(() => {
    setTema((prev) => {
      const next: Tema = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('tokiva_theme', next);
      
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  const setWarnaTema = useCallback((key: string) => {
    setWarnaTemaState(key);
    localStorage.setItem('tokiva_color_theme', key);

    if (key === 'custom') {
      const savedHex = localStorage.getItem('tokiva_custom_color') || '#0D9488';
      applyColorToDOM(generateColorVariants(savedHex));
    } else {
      const preset = COLOR_PRESETS.find((p) => p.key === key);
      if (preset) applyColorToDOM(preset);
    }
  }, []);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorHex(hex);
    localStorage.setItem('tokiva_custom_color', hex);
    localStorage.setItem('tokiva_color_theme', 'custom');
    setWarnaTemaState('custom');
    applyColorToDOM(generateColorVariants(hex));
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, toggleTema, warnaTema, setWarnaTema, setCustomColor, customColorHex }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme harus digunakan di dalam ThemeProvider');
  }
  return context;
}
