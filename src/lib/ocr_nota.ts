import Tesseract from 'tesseract.js';

export interface ParsedItem {
  nama: string;
  qty: number;
  harga: number;
  confidence: number;
  produk_id?: number;
}

/**
 * Melakukan OCR pada file foto nota menggunakan tesseract.js
 * @param imageSource File gambar atau Canvas element
 * @param onProgress Callback untuk memantau progress OCR (0 - 1)
 */
export async function ocrNota(
  imageSource: File | string | HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const result = await Tesseract.recognize(
      imageSource,
      'ind+eng',
      {
        logger: (m) => {
          if (m && m.status === 'recognizing' && onProgress) {
            onProgress(m.progress);
          }
        }
      }
    );
    return result.data.text;
  } catch (error) {
    console.error('Gagal melakukan OCR Nota:', error);
    throw error;
  }
}

/**
 * Membersihkan string angka harga/qty menjadi format float standard
 */
function cleanNumberString(str: string): string {
  let clean = str.replace(/[^0-9.,]/g, '').trim();
  if (!clean) return '0';
  
  const dotIndex = clean.lastIndexOf('.');
  const commaIndex = clean.lastIndexOf(',');
  const lastIndex = Math.max(dotIndex, commaIndex);
  
  // Jika ada desimal sen (2 digit di belakang separator)
  if (lastIndex !== -1 && (clean.length - lastIndex - 1) === 2) {
    const desimal = clean.substring(lastIndex + 1);
    const ribuan = clean.substring(0, lastIndex).replace(/[.,]/g, '');
    return `${ribuan}.${desimal}`;
  } else {
    // Tanpa sen desimal, hapus semua titik/koma ribuan
    return clean.replace(/[.,]/g, '');
  }
}

/**
 * Memparsing teks hasil OCR nota supplier menjadi array barang belanjaan
 */
export function parseNotaText(ocrText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  if (!ocrText) return items;
  
  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Abaikan baris yang terdeteksi sebagai header/footer nota umum
    if (
      lowerLine.includes('total') ||
      lowerLine.includes('bayar') ||
      lowerLine.includes('kembalian') ||
      lowerLine.includes('terima kasih') ||
      lowerLine.includes('nota') ||
      lowerLine.includes('invoice') ||
      lowerLine.includes('telp') ||
      lowerLine.includes('tanggal') ||
      lowerLine.includes('toko') ||
      lowerLine.includes('alamat') ||
      lowerLine.includes('cashier') ||
      lowerLine.includes('kasir') ||
      lowerLine.includes('kembali') ||
      lowerLine.includes('kembalian') ||
      lowerLine.includes('diskon') ||
      lowerLine.includes('pajak') ||
      lowerLine.includes('tax')
    ) {
      continue;
    }

    // Pattern 1: "Indomie Goreng 2 x 3.500 7.000" atau "Indomie Goreng 2 @ 3.500"
    const match1 = line.match(/(.+?)\s+(\d+)\s*(?:x|@)\s*([\d.,]+)\s+([\d.,]+)/i) || 
                   line.match(/(.+?)\s+(\d+)\s*(?:x|@)\s*([\d.,]+)/i);
    
    // Pattern 2: "Indomie Goreng 2 3.500 7.000"
    const match2 = line.match(/(.+?)\s+(\d+(?:\.\d+)?)\s+([\d.,]+)\s+([\d.,]+)/);
    
    // Pattern 3: "Indomie Goreng 3.500" (qty=1 secara implisit)
    const match3 = line.match(/(.+?)\s+([\d.,\s]+)$/);
    
    let nama = '';
    let qty = 1;
    let harga = 0;
    
    if (match1) {
      nama = match1[1];
      qty = parseInt(match1[2], 10);
      harga = parseFloat(cleanNumberString(match1[3]));
    } else if (match2) {
      nama = match2[1];
      qty = parseInt(match2[2], 10);
      harga = parseFloat(cleanNumberString(match2[3]));
    } else if (match3) {
      nama = match3[1];
      const potentialPrice = cleanNumberString(match3[2]);
      if (potentialPrice && !isNaN(Number(potentialPrice))) {
        harga = parseFloat(potentialPrice);
      } else {
        continue;
      }
    } else {
      continue;
    }
    
    nama = nama.trim().replace(/^[:.\-\s]+/, ''); // Bersihkan prefix karakter aneh
    
    // Validasi nama: jangan terlalu pendek dan bukan angka saja
    if (nama.length < 3 || /^\d+$/.test(nama)) {
      continue;
    }
    
    // Pastikan harga beli logis (di atas 100 rupiah)
    if (harga < 100) {
      continue;
    }

    items.push({
      nama,
      qty,
      harga,
      confidence: 0.7
    });
  }
  
  return items;
}
