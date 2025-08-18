const CACHE_NAME = 'my-pwa-cache-v01';
const urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/css/style.css',
  'https://drive.iust.ac.ir/public.php/dav/files/Yn7rRmYdfY7LZBC/components.csv',
  '/static/images/add.png',
  '/static/images/logo.png',
  '/static/images/mainlogo.ico',
  '/static/images/remove.png', 
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/manifest.json',
  // اگه فایل دیگه‌ای اضافه شد اینجا اضافه کن
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache شد:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});


