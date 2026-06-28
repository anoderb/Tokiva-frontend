const CACHE_NAME = 'tokiva-cache-v1';
const ASSETS = [
  '/',
  '/dashboard',
  '/kasir',
  '/produk',
  '/stok',
  '/bon',
  '/pelanggan',
  '/pemasok',
  '/shift',
  '/notifikasi',
  '/pengaturan',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
