/* Service worker : met l'application en cache pour un usage hors ligne. */
const CACHE = "eloquence-v4";
const FILES = [
  "./", "index.html", "css/style.css", "icon.svg", "icon-192.png", "manifest.webmanifest",
  "js/core.js", "js/speech.js", "js/main.js",
  "js/data/base.js", "js/data/parole.js", "js/data/expression.js", "js/data/cours.js", "js/data/programme.js",
  "js/views/bord.js", "js/views/voix.js", "js/views/parole.js", "js/views/jeux.js", "js/views/savoir.js",
  "js/views/compte.js", "js/cloud.js",
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
  const url = new URL(e.request.url);
  // Jamais de cache pour le compte et la progression en ligne
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;
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

/* ---------- Notifications push (rappels) ---------- */

self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: "Éloquence", body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(data.title || "Éloquence", {
      body: data.body || "Votre séance du jour vous attend !",
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: data.tag || "eloquence",
      renotify: true,
      data: { url: data.url || "./#programme" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope) && "focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
