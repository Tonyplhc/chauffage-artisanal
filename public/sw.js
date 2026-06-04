/**
 * Service Worker — mode dégradé offline.
 *
 * Stratégies par type de ressource :
 *   - HTML (navigation) : network-first avec timeout 4s → fallback cache → fallback /offline
 *   - JS / CSS / fonts : stale-while-revalidate (sert le cache instantané, rafraîchit en arrière-plan)
 *   - Images : cache-first avec fallback transparent SVG si offline
 *   - API (/api/*) : passthrough réseau, jamais de cache
 *   - Admin (/admin/*) : passthrough réseau, jamais de cache (UX live + sécurité)
 *
 * Cache versioning : bump le numéro pour invalider à un déploiement majeur.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `ca-static-${CACHE_VERSION}`;
const PAGES_CACHE = `ca-pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `ca-images-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline";

// Pré-cache des pages essentielles à l'install
const PRECACHE_URLS = [
  "/",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES_CACHE);
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch {
        // certaines pages peuvent ne pas être pré-cachables (ex: erreur)
      }
      // Active immédiatement, sans attendre le rafraîchissement
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge des anciens caches
      const names = await caches.keys();
      const toDelete = names.filter(
        (n) =>
          !n.endsWith(CACHE_VERSION) &&
          (n.startsWith("ca-static-") ||
            n.startsWith("ca-pages-") ||
            n.startsWith("ca-images-")),
      );
      await Promise.all(toDelete.map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Ne pas toucher aux origines externes
  if (url.origin !== self.location.origin) return;

  // Ne JAMAIS cacher /api/* et /admin/*
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) {
    return; // passthrough réseau
  }

  // Navigation HTML
  if (req.mode === "navigate") {
    event.respondWith(handleNavigation(req));
    return;
  }

  // Images
  if (req.destination === "image") {
    event.respondWith(handleImage(req));
    return;
  }

  // JS / CSS / fonts → stale-while-revalidate
  if (
    req.destination === "script" ||
    req.destination === "style" ||
    req.destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function handleNavigation(req) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const network = await fetchWithTimeout(req, 4000);
    if (network && network.ok) {
      cache.put(req, network.clone());
      return network;
    }
  } catch {
    // tombé
  }
  const cached = await cache.match(req);
  if (cached) return cached;
  const offline = await cache.match(OFFLINE_URL);
  if (offline) return offline;
  return new Response("Offline", { status: 503 });
}

async function handleImage(req) {
  const cache = await caches.open(IMAGES_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const network = await fetch(req);
    if (network && network.ok) {
      // Cap : ne pas cacher les très gros assets
      const len = network.headers.get("content-length");
      if (!len || Number(len) < 1024 * 1024 * 3) {
        cache.put(req, network.clone());
      }
      return network;
    }
    return network;
  } catch {
    // Image fallback transparent 1x1
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      { headers: { "Content-Type": "image/svg+xml" } },
    );
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await networkPromise) || new Response("", { status: 504 });
}

function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(req).then(
      (r) => {
        clearTimeout(t);
        resolve(r);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
