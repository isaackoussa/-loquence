/* Jeux de parole : mots imposés, tabou, une minute sans hésiter, alphabet. */
(() => {
  "use strict";
  const { $, esc, pick, pickOther, shuffle, fmtTime, segmented, logActivity } = App;

  const GAMES = {
    mots: { n: "Mots imposés", i: "🧩", d: "Parlez 1 minute en plaçant les 3 mots imposés. Chaque mot reconnu s’allume." },
    tabou: { n: "Tabou", i: "🚫", d: "Faites deviner le mot (à un proche, ou à un public imaginaire) sans prononcer les mots interdits ni le mot lui-même. Enchaînez un maximum de cartes en 90 secondes." },
    minute: { n: "Une minute sans hésiter", i: "⏱️", d: "Parlez 1 minute sur le sujet, sans tic de langage, sans silence de plus de 3 secondes et sans répéter trois fois le même mot. Chaque faute coûte 10 points." },
    alphabet: { n: "L’alphabet de l’orateur", i: "🔤", d: "Sur le thème donné, dites une phrase commençant par chaque lettre, dans l’ordre. La lettre avance quand votre phrase est reconnue ; bloqué ? Passez." },
  };
  const LETTERS = "ABCDEFGHIJLMNOPRSTUV".split("");

  App.view({
    id: "jeux", title: "Jeux de parole", icon: "🎲", group: "parole",
    desc: "Mots imposés, Tabou, une minute sans hésiter, alphabet",
    html: `
      <h1>Jeux de parole</h1>
      <p class="lead">Des défis ludiques pour gagner en fluidité, en vocabulaire et en répartie. Tous utilisent la reconnaissance vocale en direct.</p>
      ${App.SRWarning()}
      <div class="segmented" id="gm-tabs">${Object.entries(GAMES).map(([k, g], i) => `<button data-g="${k}" class="${i ? "" : "active"}">${g.i} ${g.n}</button>`).join("")}</div>
      <div class="card game">
        <p class="muted" id="gm-desc"></p>
        <div id="gm-board"></div>
        <div class="game-bar">
          <div class="timer big" id="gm-timer">1:00</div>
          <div class="meter"><div id="gm-meter"></div></div>
        </div>
        <div class="actions center">
          <button class="btn primary" id="gm-start">▶️ Jouer</button>
          <button class="btn" id="gm-action" hidden></button>
          <button class="btn ghost" id="gm-new">🎲 Nouveau tirage</button>
        </div>
        <div class="transcript small" id="gm-live"></div>
        <div id="gm-result"></div>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      const gm = { game: "mots", session: null, state: null };

      /* Préparation de chaque jeu. */
      const setup = {
        mots: () => ({ words: shuffle(RANDOM_WORDS).slice(0, 3), found: new Set(), time: 60 }),
        tabou: () => ({ card: pick(TABOO), cards: 0, faults: 0, time: 90, seen: new Set() }),
        minute: () => ({ subject: pick(MINUTE_SUBJECTS), faults: [], counts: {}, time: 60 }),
        alphabet: () => ({ topic: pick(ALPHABET_TOPICS), idx: 0, skipped: 0, time: 180 }),
      };

      function board() {
        const s = gm.state;
        let html = "";
        if (gm.game === "mots") {
          html = `<div class="word-chips">${s.words.map((w) => `<span class="big-chip ${s.found.has(w) ? "ok" : ""}">${s.found.has(w) ? "✓ " : ""}${esc(w)}</span>`).join("")}</div>
            <p class="muted small center-text">Sujet libre : racontez une histoire, décrivez une journée, inventez une publicité…</p>`;
        } else if (gm.game === "tabou") {
          html = `<div class="taboo-card"><b>${esc(s.card.w)}</b><ul>${s.card.f.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>
            <p class="center-text"><b>${s.cards}</b> carte(s) décrite(s) · <b>${s.faults}</b> faute(s)</p>`;
        } else if (gm.game === "minute") {
          html = `<p class="impro-topic">Parlez de : <b>${esc(s.subject)}</b></p>
            <p class="center-text">Fautes : <b>${s.faults.length}</b>${s.faults.length ? ` <span class="muted small">(${s.faults.slice(-3).map(esc).join(", ")})</span>` : ""}</p>`;
        } else {
          html = `<p class="center-text muted">Thème : <b>${esc(s.topic)}</b></p>
            <div class="alphabet">${LETTERS.map((l, i) => `<span class="${i < s.idx ? "done" : i === s.idx ? "now" : ""}">${l}</span>`).join("")}</div>`;
        }
        q("#gm-board").innerHTML = html;
      }

      function reset() {
        stop(true);
        gm.state = setup[gm.game]();
        q("#gm-desc").textContent = GAMES[gm.game].d;
        q("#gm-timer").textContent = fmtTime(gm.state.time);
        q("#gm-result").innerHTML = "";
        q("#gm-live").textContent = "";
        const act = q("#gm-action");
        act.hidden = !(gm.game === "tabou" || gm.game === "alphabet");
        act.textContent = gm.game === "tabou" ? "✅ Carte suivante" : "⏭️ Passer la lettre";
        act.disabled = true;
        board();
      }

      /* Réactions à la parole reconnue. */
      function onText(finals, interim) {
        const s = gm.state;
        const all = (finals.join(" ") + " " + interim).trim();
        q("#gm-live").textContent = all.slice(-220);
        if (gm.game === "mots") {
          s.words.forEach((w) => { if (!s.found.has(w) && App.contains(all, w)) { s.found.add(w); App.toast(`✓ « ${esc(w)} » placé !`, 1500); } });
          board();
          if (s.found.size === s.words.length) stop();
        }
      }
      function onFinal(t) {
        const s = gm.state;
        if (gm.game === "tabou") {
          const bad = [s.card.w, ...s.card.f].filter((w) => App.contains(t, w) && !s.seen.has(t + w));
          if (bad.length) {
            bad.forEach((w) => s.seen.add(t + w));
            s.faults += bad.length;
            gm.session.beep(180);
            App.toast(`🚫 Mot interdit : « ${esc(bad[0])} »`, 1800);
            board();
          }
        } else if (gm.game === "minute") {
          const toks = App.tokens(t);
          const f = App.countFillers(toks);
          Object.entries(f.found).forEach(([w, n]) => { for (let i = 0; i < n; i++) s.faults.push(`tic « ${w} »`); });
          toks.filter((w) => w.length > 3 && !STOPWORDS.has(w)).forEach((w) => {
            s.counts[w] = (s.counts[w] || 0) + 1;
            if (s.counts[w] === 3) s.faults.push(`répétition « ${w} »`);
          });
          if (f.total) gm.session.beep();
          board();
        } else if (gm.game === "alphabet") {
          const first = App.norm(t).charAt(0).toUpperCase();
          if (first === LETTERS[s.idx]) {
            s.idx++;
            board();
            if (s.idx >= LETTERS.length) stop();
          }
        }
      }

      async function start() {
        if (gm.session) { stop(); return; }
        if (gm.state.done) reset();
        const s = new App.SpeechSession({
          onTranscript: onText,
          onFinal,
          onLevel: (rms) => { q("#gm-meter").style.width = App.clamp(rms * 500, 0, 100) + "%"; },
        });
        if (!(await s.start())) { q("#gm-result").innerHTML = `<p class="muted">${esc(s.error)}</p>`; return; }
        gm.session = s;
        gm.lastPauses = 0;
        q("#gm-start").textContent = "⏹️ Arrêter";
        q("#gm-start").classList.add("recording");
        q("#gm-action").disabled = false;
        gm.clock = setInterval(() => {
          const left = gm.state.time - s.elapsed;
          q("#gm-timer").textContent = fmtTime(Math.max(0, left));
          if (gm.game === "minute" && s.pauses.length > gm.lastPauses) {
            const longOnes = s.pauses.slice(gm.lastPauses).filter((p) => p >= 3000).length;
            for (let i = 0; i < longOnes; i++) gm.state.faults.push("silence trop long");
            gm.lastPauses = s.pauses.length;
            if (longOnes) board();
          }
          if (left <= 0) stop();
        }, 200);
      }

      async function stop(silent) {
        const s = gm.session;
        if (!s) return;
        gm.session = null;
        clearInterval(gm.clock);
        q("#gm-start").textContent = "▶️ Rejouer";
        q("#gm-start").classList.remove("recording");
        q("#gm-action").disabled = true;
        q("#gm-meter").style.width = "0";
        if (silent) { s.cancel(); return; }
        const r = await s.stop();
        const st = gm.state;
        st.done = true;
        let score, msg;
        if (gm.game === "mots") {
          score = Math.round((st.found.size / st.words.length) * 100);
          msg = st.found.size === 3 ? `Bravo ! Les 3 mots placés en ${fmtTime(r.duration)}.` : `${st.found.size} mot(s) sur 3 reconnu(s). Articulez bien les mots imposés.`;
        } else if (gm.game === "tabou") {
          score = Math.max(0, st.cards * 20 - st.faults * 10);
          msg = `${st.cards} carte(s) décrite(s), ${st.faults} faute(s). Le Tabou développe la reformulation et la richesse du vocabulaire.`;
        } else if (gm.game === "minute") {
          const long = r.pauses.slice(gm.lastPauses).filter((p) => p >= 3000).length;
          for (let i = 0; i < long; i++) st.faults.push("silence trop long");
          score = Math.max(0, 100 - st.faults.length * 10);
          msg = st.faults.length ? `Fautes : ${st.faults.map(esc).join(", ")}.` : "Parfait : une minute fluide, sans hésitation ni répétition !";
        } else {
          score = Math.round((st.idx / LETTERS.length) * 100);
          msg = `${st.idx} lettre(s) sur ${LETTERS.length} en ${fmtTime(r.duration)}${st.skipped ? `, ${st.skipped} passée(s)` : ""}.`;
        }
        board();
        q("#gm-result").innerHTML = `
          <div class="score-line"><h3>Résultat</h3><span class="score-big">${score}<small class="muted">/100</small></span></div>
          <p>${msg}</p>
          ${r.audioUrl ? `<audio controls src="${r.audioUrl}"></audio>` : ""}`;
        logActivity({ type: "game", score, label: GAMES[gm.game].n, duration: Math.round(r.duration) });
      }

      q("#gm-action").addEventListener("click", () => {
        const s = gm.state;
        if (gm.game === "tabou") {
          s.cards++;
          s.card = pickOther(TABOO, s.card);
          board();
        } else if (gm.game === "alphabet") {
          s.idx++;
          s.skipped++;
          board();
          if (s.idx >= LETTERS.length) stop();
        }
      });
      segmented(q("#gm-tabs"), (d) => { gm.game = d.g; reset(); });
      q("#gm-start").addEventListener("click", start);
      q("#gm-new").addEventListener("click", reset);
      q("#gm-start").disabled = !App.SR;
      this.hide = () => stop(true);
      reset();
    },
  });
})();
