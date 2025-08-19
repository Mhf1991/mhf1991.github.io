const CACHE_NAME = "my-cache-" + new Date().toISOString().slice(0,10) + "-" + Date.now();
const urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/css/style.css',
  '/static/components.json',
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
  self.skipWaiting();
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

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  clients.claim(); 
});

