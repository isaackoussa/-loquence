/* Service worker : met l'application en cache pour un usage hors ligne. */
const CACHE = "eloquence-v3";
const FILES = [
  "./", "index.html", "css/style.css", "icon.svg", "manifest.webmanifest",
  "js/core.js", "js/speech.js", "js/main.js",
  "js/data/base.js", "js/data/parole.js", "js/data/expression.js", "js/data/cours.js", "js/data/programme.js",
  "js/views/bord.js", "js/views/voix.js", "js/views/parole.js", "js/views/jeux.js", "js/views/savoir.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* Réseau d'abord (pour recevoir les mises à jour), cache en secours. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))),
  );
});
