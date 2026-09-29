/* Noyau de l'application : utilitaires, réglages, historique, navigation. */
window.App = (() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("eloquence." + key);
        return v ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("eloquence." + key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
    },
    keys() {
      try { return Object.keys(localStorage).filter((k) => k.startsWith("eloquence.")); } catch { return []; }
    },
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  /* Tire un élément différent du précédent. */
  const pickOther = (arr, prev) => {
    if (arr.length < 2) return arr[0];
    let x;
    do { x = pick(arr); } while (x === prev);
    return x;
  };
  const todayKey = (d = new Date()) => d.toLocaleDateString("sv");
  const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const plural = (n, word, pl = word + "s") => `${n} ${n > 1 ? pl : word}`;

  /* ---------- Réglages ---------- */

  const DEFAULTS = { theme: "auto", voice: "", rate: 0.9, lang: "fr-FR", name: "", buzz: false };
  const settings = {
    get(key) { return { ...DEFAULTS, ...store.get("settings", {}) }[key]; },
    set(key, value) {
      const s = store.get("settings", {});
      s[key] = value;
      store.set("settings", s);
      if (key === "theme") applyTheme();
    },
  };
  function applyTheme() {
    const t = settings.get("theme");
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }

  /* ---------- Voix de synthèse ---------- */

  function frenchVoices() {
    if (!("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("fr"));
  }
  function speak(text, rate, onEnd) {
    if (!("speechSynthesis" in window)) { onEnd && onEnd(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = rate ?? settings.get("rate");
    const voices = frenchVoices();
    const wanted = settings.get("voice");
    u.voice = voices.find((v) => v.name === wanted) || voices[0] || null;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    speechSynthesis.speak(u);
  }
  const stopSpeaking = () => window.speechSynthesis && speechSynthesis.cancel();

  /* ---------- Composants ---------- */

  function segmented(el, onChange) {
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !el.contains(btn)) return;
      el.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      onChange(btn.dataset, btn);
    });
  }
  function setSegment(el, attr, value) {
    el.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset[attr] === String(value)));
  }

  let toastTimer;
  function toast(html, ms = 3500) {
    let t = $("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  function download(filename, content, type = "text/plain") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: type + ";charset=utf-8" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- Historique & progression ---------- */

  const hooks = [];
  const history = () => store.get("history", []);
  function logActivity(entry) {
    const h = history();
    h.unshift({ date: new Date().toISOString(), day: todayKey(), ...entry });
    store.set("history", h.slice(0, 2000));
    hooks.forEach((fn) => fn(entry));
    updateStreakBadge();
  }
  const onActivity = (fn) => hooks.push(fn);

  function activeDays() { return new Set(history().map((h) => h.day)); }
  function streak() {
    const days = activeDays();
    const d = new Date();
    if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function bestStreak() {
    const days = [...activeDays()].sort();
    let best = 0, run = 0, prev = null;
    for (const k of days) {
      const t = new Date(k + "T12:00:00").getTime();
      run = prev != null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = t;
    }
    return best;
  }
  function updateStreakBadge() {
    const el = $("#streak");
    if (el) el.textContent = `🔥 ${streak()}`;
  }

  /* ---------- Navigation ---------- */

  const GROUPS = [
    ["bord", "Tableau de bord"],
    ["voix", "Voix & corps"],
    ["parole", "Prise de parole"],
    ["expression", "Expression"],
    ["apprendre", "Apprendre"],
    ["reglages", "Réglages"],
  ];
  const views = [];
  let current = null;

  /* Déclare une section : { id, title, icon, group, desc, html, init, show, hide }. */
  function view(def) { views.push(def); }
  const getView = (id) => views.find((v) => v.id === id);

  function go(id) {
    if (decodeURIComponent(location.hash.slice(1)) === id) route();
    else location.hash = id;
  }

  function route() {
    const [id, param] = decodeURIComponent(location.hash.slice(1) || "accueil").split("/");
    const v = getView(id) || getView("accueil");
    if (current && current !== v && current.hide) current.hide();
    if (!v.el) {
      v.el = document.createElement("section");
      v.el.className = "panel";
      v.el.id = "view-" + v.id;
      v.el.innerHTML = typeof v.html === "function" ? v.html() : v.html;
      $("#main").appendChild(v.el);
      v.init && v.init(v.el);
    }
    views.forEach((x) => { if (x.el) x.el.hidden = x !== v; });
    current = v;
    $("#view-title").textContent = v.title;
    document.title = v.id === "accueil" ? "Éloquence" : `${v.title} · Éloquence`;
    $$("#drawer a").forEach((a) => a.classList.toggle("active", a.dataset.view === v.id));
    closeMenu();
    window.scrollTo({ top: 0 });
    v.show && v.show(v.el, param);
  }

  function buildMenu() {
    $("#drawer-nav").innerHTML = GROUPS.map(([g, label]) => {
      const items = views.filter((v) => v.group === g);
      if (!items.length) return "";
      return `<div class="nav-group"><div class="nav-label">${label}</div>
        ${items.map((v) => `<a href="#${v.id}" data-view="${v.id}"><span class="nav-icon" aria-hidden="true">${v.icon}</span>${esc(v.title)}</a>`).join("")}
      </div>`;
    }).join("");
  }

  function openMenu() {
    document.body.classList.add("menu-open");
    $("#menu-btn").setAttribute("aria-expanded", "true");
    $("#drawer").setAttribute("aria-hidden", "false");
    const active = $("#drawer a.active") || $("#drawer a");
    active && active.focus({ preventScroll: true });
  }
  function closeMenu() {
    if (!document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    $("#menu-btn").setAttribute("aria-expanded", "false");
    $("#drawer").setAttribute("aria-hidden", "true");
  }

  function start() {
    applyTheme();
    buildMenu();
    $("#menu-btn").addEventListener("click", () => (document.body.classList.contains("menu-open") ? closeMenu() : openMenu()));
    $("#drawer-close").addEventListener("click", closeMenu);
    $("#overlay").addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
    $("#streak").addEventListener("click", () => go("progression"));
    window.addEventListener("hashchange", route);
    if ("speechSynthesis" in window) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }
    updateStreakBadge();
    route();
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(() => { /* hors ligne indisponible */ });
    }
  }

  return {
    $, $$, store, esc, clamp, pick, pickOther, shuffle, todayKey, dayNumber, fmtTime, plural,
    settings, speak, stopSpeaking, frenchVoices, segmented, setSegment, toast, download,
    history, logActivity, onActivity, streak, bestStreak, activeDays,
    view, views, getView, go, start, GROUPS,
    SR: window.SpeechRecognition || window.webkitSpeechRecognition,
  };
})();
