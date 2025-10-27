// Service Worker for 2-2-2 PWA
const CACHE_NAME = '2-2-2-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/Alleah-500.png',
  '/splash-2048x2732.png',
  '/splash-1290x2796.png',
  '/splash-1284x2778.png',
  '/splash-1170x2532.png',
  '/splash-1125x2436.png',
  '/splash-1242x2688.png',
  '/src/App.css',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});