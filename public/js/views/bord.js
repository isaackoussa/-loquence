/* Tableau de bord : accueil, programme 30 jours, progression & badges. */
(() => {
  "use strict";
  const { $, $$, esc, store, history, todayKey, dayNumber, streak, bestStreak, plural, go } = App;

  const TYPE_LABEL = {
    twister: "Virelangue", speech: "Discours", breath: "Respiration", warmup: "Échauffement", reading: "Lecture",
    intonation: "Intonation", lesson: "Cours", quiz: "Quiz", game: "Jeu", interview: "Entretien", voice: "Voix", program: "Programme",
  };
  App.TYPE_LABEL = TYPE_LABEL;

  const wordOfDay = () => WORDS[dayNumber() % WORDS.length];
  const quoteOfDay = () => QUOTES[dayNumber() % QUOTES.length];
  App.wordHTML = (w) => `<p class="word-big">${esc(w.w)}</p>
    <p class="word-nature">${esc(w.n)}</p>
    <p>${esc(w.d)}</p>
    <p class="example">${esc(w.e)}</p>`;

  /* ---------- Séance du jour ---------- */

  function markDaily(key) {
    const d = store.get("daily", {});
    if (d.day !== todayKey()) { d.day = todayKey(); d.done = {}; }
    d.done[key] = true;
    store.set("daily", d);
  }
  App.markDaily = markDaily;

  function dailyDone() {
    const d = store.get("daily", {});
    const done = d.day === todayKey() ? { ...d.done } : {};
    const today = history().filter((h) => h.day === todayKey());
    if (today.filter((h) => h.type === "twister").length >= 3) done.twister = true;
    if (today.some((h) => h.type === "speech" || h.type === "interview")) done.speech = true;
    if (today.some((h) => h.type === "breath" || h.type === "warmup")) done.souffle = true;
    if (today.some((h) => h.type === "quiz" || h.type === "lesson")) done.vocab = true;
    return done;
  }

  /* ---------- Programme ---------- */

  const prog = () => store.get("program", { done: {} });
  function dayComplete(p, i) {
    const d = p.done[i] || {};
    return PROGRAM[i].tasks.every((_, k) => d[k]);
  }
  function currentDay() {
    const p = prog();
    const i = PROGRAM.findIndex((_, k) => !dayComplete(p, k));
    return i === -1 ? PROGRAM.length - 1 : i;
  }
  const completedDays = () => PROGRAM.filter((_, i) => dayComplete(prog(), i)).length;

  /* ---------- Accueil ---------- */

  App.view({
    id: "accueil", title: "Accueil", icon: "🏠", group: "bord",
    html: `
      <div class="hero">
        <p class="eyebrow" id="hello"></p>
        <h1>Parlez avec clarté, aisance et impact.</h1>
        <p>Échauffez votre voix, travaillez votre articulation, apprenez les techniques des grands orateurs et entraînez-vous : l’application analyse votre débit, vos tics de langage, vos pauses et l’expressivité de votre voix.</p>
      </div>
      <blockquote class="quote-card" id="home-quote"></blockquote>
      <div class="stats" id="home-stats"></div>
      <div class="grid-2">
        <div class="card program-card">
          <p class="eyebrow">Programme 30 jours</p>
          <div id="home-program"></div>
        </div>
        <div class="card">
          <p class="eyebrow">Séance express du jour</p>
          <ol class="daily" id="daily"></ol>
        </div>
      </div>
      <h2>Tous les exercices</h2>
      <div id="modules"></div>
      <div class="grid-2 mt">
        <div class="card"><p class="eyebrow">Mot du jour</p><div id="home-word"></div></div>
        <div class="card"><p class="eyebrow">Conseil du jour</p><p id="home-tip"></p></div>
      </div>
      <h2>Dernières activités</h2>
      <div id="history" class="history"></div>`,
    init(el) {
      $("#daily", el).addEventListener("click", (e) => {
        const li = e.target.closest("[data-go]");
        if (li) go(li.dataset.go);
      });
      $("#modules", el).innerHTML = App.GROUPS.filter(([g]) => g !== "bord" && g !== "reglages").map(([g, label]) => `
        <h3 class="group-title">${label}</h3>
        <div class="modules">${App.views.filter((v) => v.group === g).map((v) => `
          <a class="module" href="#${v.id}">
            <span class="module-icon" aria-hidden="true">${v.icon}</span>
            <span><b>${esc(v.title)}</b><small>${esc(v.desc || "")}</small></span>
          </a>`).join("")}</div>`).join("");
    },
    show(el) {
      const name = App.settings.get("name");
      const hour = new Date().getHours();
      $("#hello", el).textContent = `${hour < 18 ? "Bonjour" : "Bonsoir"}${name ? " " + name : ""} 👋`;
      const q = quoteOfDay();
      $("#home-quote", el).innerHTML = `« ${esc(q.t)} »<cite>${esc(q.a)}</cite>`;

      const h = history();
      const speeches = h.filter((x) => x.type === "speech" && x.wpm).slice(0, 5);
      const avg = (arr, k) => (arr.length ? arr.reduce((s, x) => s + x[k], 0) / arr.length : null);
      const sc = avg(h.filter((x) => x.type === "speech" && x.score != null).slice(0, 5), "score");
      const wpm = avg(speeches, "wpm");
      $("#home-stats", el).innerHTML = [
        [streak(), "jours d’affilée 🔥"],
        [h.length, "exercices réalisés"],
        [sc != null ? Math.round(sc) : "—", "score moyen de discours"],
        [wpm != null ? Math.round(wpm) : "—", "mots / minute (moy.)"],
      ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");

      const i = currentDay();
      const day = PROGRAM[i];
      const n = completedDays();
      $("#home-program", el).innerHTML = `
        <h3>Jour ${i + 1} · ${esc(day.t)}</h3>
        <div class="progress"><div style="width:${(n / PROGRAM.length) * 100}%"></div></div>
        <p class="muted small">${plural(n, "jour terminé", "jours terminés")} sur ${PROGRAM.length}</p>
        <ul class="plain">${day.tasks.map(([t]) => `<li>• ${esc(t)}</li>`).join("")}</ul>
        <a class="btn primary" href="#programme">Continuer le programme →</a>`;

      const done = dailyDone();
      const steps = [
        ["souffle", "souffle", "Respirer & s’échauffer", "Une respiration ou l’échauffement vocal"],
        ["twister", "articulation", "3 virelangues", "Articulez lentement, puis accélérez"],
        ["speech", "impro", "1 prise de parole", "Improvisez, débattez ou parlez librement"],
        ["vocab", "cours", "Apprendre", "Un cours ou un quiz"],
      ];
      $("#daily", el).innerHTML = steps.map(([k, tab, t, s], idx) => `
        <li data-go="${tab}" class="${done[k] ? "done" : ""}" tabindex="0">
          <span class="num">${done[k] ? "✓" : idx + 1}</span>
          <div><div class="d-title">${t}</div><div class="d-sub">${s}</div></div>
        </li>`).join("");

      $("#home-word", el).innerHTML = App.wordHTML(wordOfDay());
      $("#home-tip", el).textContent = TIPS[dayNumber() % TIPS.length];
      $("#history", el).innerHTML = h.length
        ? h.slice(0, 8).map((x) => `
          <div class="row">
            <span><b>${TYPE_LABEL[x.type] || x.type}</b> · ${esc(x.label || "")}</span>
            <span class="muted">${x.score != null ? `${Math.round(x.score)}${x.type === "twister" || x.type === "quiz" ? " %" : "/100"} · ` : ""}${new Date(x.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          </div>`).join("")
        : `<p class="muted">Aucun exercice pour l’instant. Commencez par le programme ou la séance express !</p>`;
    },
  });

  /* ---------- Programme ---------- */

  App.view({
    id: "programme", title: "Programme 30 jours", icon: "🗓️", group: "bord",
    desc: "Un parcours progressif, trois activités par jour",
    html: `
      <h1>Programme 30 jours</h1>
      <p class="lead">Un parcours progressif pour transformer votre prise de parole : les fondations, la voix, la structure, puis la persuasion. Trois activités par jour, environ 15 minutes. Cochez chaque activité une fois réalisée.</p>
      <div class="card">
        <div class="progress big"><div id="pg-bar"></div></div>
        <p class="muted small" id="pg-count"></p>
      </div>
      <div id="pg-days"></div>`,
    init(el) {
      el.addEventListener("change", (e) => {
        const cb = e.target.closest("input[data-day]");
        if (!cb) return;
        const p = prog();
        const d = (p.done[cb.dataset.day] ||= {});
        d[cb.dataset.task] = cb.checked;
        store.set("program", p);
        if (dayComplete(p, +cb.dataset.day) && cb.checked) {
          App.toast(`🎉 Jour ${+cb.dataset.day + 1} terminé !`);
          App.logActivity({ type: "program", label: `Jour ${+cb.dataset.day + 1} terminé` });
        }
        this.show(el);
      });
    },
    show(el) {
      const p = prog();
      const cur = currentDay();
      const n = completedDays();
      $("#pg-bar", el).style.width = (n / PROGRAM.length) * 100 + "%";
      $("#pg-count", el).textContent = `${plural(n, "jour terminé", "jours terminés")} sur ${PROGRAM.length}`;
      let week = 0;
      $("#pg-days", el).innerHTML = PROGRAM.map((day, i) => {
        const head = day.w !== week ? `<h2>${PROGRAM_WEEKS[day.w]}</h2>` : "";
        week = day.w;
        const complete = dayComplete(p, i);
        const d = p.done[i] || {};
        return `${head}
          <details class="card day ${complete ? "complete" : ""}" ${i === cur ? "open" : ""}>
            <summary><span class="num">${complete ? "✓" : i + 1}</span><span><b>Jour ${i + 1}</b> · ${esc(day.t)}</span></summary>
            <ul class="tasks">${day.tasks.map(([t, v], k) => `
              <li>
                <label class="check"><input type="checkbox" data-day="${i}" data-task="${k}" ${d[k] ? "checked" : ""}> ${esc(t)}</label>
                <a class="btn small ghost" href="#${v}">Y aller →</a>
              </li>`).join("")}</ul>
          </details>`;
      }).join("");
    },
  });

  /* ---------- Badges ---------- */

  const count = (h, fn) => h.filter(fn).length;
  const BADGES = [
    { id: "premier", i: "🌱", n: "Premier pas", d: "Réaliser un premier exercice", ok: (h) => h.length >= 1 },
    { id: "articulo", i: "👄", n: "Articulateur", d: "10 virelangues", ok: (h) => count(h, (x) => x.type === "twister") >= 10 },
    { id: "virtuose", i: "🎻", n: "Virtuose", d: "Un virelangue difficile à 100 %", ok: (h) => h.some((x) => x.type === "twister" && x.score === 100 && x.level === "difficile") },
    { id: "triple", i: "🔁", n: "Triple défi", d: "Un défi ×3 à 90 % ou plus", ok: (h) => h.some((x) => x.type === "twister" && x.triple && x.score >= 90) },
    { id: "orateur", i: "🎤", n: "Orateur", d: "5 prises de parole analysées", ok: (h) => count(h, (x) => x.type === "speech") >= 5 },
    { id: "tribun", i: "🏛️", n: "Tribun", d: "25 prises de parole analysées", ok: (h) => count(h, (x) => x.type === "speech") >= 25 },
    { id: "zerotic", i: "🧘", n: "Zéro tic", d: "Parler 1 minute sans aucun tic détecté", ok: (h) => h.some((x) => x.type === "speech" && x.fillers === 0 && x.duration >= 60 && x.words >= 80) },
    { id: "metronome", i: "⏱️", n: "Métronome", d: "Un discours d’une minute entre 120 et 160 mots/min", ok: (h) => h.some((x) => x.type === "speech" && x.duration >= 60 && x.wpm >= 120 && x.wpm <= 160) },
    { id: "excellence", i: "🏆", n: "Excellence", d: "Un score de discours de 85 ou plus", ok: (h) => h.some((x) => x.type === "speech" && x.score >= 85) },
    { id: "souffle", i: "🌬️", n: "Grand souffle", d: "5 séances de respiration ou d’échauffement", ok: (h) => count(h, (x) => x.type === "breath" || x.type === "warmup") >= 5 },
    { id: "lecteur", i: "📜", n: "Lecteur", d: "5 lectures guidées", ok: (h) => count(h, (x) => x.type === "reading") >= 5 },
    { id: "comedien", i: "🎭", n: "Comédien", d: "10 exercices d’intonation", ok: (h) => count(h, (x) => x.type === "intonation") >= 10 },
    { id: "erudit", i: "📚", n: "Érudit", d: "Lire 10 cours", ok: () => Object.keys(store.get("lessons", {})).length >= 10 },
    { id: "quiz", i: "🧠", n: "Sans faute", d: "Un quiz à 100 %", ok: (h) => h.some((x) => x.type === "quiz" && x.score === 100) },
    { id: "debat", i: "⚖️", n: "Débatteur", d: "3 plaidoiries ou réfutations", ok: (h) => count(h, (x) => x.type === "speech" && (x.mode === "debat" || x.mode === "refutation")) >= 3 },
    { id: "conteur", i: "📖", n: "Conteur", d: "3 histoires racontées", ok: (h) => count(h, (x) => x.type === "speech" && x.mode === "histoire") >= 3 },
    { id: "candidat", i: "💼", n: "Candidat", d: "Terminer une simulation d’entretien", ok: (h) => h.some((x) => x.type === "interview") },
    { id: "joueur", i: "🎲", n: "Joueur", d: "5 parties de jeux de parole", ok: (h) => count(h, (x) => x.type === "game") >= 5 },
    { id: "serie3", i: "🔥", n: "En rythme", d: "3 jours d’affilée", ok: () => bestStreak() >= 3 },
    { id: "serie7", i: "⚡", n: "Une semaine", d: "7 jours d’affilée", ok: () => bestStreak() >= 7 },
    { id: "serie30", i: "💎", n: "Discipline", d: "30 jours d’affilée", ok: () => bestStreak() >= 30 },
    { id: "semaine", i: "📅", n: "Semaine accomplie", d: "7 jours du programme terminés", ok: () => completedDays() >= 7 },
    { id: "diplome", i: "🎓", n: "Diplômé", d: "Terminer le programme 30 jours", ok: () => completedDays() >= PROGRAM.length },
  ];

  function checkBadges(silent) {
    const h = history();
    const got = new Set(store.get("badges", []));
    const fresh = BADGES.filter((b) => !got.has(b.id) && b.ok(h));
    if (!fresh.length) return;
    fresh.forEach((b) => got.add(b.id));
    store.set("badges", [...got]);
    if (!silent) App.toast(`${fresh[0].i} Badge débloqué : <b>${esc(fresh[0].n)}</b>${fresh.length > 1 ? ` (+${fresh.length - 1})` : ""}`);
  }
  App.onActivity(() => checkBadges(false));

  /* ---------- Graphiques ---------- */

  /* Courbe simple (une série) avec bande de référence optionnelle et info-bulle. */
  function lineChart(points, { min, max, band, unit = "", label }) {
    if (points.length < 2) return `<p class="muted small">Encore ${2 - points.length} séance(s) avant d’afficher la courbe.</p>`;
    const W = 600, H = 200, P = { l: 48, r: 14, t: 14, b: 14 };
    const x = (i) => P.l + (i / (points.length - 1)) * (W - P.l - P.r);
    const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const ticks = [min, (min + max) / 2, max];
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(App.clamp(p.v, min, max)).toFixed(1)}`).join("");
    return `<div class="chart" data-unit="${esc(unit)}">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
        ${band ? `<rect class="band" x="${P.l}" y="${y(band[1])}" width="${W - P.l - P.r}" height="${y(band[0]) - y(band[1])}"/>` : ""}
        ${ticks.map((t) => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${P.l - 8}" y="${y(t) + 7}" text-anchor="end">${Math.round(t)}</text>`).join("")}
        <path class="line" d="${path}"/>
        <circle class="last" cx="${x(points.length - 1)}" cy="${y(App.clamp(points[points.length - 1].v, min, max))}" r="4"/>
        ${points.map((p, i) => `<rect class="hit" x="${x(i) - (W - P.l - P.r) / points.length / 2}" y="0" width="${(W - P.l - P.r) / points.length}" height="${H}" data-tip="${esc(p.tip)}" data-cx="${x(i)}" data-cy="${y(App.clamp(p.v, min, max))}"/>`).join("")}
        <circle class="hover-dot" r="5" cx="-10" cy="-10"/>
      </svg>
      <div class="chart-tip" hidden></div>
    </div>`;
  }

  function bindCharts(root) {
    $$(".chart", root).forEach((c) => {
      const tip = $(".chart-tip", c), dot = $(".hover-dot", c), svg = $("svg", c);
      if (!svg) return;
      svg.addEventListener("pointermove", (e) => {
        const r = e.target.closest(".hit");
        if (!r) return;
        dot.setAttribute("cx", r.dataset.cx);
        dot.setAttribute("cy", r.dataset.cy);
        tip.hidden = false;
        tip.textContent = r.dataset.tip;
        const box = svg.getBoundingClientRect();
        const px = (r.dataset.cx / 600) * box.width;
        tip.style.left = App.clamp(px, 60, box.width - 60) + "px";
        tip.style.top = (r.dataset.cy / 200) * box.height - 8 + "px";
      });
      svg.addEventListener("pointerleave", () => { tip.hidden = true; dot.setAttribute("cx", -10); });
    });
  }

  /* Calendrier d'activité sur 16 semaines (une teinte, du clair au foncé). */
  function heatmap() {
    const counts = {};
    history().forEach((x) => { counts[x.day] = (counts[x.day] || 0) + 1; });
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 16 * 7 + 1);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const cells = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = todayKey(d);
      const n = counts[k] || 0;
      const lvl = n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4;
      cells.push(`<span class="hm l${lvl}" title="${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} : ${plural(n, "exercice")}"></span>`);
    }
    return `<div class="heatmap">${cells.join("")}</div>
      <div class="hm-legend muted small">Moins <span class="hm l0"></span><span class="hm l1"></span><span class="hm l2"></span><span class="hm l3"></span><span class="hm l4"></span> Plus</div>`;
  }

  App.view({
    id: "progression", title: "Progression & badges", icon: "📈", group: "bord",
    desc: "Courbes, calendrier d’activité et récompenses",
    html: `
      <h1>Progression</h1>
      <p class="lead">Suivez votre évolution séance après séance et débloquez des badges.</p>
      <div class="stats" id="pr-stats"></div>
      <div class="card"><h3>Activité (16 dernières semaines)</h3><div id="pr-heat"></div></div>
      <div class="grid-2">
        <div class="card"><h3>Score des discours</h3><p class="muted small">Sur 100, 20 dernières prises de parole.</p><div id="pr-score"></div></div>
        <div class="card"><h3>Débit (mots/min)</h3><p class="muted small">La bande indique la zone idéale (120 à 160).</p><div id="pr-wpm"></div></div>
        <div class="card"><h3>Tics de langage par minute</h3><p class="muted small">Plus c’est bas, mieux c’est.</p><div id="pr-fpm"></div></div>
        <div class="card"><h3>Précision des virelangues</h3><p class="muted small">En %, 20 derniers essais.</p><div id="pr-tw"></div></div>
      </div>
      <h2>Badges</h2>
      <div class="badges" id="pr-badges"></div>
      <h2>Répartition</h2>
      <div class="card"><div id="pr-types" class="types"></div></div>`,
    show(el) {
      checkBadges(true);
      const h = history();
      const fmtD = (x) => new Date(x.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      const series = (type, key, filter = () => true) => h.filter((x) => x.type === type && x[key] != null && filter(x)).slice(0, 20).reverse();
      const sp = series("speech", "score");
      const wpm = series("speech", "wpm");
      const fpm = series("speech", "fpm");
      const tw = series("twister", "score");
      const mins = Math.round(h.reduce((s, x) => s + (x.duration || 0), 0) / 60);
      $("#pr-stats", el).innerHTML = [
        [App.streak(), "jours d’affilée"],
        [bestStreak(), "meilleure série"],
        [App.activeDays().size, "jours actifs"],
        [h.length, "exercices"],
        [mins, "minutes de parole enregistrées"],
        [`${store.get("badges", []).length}/${BADGES.length}`, "badges"],
      ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");
      $("#pr-heat", el).innerHTML = heatmap();
      $("#pr-score", el).innerHTML = lineChart(sp.map((x) => ({ v: x.score, tip: `${fmtD(x)} · ${x.score}/100` })), { min: 0, max: 100, label: "Score des discours" });
      $("#pr-wpm", el).innerHTML = lineChart(wpm.map((x) => ({ v: x.wpm, tip: `${fmtD(x)} · ${x.wpm} mots/min` })), { min: 60, max: 220, band: [120, 160], label: "Débit" });
      $("#pr-fpm", el).innerHTML = lineChart(fpm.map((x) => ({ v: x.fpm, tip: `${fmtD(x)} · ${x.fpm.toFixed(1)} tics/min` })), { min: 0, max: Math.max(6, ...fpm.map((x) => Math.ceil(x.fpm))), label: "Tics par minute" });
      $("#pr-tw", el).innerHTML = lineChart(tw.map((x) => ({ v: x.score, tip: `${fmtD(x)} · ${x.score} %` })), { min: 0, max: 100, label: "Précision des virelangues" });
      bindCharts(el);
      const got = new Set(store.get("badges", []));
      $("#pr-badges", el).innerHTML = BADGES.map((b) => `
        <div class="badge ${got.has(b.id) ? "got" : ""}" title="${esc(b.d)}">
          <span class="badge-icon">${got.has(b.id) ? b.i : "🔒"}</span>
          <b>${esc(b.n)}</b><small>${esc(b.d)}</small>
        </div>`).join("");
      const byType = {};
      h.forEach((x) => { byType[x.type] = (byType[x.type] || 0) + 1; });
      const maxT = Math.max(1, ...Object.values(byType));
      $("#pr-types", el).innerHTML = Object.keys(byType).length
        ? Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => `
          <div class="type-row"><span>${TYPE_LABEL[t] || t}</span><div class="type-bar"><div style="width:${(n / maxT) * 100}%"></div></div><b>${n}</b></div>`).join("")
        : `<p class="muted">Aucune activité pour l’instant.</p>`;
    },
  });
})();
