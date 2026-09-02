const CACHE = 'project11-v1';
const ASSETS = ['/Project11.html', '/manifest.json', '/icon-192.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', ev => {
  ev.respondWith(
    fetch(ev.request).catch(() => caches.match(ev.request))
  );
});
