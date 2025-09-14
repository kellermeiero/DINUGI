const CACHE_NAME = 'dirigent-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/musician.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch-Events abfangen (Offline-Funktionalität)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache-Hit - gib die gecachte Version zurück
        if (response) {
          return response;
        }
        
        // Kein Cache-Hit - hole vom Netzwerk
        return fetch(event.request).then((response) => {
          // Prüfe ob gültige Response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone die Response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
    );
});

// Aktivierung
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Lösche alten Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push-Nachrichten (für zukünftige Erweiterungen)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Neue Nummer verfügbar',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/?view=musician'
      },
      actions: [
        {
          action: 'open',
          title: 'Öffnen',
          icon: '/icons/icon-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Dirigent App', options)
    );
  }
});

// Notification-Klicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/?view=musician')
    );
  }
});