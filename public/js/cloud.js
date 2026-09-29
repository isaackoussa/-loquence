/* Compte en ligne : connexion par code e-mail, sauvegarde de la progression, rappels et notifications. */
(() => {
  "use strict";
  const { $, esc, store } = App;

  const SESSION_KEY = "eloquence.session";
  const PREFIX = "eloquence.";

  /* ---------- Session ---------- */

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  let session = readSession();
  function setSession(s) {
    session = s;
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch { /* stockage indisponible */ }
  }
  const online = () => !!session && !session.local;

  /* ---------- Appels API ---------- */

  class ApiError extends Error {
    constructor(status, code, data = {}) {
      super(code);
      this.status = status;
      this.code = code;
      this.data = data;
    }
  }

  async function api(path, init = {}) {
    const headers = new Headers(init.headers);
    if (init.body) headers.set("Content-Type", "application/json");
    if (online()) headers.set("Authorization", `Bearer ${session.token}`);
    let res;
    try {
      res = await fetch(`./api/${path}`, { ...init, headers });
    } catch {
      throw new ApiError(0, "network");
    }
    const type = res.headers.get("content-type") || "";
    // Hébergement sans fonctions serveur (GitHub Pages, serveur local) : pas de réponse JSON
    if (!type.includes("application/json")) throw new ApiError(res.status, "no_server");
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 && online()) { setSession(null); showGate(); }
      throw new ApiError(res.status, String(data.error || "error"), data);
    }
    return data;
  }

  const ERRORS = {
    network: "Connexion impossible. Vérifiez votre connexion internet.",
    no_server: "Le compte en ligne n’est pas disponible sur cette version de l’application.",
    mail_not_configured: "L’envoi d’e-mails n’est pas encore configuré (BREVO_API_KEY et MAIL_FROM dans Netlify).",
    mail_send_failed: "L’e-mail n’a pas pu être envoyé. Vérifiez l’adresse et réessayez.",
    invalid_email: "Cette adresse e-mail n’est pas valide.",
    too_soon: "Patientez 30 secondes avant de redemander un code.",
    no_code: "Aucun code en cours pour cette adresse : redemandez un code.",
    expired: "Ce code a expiré : redemandez un code.",
    wrong_code: "Code incorrect.",
    too_many_attempts: "Trop d’essais : redemandez un nouveau code.",
    blocked: "Ce compte est suspendu.",
  };
  function errorText(e) {
    if (e instanceof ApiError) {
      if (e.code === "wrong_code" && typeof e.data.remaining === "number") {
        const n = e.data.remaining;
        return `Code incorrect (${n} essai${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""}).`;
      }
      return ERRORS[e.code] || `Erreur (${e.status}).`;
    }
    return "Erreur inattendue.";
  }

  const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";

  /* ---------- État local ---------- */

  /* Toutes les données de l'app (hors session), clés sans préfixe. */
  function collectState() {
    const state = {};
    store.keys().forEach((k) => {
      if (k === SESSION_KEY) return;
      try { state[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch { /* valeur illisible */ }
    });
    return state;
  }
  function replaceState(state) {
    store.keys().forEach((k) => { if (k !== SESSION_KEY) { try { localStorage.removeItem(k); } catch { /* ignoré */ } } });
    Object.entries(state || {}).forEach(([k, v]) => store.set(k, v));
  }

  function buildSummary() {
    const h = App.history();
    const speeches = h.filter((x) => x.type === "speech" && x.score != null);
    const last5 = speeches.slice(0, 5);
    const wpm = h.filter((x) => x.type === "speech" && x.wpm).slice(0, 5);
    const prog = store.get("program", { done: {} });
    const programDone = PROGRAM.filter((d, i) => d.tasks.every((_, k) => prog.done?.[i]?.[k])).length;
    const next = PROGRAM.findIndex((d, i) => !d.tasks.every((_, k) => prog.done?.[i]?.[k]));
    return {
      name: App.settings.get("name") || "",
      streak: App.streak(),
      bestStreak: App.bestStreak(),
      activeDays: App.activeDays().size,
      exercises: h.length,
      speeches: speeches.length,
      avgScore: last5.length ? Math.round(last5.reduce((s, x) => s + x.score, 0) / last5.length) : null,
      bestScore: speeches.length ? Math.max(...speeches.map((x) => x.score)) : null,
      avgWpm: wpm.length ? Math.round(wpm.reduce((s, x) => s + x.wpm, 0) / wpm.length) : null,
      minutes: Math.round(h.reduce((s, x) => s + (x.duration || 0), 0) / 60),
      programDay: next === -1 ? PROGRAM.length : next + 1,
      programDone,
      lessonsRead: Object.keys(store.get("lessons", {})).length,
      badges: store.get("badges", []).length,
      lastActiveDate: h.length ? h[0].day : null,
    };
  }

  /* ---------- Synchronisation ---------- */

  let timer, lastSent = "", status = "idle";
  const statusListeners = new Set();
  function setStatus(s) {
    status = s;
    statusListeners.forEach((fn) => fn(s));
  }

  async function pushProgress(force = false) {
    if (!online()) return;
    const state = collectState();
    const fingerprint = JSON.stringify(state);
    if (!force && fingerprint === lastSent) return;
    setStatus("saving");
    try {
      const res = await api("progress", { method: "PUT", body: JSON.stringify({ state, summary: buildSummary(), updatedAt: new Date().toISOString() }) });
      lastSent = fingerprint;
      setStatus("saved");
      if (res.milestones && res.milestones.length) App.toast(`📧 ${esc(res.milestones[res.milestones.length - 1])}`);
    } catch {
      setStatus("offline");
    }
  }

  function startSync() {
    // Sauvegarde en ligne quelques secondes après chaque modification
    const set = store.set;
    store.set = (key, value) => {
      set(key, value);
      if (!online()) return;
      clearTimeout(timer);
      timer = setTimeout(() => pushProgress(), 4000);
    };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") pushProgress(); });
    window.addEventListener("online", () => pushProgress());
  }

  /* ---------- Connexion ---------- */

  const sendCode = (email) => api("auth/send-code", { method: "POST", body: JSON.stringify({ email }) });

  async function verifyCode(email, code) {
    const res = await api("auth/verify", { method: "POST", body: JSON.stringify({ email, code, name: App.settings.get("name"), tz: timezone() }) });
    setSession({ email: res.email, token: res.token });
    prefsCache = { prefs: res.prefs, pushEnabled: res.pushEnabled };
    // La sauvegarde la plus riche l'emporte : en ligne si elle contient au moins autant d'activités
    const remote = res.state;
    const remoteCount = remote && Array.isArray(remote.history) ? remote.history.length : 0;
    if (remote && remoteCount >= App.history().length) {
      replaceState(remote);
      return { reload: true, isNew: res.isNew };
    }
    await pushProgress(true);
    return { reload: false, isNew: res.isNew };
  }

  function continueLocally() { setSession({ email: "local", token: "", local: true }); }

  async function logout() {
    try { if (online()) { await pushProgress(true); await api("me", { method: "DELETE" }); } } catch { /* session déjà expirée */ }
    setSession(null);
  }

  /* ---------- Rappels ---------- */

  let prefsCache = null;
  async function loadPrefs() {
    if (prefsCache) return prefsCache;
    const me = await api("me");
    prefsCache = { prefs: me.prefs, pushEnabled: me.pushEnabled };
    return prefsCache;
  }
  async function savePrefs(patch) {
    prefsCache = await api("prefs", { method: "PUT", body: JSON.stringify({ ...patch, tz: timezone() }) });
    return prefsCache;
  }
  const testReminder = () => api("prefs/test", { method: "POST" });

  const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  function urlBase64ToUint8Array(base64) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }
  /* Demande l'autorisation et abonne cet appareil aux notifications. */
  async function enablePush() {
    if (!pushSupported()) return "unsupported";
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";
    const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("sw.js"));
    await navigator.serviceWorker.ready;
    const { vapidPublicKey } = await api("config");
    const existing = await reg.pushManager.getSubscription();
    const sub = existing || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) }));
    await savePrefs({ push: true, subscription: sub.toJSON() });
    return "ok";
  }
  async function disablePush() {
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) await sub.unsubscribe();
    await savePrefs({ push: false, subscription: null });
  }

  /* ---------- Console admin ---------- */

  async function adminList(key) {
    const res = await fetch("./api/admin", { headers: { "x-admin-key": key } });
    if (!res.ok) throw new ApiError(res.status, res.status === 401 ? "unauthorized" : "error");
    return (await res.json()).users;
  }
  const adminBlock = (key, email, blocked) =>
    fetch("./api/admin", { method: "POST", headers: { "x-admin-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ email, blocked }) });

  /* ---------- Barrière de connexion ---------- */

  function gateHTML() {
    return `
      <div class="gate-card">
        <div class="gate-brand"><span class="brand-mark" aria-hidden="true">É</span><span><strong>Éloquence</strong><small>Coach de prise de parole</small></span></div>
        <form id="gate-email" class="gate-form">
          <h1>Votre espace personnel</h1>
          <p class="muted">Connectez-vous avec votre e-mail : votre progression est sauvegardée et vous suit sur tous vos appareils. Pas de mot de passe, juste un code.</p>
          <label class="field"><span>Adresse e-mail</span>
            <input type="email" id="gate-mail" inputmode="email" autocomplete="email" placeholder="vous@exemple.com" required>
          </label>
          <p class="gate-error" id="gate-err1" hidden></p>
          <button class="btn primary big-btn" id="gate-send">Recevoir mon code →</button>
          <ul class="gate-perks">
            <li>☁️ Progression sauvegardée en ligne, sur ordinateur et téléphone</li>
            <li>🔔 Des rappels aux jours et à l’heure que vous choisissez</li>
            <li>📊 Un bilan de vos progrès chaque semaine par e-mail</li>
          </ul>
        </form>
        <form id="gate-code" class="gate-form" hidden>
          <button type="button" class="btn ghost small" id="gate-back">← Changer d’e-mail</button>
          <h1>Vérifiez votre boîte mail 📬</h1>
          <p class="muted">Un code à 6 chiffres a été envoyé à <b id="gate-to"></b>. Pensez à regarder dans les spams.</p>
          <input id="gate-otp" class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="Code à 6 chiffres">
          <p class="gate-error" id="gate-err2" hidden></p>
          <button class="btn primary big-btn" id="gate-verify">Me connecter</button>
          <button type="button" class="btn ghost" id="gate-resend">Renvoyer un code</button>
        </form>
        <div class="gate-local" id="gate-local" hidden>
          <p class="small"><b>Compte en ligne indisponible ici.</b> Cette version de l’application n’a pas de serveur (le compte, les rappels et les e-mails fonctionnent sur la version publiée sur Netlify). Vous pouvez l’utiliser sans compte : votre progression reste sur cet appareil.</p>
          <button class="btn" id="gate-continue">Continuer sans compte</button>
        </div>
        <p class="muted tiny">En continuant, vous acceptez de recevoir les e-mails liés à votre compte (code, rappels, bilans). Vous pouvez les désactiver à tout moment dans Compte &amp; rappels.</p>
      </div>`;
  }

  let gateReady = false;
  function showGate() {
    const gate = $("#gate");
    if (!gateReady) {
      gate.innerHTML = gateHTML();
      bindGate(gate);
      gateReady = true;
    }
    gate.hidden = false;
    document.body.classList.add("gated");
    // Détecte un hébergement sans serveur pour proposer le mode local
    api("config").catch((e) => { if (e.code === "no_server") $("#gate-local").hidden = false; });
    setTimeout(() => { const m = $("#gate-mail"); m && m.focus(); }, 50);
  }
  function hideGate() {
    $("#gate").hidden = true;
    document.body.classList.remove("gated");
  }

  function bindGate(gate) {
    const q = (s) => $(s, gate);
    let email = "", cooldown = 0, cdTimer;
    const err = (el, text) => { el.textContent = text; el.hidden = !text; };
    const tick = () => {
      const b = q("#gate-resend");
      b.disabled = cooldown > 0;
      b.textContent = cooldown > 0 ? `Renvoyer un code (${cooldown} s)` : "Renvoyer un code";
      if (cooldown > 0) { cooldown--; cdTimer = setTimeout(tick, 1000); }
    };
    async function request(e) {
      e && e.preventDefault();
      email = q("#gate-mail").value.trim();
      err(q("#gate-err1"), "");
      err(q("#gate-err2"), "");
      const btn = q("#gate-send");
      btn.disabled = true;
      btn.textContent = "Envoi du code…";
      try {
        await sendCode(email);
        q("#gate-email").hidden = true;
        q("#gate-code").hidden = false;
        q("#gate-to").textContent = email;
        clearTimeout(cdTimer);
        cooldown = 30;
        tick();
        setTimeout(() => q("#gate-otp").focus(), 50);
      } catch (ex) {
        err(q("#gate-code").hidden ? q("#gate-err1") : q("#gate-err2"), errorText(ex));
        if (ex.code === "no_server") q("#gate-local").hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = "Recevoir mon code →";
      }
    }
    async function verify(e) {
      e && e.preventDefault();
      const code = q("#gate-otp").value.replace(/\D/g, "");
      if (code.length !== 6) return;
      err(q("#gate-err2"), "");
      const btn = q("#gate-verify");
      btn.disabled = true;
      btn.textContent = "Vérification…";
      try {
        const r = await verifyCode(email, code);
        if (r.reload) { location.reload(); return; }
        hideGate();
        App.toast(r.isNew ? "🎉 Compte créé : bienvenue !" : "✅ Connecté");
        App.go("accueil");
      } catch (ex) {
        err(q("#gate-err2"), errorText(ex));
        q("#gate-otp").value = "";
      } finally {
        btn.disabled = false;
        btn.textContent = "Me connecter";
      }
    }
    q("#gate-email").addEventListener("submit", request);
    q("#gate-code").addEventListener("submit", verify);
    q("#gate-resend").addEventListener("click", () => request());
    q("#gate-back").addEventListener("click", () => { q("#gate-code").hidden = true; q("#gate-email").hidden = false; });
    q("#gate-otp").addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
      if (e.target.value.length === 6) verify();
    });
    q("#gate-continue").addEventListener("click", () => { continueLocally(); hideGate(); });
  }

  /* Au démarrage : barrière si aucune session, sinon synchronisation. */
  function init() {
    startSync();
    if (!session) showGate();
    else if (online()) {
      // Rafraîchit le profil et vérifie que la session est toujours valide
      api("me").then((me) => { prefsCache = { prefs: me.prefs, pushEnabled: me.pushEnabled }; pushProgress(); }).catch(() => { /* hors ligne */ });
    }
  }

  App.cloud = {
    get session() { return session; },
    online, api, errorText, sendCode, verifyCode, logout, continueLocally, showGate,
    pushProgress, buildSummary, onStatus: (fn) => statusListeners.add(fn), get status() { return status; },
    loadPrefs, savePrefs, testReminder, pushSupported, enablePush, disablePush, adminList, adminBlock, init,
  };
})();
