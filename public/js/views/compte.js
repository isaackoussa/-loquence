/* Compte, rappels & notifications, console admin. */
(() => {
  "use strict";
  const { $, $$, esc, store } = App;

  const DAYS = [[1, "L", "lundi"], [2, "M", "mardi"], [3, "M", "mercredi"], [4, "J", "jeudi"], [5, "V", "vendredi"], [6, "S", "samedi"], [0, "D", "dimanche"]];
  const STATUS = { idle: "", saving: "Sauvegarde…", saved: "✓ Progression sauvegardée en ligne", offline: "⚠️ Hors ligne : la sauvegarde reprendra automatiquement" };

  App.view({
    id: "compte", title: "Compte & rappels", icon: "🔔", group: "reglages",
    html: `
      <h1>Compte &amp; rappels</h1>
      <div class="card" id="ac-account"></div>
      <div class="card" id="ac-reminders"></div>`,
    init(el) {
      App.cloud.onStatus((s) => { const x = $("#ac-sync", el); if (x) x.textContent = STATUS[s] || ""; });
      el.addEventListener("click", async (e) => {
        const act = e.target.closest("[data-act]");
        if (!act) return;
        const a = act.dataset.act;
        if (a === "logout") {
          await App.cloud.logout();
          App.cloud.showGate();
        } else if (a === "login") {
          await App.cloud.logout();
          App.cloud.showGate();
        } else if (a === "sync") {
          await App.cloud.pushProgress(true);
        }
      });
    },
    show(el) {
      const s = App.cloud.session;
      const acc = $("#ac-account", el);
      if (App.cloud.online()) {
        acc.innerHTML = `
          <h3>Mon compte</h3>
          <p>Connecté avec <b>${esc(s.email)}</b></p>
          <p class="muted small" id="ac-sync">${STATUS[App.cloud.status] || "Votre progression est sauvegardée en ligne et vous suit sur tous vos appareils."}</p>
          <div class="actions">
            <button class="btn" data-act="sync">☁️ Sauvegarder maintenant</button>
            <button class="btn ghost" data-act="logout">Se déconnecter</button>
          </div>`;
        renderReminders(el);
      } else {
        acc.innerHTML = `
          <h3>Mon compte</h3>
          <p>Vous utilisez l’application <b>sans compte</b> : votre progression reste sur cet appareil.</p>
          <p class="muted small">Avec un compte (e-mail + code), votre progression est sauvegardée en ligne et vous recevez des rappels par notification et par e-mail.</p>
          <div class="actions"><button class="btn primary" data-act="login">Se connecter avec mon e-mail</button></div>`;
        $("#ac-reminders", el).innerHTML = `
          <h3>Rappels &amp; notifications</h3>
          <p class="muted">Les rappels, le bilan hebdomadaire et les e-mails de paliers sont disponibles une fois connecté.</p>`;
      }
    },
  });

  async function renderReminders(el) {
    const box = $("#ac-reminders", el);
    box.innerHTML = `<h3>Rappels &amp; notifications</h3><p class="muted">Chargement…</p>`;
    let state;
    try {
      state = await App.cloud.loadPrefs();
    } catch (e) {
      box.innerHTML = `<h3>Rappels &amp; notifications</h3><p class="gate-error">${esc(App.cloud.errorText(e))}</p>`;
      return;
    }
    const draw = () => {
      const p = state.prefs;
      const chosen = DAYS.filter(([d]) => p.days.includes(d));
      box.innerHTML = `
        <h3>Rappels &amp; notifications</h3>
        <p class="muted small">Un rappel aux jours et à l’heure choisis, <b>seulement si vous n’avez pas encore fait d’exercice ce jour-là</b>.</p>
        <div class="field"><span class="muted small">Jours</span>
          <div class="days">${DAYS.map(([d, l, full]) => `<button class="day-btn ${p.days.includes(d) ? "on" : ""}" data-day="${d}" aria-pressed="${p.days.includes(d)}" title="${full}">${l}</button>`).join("")}</div>
          <div class="chips">
            <button class="chip" data-preset="all">Tous les jours</button>
            <button class="chip" data-preset="week">En semaine</button>
            <button class="chip" data-preset="135">3 fois par semaine</button>
          </div>
        </div>
        <label class="field"><span class="muted small">Heure</span><input type="time" id="rm-time" value="${esc(p.time)}"></label>
        <p class="small">${chosen.length ? `Rappel le ${chosen.map(([, , f]) => f).join(", ")} à ${esc(p.time)}.` : "Aucun jour choisi : pas de rappel."}</p>
        <div class="toggles">
          ${toggle("push", "📲 Notification sur cet appareil", App.cloud.pushSupported() ? (state.pushEnabled ? "Activée sur un appareil." : "Autorisez les notifications pour recevoir le rappel sur votre téléphone ou ordinateur.") : "Non disponible dans ce navigateur. Sur iPhone : ajoutez d’abord l’app à l’écran d’accueil.", p.push && state.pushEnabled, !App.cloud.pushSupported())}
          ${toggle("email", "✉️ Rappel par e-mail", "Un e-mail avec votre série, votre score moyen et le jour du programme.", p.email)}
          ${toggle("weekly", "📊 Bilan hebdomadaire", "Chaque dimanche : jours actifs, exercices, score moyen, temps de parole.", p.weekly)}
          ${toggle("milestones", "🏆 E-mails de paliers", "Félicitations à 7, 30, 100 jours de série, 10 et 50 discours, programme terminé…", p.milestones)}
        </div>
        <div class="actions"><button class="btn" id="rm-test">📨 Envoyer un rappel de test</button></div>
        <p class="muted small" id="rm-msg"></p>`;
    };
    const save = async (patch) => {
      try {
        state = await App.cloud.savePrefs(patch);
        draw();
        App.toast("✓ Rappels enregistrés", 1500);
      } catch (e) {
        App.toast(esc(App.cloud.errorText(e)));
      }
    };
    box.onclick = async (e) => {
      const day = e.target.closest("[data-day]");
      if (day) {
        const d = +day.dataset.day, days = state.prefs.days;
        return save({ days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d] });
      }
      const preset = e.target.closest("[data-preset]");
      if (preset) return save({ days: { all: [0, 1, 2, 3, 4, 5, 6], week: [1, 2, 3, 4, 5], 135: [1, 3, 5] }[preset.dataset.preset] });
      const t = e.target.closest("[data-toggle]");
      if (t && !t.disabled) {
        const k = t.dataset.toggle;
        if (k === "push") {
          const on = state.prefs.push && state.pushEnabled;
          try {
            if (on) { await App.cloud.disablePush(); state = await App.cloud.loadPrefs(); }
            else {
              const r = await App.cloud.enablePush();
              if (r === "denied") App.toast("Notifications refusées : autorisez-les dans les réglages du navigateur.");
              if (r === "unsupported") App.toast("Notifications non disponibles dans ce navigateur.");
            }
            state = await App.cloud.loadPrefs();
            draw();
          } catch (ex) {
            App.toast(esc(App.cloud.errorText(ex)));
          }
          return;
        }
        return save({ [k]: !state.prefs[k] });
      }
      if (e.target.closest("#rm-test")) {
        const msg = $("#rm-msg", box);
        msg.textContent = "Envoi…";
        try {
          const r = await App.cloud.testReminder();
          const parts = [];
          if (r.push) parts.push(`notification : ${r.push === "ok" ? "envoyée ✓" : r.push === "none" ? "aucun appareil abonné" : "échec"}`);
          if (r.email) parts.push(`e-mail : ${r.email === "ok" ? "envoyé ✓" : "échec"}`);
          msg.textContent = parts.length ? parts.join(" · ") : "Activez au moins un canal (notification ou e-mail).";
        } catch (ex) {
          msg.textContent = App.cloud.errorText(ex);
        }
      }
    };
    box.onchange = (e) => {
      if (e.target.id === "rm-time" && /^\d{2}:\d{2}$/.test(e.target.value)) save({ time: e.target.value });
    };
    draw();
  }

  function toggle(key, title, desc, on, disabled) {
    return `<button class="toggle-row" data-toggle="${key}" role="switch" aria-checked="${!!on}" ${disabled ? "disabled" : ""}>
      <span><b>${title}</b><small>${esc(desc)}</small></span>
      <span class="switch ${on ? "on" : ""}" aria-hidden="true"></span>
    </button>`;
  }

  /* ---------- Console admin (accessible via #admin, hors menu) ---------- */

  App.view({
    id: "admin", title: "Console admin", icon: "🛡️", group: "admin",
    html: `
      <h1>Console admin</h1>
      <form class="card toolbar" id="ad-form">
        <input type="password" id="ad-key" placeholder="Clé admin (ADMIN_KEY)" autocomplete="off" aria-label="Clé admin">
        <button class="btn primary">Afficher les utilisateurs</button>
      </form>
      <p class="muted" id="ad-msg"></p>
      <div class="table-wrap"><table class="table" id="ad-table"></table></div>`,
    init(el) {
      const q = (s) => $(s, el);
      let key = "";
      try { key = sessionStorage.getItem("eloquence.admin") || ""; } catch { /* ignoré */ }
      q("#ad-key").value = key;
      async function load() {
        key = q("#ad-key").value;
        try { sessionStorage.setItem("eloquence.admin", key); } catch { /* ignoré */ }
        q("#ad-msg").textContent = "Chargement…";
        try {
          const users = await App.cloud.adminList(key);
          const fmt = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" }) : "—");
          q("#ad-msg").textContent = `${users.length} utilisateur(s)`;
          q("#ad-table").innerHTML = `
            <thead><tr><th>E-mail</th><th>Prénom</th><th>Série</th><th>Exercices</th><th>Discours</th><th>Score moy.</th><th>Programme</th><th>Rappels</th><th>Dernière visite</th><th></th></tr></thead>
            <tbody>${users.map((u) => {
              const s = u.summary || {};
              return `<tr class="${u.blocked ? "blocked" : ""}">
                <td>${esc(u.email)}</td><td>${esc(s.name || "—")}</td><td>${s.streak ?? "—"}</td><td>${s.exercises ?? "—"}</td>
                <td>${s.speeches ?? "—"}</td><td>${s.avgScore ?? "—"}</td><td>${s.programDone != null ? s.programDone + "/30" : "—"}</td>
                <td>${u.reminders.days.length ? `${u.reminders.days.length} j · ${esc(u.reminders.time)}${u.reminders.push ? " 📲" : ""}${u.reminders.email ? " ✉️" : ""}` : "—"}</td>
                <td>${fmt(u.lastSeen)}</td>
                <td><button class="btn small ghost" data-block="${esc(u.email)}" data-v="${u.blocked ? "0" : "1"}">${u.blocked ? "Débloquer" : "Bloquer"}</button></td>
              </tr>`;
            }).join("")}</tbody>`;
        } catch (e) {
          q("#ad-msg").textContent = e.code === "unauthorized" ? "Clé incorrecte." : App.cloud.errorText(e);
          q("#ad-table").innerHTML = "";
        }
      }
      q("#ad-form").addEventListener("submit", (e) => { e.preventDefault(); load(); });
      q("#ad-table").addEventListener("click", async (e) => {
        const b = e.target.closest("[data-block]");
        if (!b) return;
        await App.cloud.adminBlock(key, b.dataset.block, b.dataset.v === "1");
        load();
      });
      if (key) load();
    },
  });
})();
