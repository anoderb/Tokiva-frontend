# Tokiva POS Frontend (Next.js & PWA Edition)

Frontend ini dibangun menggunakan **Next.js**, **React**, **Tailwind CSS v4**, dan **TypeScript**. Aplikasi ini merupakan bagian antarmuka dari sistem POS (Point of Sales) modern yang dirancang responsif, interaktif, serta dilengkapi dengan berbagai fitur kecerdasan buatan (AI) berbasis client-side untuk meningkatkan efisiensi operasional toko ritel.

---

## ✨ Fitur Utama & Inovasi Ritel

### 1. Progressive Web App (PWA)
Aplikasi dapat diinstal langsung di perangkat smartphone (Android/iOS) maupun desktop layaknya aplikasi lokal. Mendukung caching aset untuk akses cepat dan memiliki *local storage fallback* untuk menyimpan transaksi secara offline ketika koneksi internet terputus, yang kemudian akan disinkronisasikan otomatis saat kembali online.

### 2. Barcode Scanner Kamera Terintegrasi
Menggunakan pustaka `@zxing/browser` untuk memindai barcode produk secara real-time langsung melalui kamera perangkat. Fitur ini mempermudah proses pencarian dan input produk ke keranjang belanja kasir tanpa memerlukan alat pemindai fisik eksternal.

### 3. Klasifikasi Gambar Produk (AI Edge)
Dilengkapi dengan model AI **TensorFlow.js (MobileNet)** untuk mendeteksi produk otomatis melalui kamera. Kasir cukup mengarahkan kamera ke produk, dan model AI akan mengklasifikasikan barang secara instan langsung di browser pengguna tanpa membebani server backend.

### 4. OCR Nota Supplier (Optical Character Recognition)
Inovasi pencatatan stok masuk menggunakan **Tesseract.js**. Kasir dapat memfoto nota pembelian dari supplier/pemasok, dan aplikasi secara otomatis mengekstrak teks nominal harga beli serta kuantitas barang, mempercepat input data stok masuk secara dramatis.

---

## 🛠️ Persyaratan System

- Node.js (v18 atau lebih tinggi)
- npm atau yarn

---

## 🚀 Cara Menjalankan secara Lokal

### 1. Install Dependensi
Masuk ke direktori `frontend` dan jalankan instalasi:
```bash
cd frontend
npm install
```

### 2. Setup Environment Variable
Buat berkas `.env.local` di root folder proyek frontend dan definisikan URL endpoint API backend Anda (FastAPI atau Node.js):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Jalankan Server Development
Jalankan server dalam mode development:
```bash
npm run dev
```
Buka **`http://localhost:3000`** di browser Anda untuk melihat aplikasi berjalan.

---

## 📦 Panduan Deployment ke Vercel

Aplikasi ini dapat dengan mudah dideploy secara gratis ke platform Vercel:
1. Hubungkan repositori GitHub Anda ke Vercel.
2. Saat proses konfigurasi project di Vercel, tambahkan variabel lingkungan (**Environment Variable**):
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `<URL_BACKEND_DEPLOIMENT_ANDA>` (misalnya URL backend di Hugging Face Spaces).
3. Klik **Deploy**. Vercel akan otomatis menangani pembangunan dan penyediaan URL HTTPS publik secara global.
