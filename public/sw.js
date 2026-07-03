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
  // Hanya proses cache untuk request GET
  if (e.request.method !== 'GET') {
    return;
  }

  // Network-First Strategy: Coba ambil dari jaringan dulu, jika gagal (offline) gunakan cache
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Hanya cache response yang valid (status 200/OK)
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          return cachedResponse || new Response('Koneksi internet terputus dan data tidak ada di cache.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});
