/* Tetik Service Worker — Offline PWA Support */
const CACHE_NAME = 'tetik-cache-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/favicon.png',
  '/logo.png',
  '/manifest.json',
  '/alarm.mp3'
];

// Sensitive endpoints that must NEVER be cached by service worker
const SENSITIVE_URL_PATTERNS = [
  '/api/v1/auth',
  '/api/v1/chat',
  '/api/v1/prescription',
  '/api/v1/payments',
  '/api/v1/admin',
  '/api/v1/analytics'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Pre-caching partial shell failure:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never cache non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. Never cache sensitive health, auth, payment, chat, or admin requests
  for (const pattern of SENSITIVE_URL_PATTERNS) {
    if (url.pathname.includes(pattern)) {
      return;
    }
  }

  // 3. HTML Navigation requests (Single Page App fallback)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 4. Static assets (JS, CSS, Images, Fonts)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Revalidate in background
          fetch(req).then((fresh) => {
            if (fresh && fresh.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, fresh));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((fresh) => {
          if (fresh && fresh.status === 200) {
            const clone = fresh.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return fresh;
        });
      })
    );
    return;
  }

  // Default network with fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

/* ---- Web Push Notifications & Click Handling ---- */
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'VitaGo Bildirishnoma', message: event.data.text() };
    }
  }

  const title = data.title || 'VitaGo Bildirishnoma';
  const options = {
    body: data.message || data.body || "Siz uchun yangi eslatma mavjud.",
    icon: data.icon || '/logo.png',
    badge: data.badge || '/favicon.png',
    tag: data.tag || 'vitago-push-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetUrl && client.url !== self.location.origin + targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
