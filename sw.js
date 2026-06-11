// ═══════════════════════════════════════════════════════════
//  LetraViva – Service Worker
//  Permite que la app funcione offline (caché de archivos)
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = "letraviva-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/config.js",
  "/puzzle-engine.js",
  "/app.js",
  "/manifest.json"
];

// Instala y cachea los archivos principales
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activa y limpia cachés viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: Cache primero para assets, red para la API de IA
self.addEventListener("fetch", event => {
  const { request } = event;

  // Las llamadas a la API de Anthropic siempre van por red
  if (request.url.includes("anthropic.com")) {
    event.respondWith(fetch(request));
    return;
  }

  // El resto: cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});
