/* Voix & corps : souffle, articulation, analyse de la voix, lecture guidée. */
(() => {
  "use strict";
  const { $, $$, esc, store, pick, pickOther, fmtTime, segmented, speak, logActivity, SR } = App;

  /* ---------- Souffle & échauffement ---------- */

  App.view({
    id: "souffle", title: "Souffle & échauffement", icon: "🌬️", group: "voix",
    desc: "Respirations guidées et échauffement vocal",
    html: `
      <h1>Souffle &amp; échauffement</h1>
      <p class="lead">Une voix posée commence par une respiration maîtrisée. Respirez par le ventre, épaules relâchées.</p>
      <div class="card breath-card">
        <div class="segmented" id="br-pattern"></div>
        <p class="muted small" id="br-desc"></p>
        <div class="breath-stage"><div class="breath-circle" id="br-circle"><span id="br-label">Prêt ?</span></div></div>
        <div class="muted" id="br-count"></div>
        <div class="actions center">
          <button class="btn primary" id="br-toggle">Commencer</button>
          <label class="check"><input type="checkbox" id="br-voice"> Guidage vocal</label>
        </div>
      </div>
      <div class="card">
        <h3>Échauffement vocal guidé</h3>
        <p class="muted">Cinq minutes avant une prise de parole pour réveiller le corps, la voix et les articulateurs.</p>
        <ol class="warmup" id="wu-list"></ol>
        <div class="actions">
          <button class="btn primary" id="wu-start">Lancer l’échauffement</button>
          <button class="btn ghost" id="wu-skip" hidden>Étape suivante →</button>
          <span class="timer" id="wu-timer"></span>
        </div>
      </div>`,
    init(el) {
      const br = { pattern: BREATH_PATTERNS[0], running: false, timers: [], started: 0 };
      $("#br-pattern", el).innerHTML = BREATH_PATTERNS.map((p, i) => `<button data-i="${i}" class="${i ? "" : "active"}">${p.name}</button>`).join("");
      $("#br-desc", el).textContent = br.pattern.desc;
      segmented($("#br-pattern", el), (d) => {
        stop();
        br.pattern = BREATH_PATTERNS[+d.i];
        $("#br-desc", el).textContent = br.pattern.desc;
      });
      function stop(completed) {
        br.timers.forEach(clearTimeout);
        br.timers = [];
        if (br.running && (completed || performance.now() - br.started > 60000)) {
          logActivity({ type: "breath", label: br.pattern.name, duration: (performance.now() - br.started) / 1000 });
        }
        br.running = false;
        const c = $("#br-circle", el);
        c.style.transitionDuration = "1s";
        c.style.transform = "scale(1)";
        $("#br-label", el).textContent = completed ? "Bravo 🌿" : "Prêt ?";
        $("#br-count", el).textContent = "";
        $("#br-toggle", el).textContent = "Commencer";
      }
      function start() {
        br.running = true;
        br.started = performance.now();
        $("#br-toggle", el).textContent = "Arrêter";
        const { steps, cycles } = br.pattern;
        let cycle = 0, step = 0;
        const c = $("#br-circle", el);
        const run = () => {
          if (!br.running) return;
          if (step >= steps.length) { step = 0; cycle++; }
          if (cycle >= cycles) { stop(true); return; }
          const [label, secs, scale] = steps[step];
          if ($("#br-voice", el).checked) speak(label.replace("…", ""), 0.8);
          c.style.transitionDuration = secs + "s";
          c.style.transform = `scale(${scale})`;
          let left = secs;
          $("#br-label", el).textContent = `${label} · ${left}`;
          $("#br-count", el).textContent = `Cycle ${cycle + 1} / ${cycles}`;
          const tick = () => {
            left--;
            if (left > 0 && br.running) {
              $("#br-label", el).textContent = `${label} · ${left}`;
              br.timers.push(setTimeout(tick, 1000));
            }
          };
          br.timers.push(setTimeout(tick, 1000));
          br.timers.push(setTimeout(() => { step++; run(); }, secs * 1000));
        };
        run();
      }
      $("#br-toggle", el).addEventListener("click", () => (br.running ? stop() : start()));
      this.hide = () => { if (br.running) stop(); };

      const wu = { idx: -1, timer: null, left: 0 };
      const render = () => {
        $("#wu-list", el).innerHTML = WARMUP.map((s, i) => `
          <li class="${i < wu.idx ? "done" : i === wu.idx ? "current" : ""}">
            <b>${esc(s.t)}</b> <span class="muted small">(${s.s} s)</span>
            <small>${esc(s.d)}</small>
          </li>`).join("");
      };
      function next() {
        clearInterval(wu.timer);
        wu.idx++;
        render();
        if (wu.idx >= WARMUP.length) {
          $("#wu-timer", el).textContent = "Terminé ! Votre voix est prête 🎤";
          $("#wu-skip", el).hidden = true;
          $("#wu-start", el).hidden = false;
          $("#wu-start", el).textContent = "Recommencer";
          wu.idx = -1;
          logActivity({ type: "warmup", label: "Échauffement vocal complet" });
          return;
        }
        const s = WARMUP[wu.idx];
        if ($("#br-voice", el).checked) speak(`${s.t}. ${s.d}`);
        wu.left = s.s;
        $("#wu-timer", el).textContent = fmtTime(wu.left);
        $("#wu-list", el).children[wu.idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
        wu.timer = setInterval(() => {
          wu.left--;
          $("#wu-timer", el).textContent = fmtTime(Math.max(0, wu.left));
          if (wu.left <= 0) next();
        }, 1000);
      }
      $("#wu-start", el).addEventListener("click", () => {
        wu.idx = -1;
        $("#wu-start", el).hidden = true;
        $("#wu-skip", el).hidden = false;
        next();
      });
      $("#wu-skip", el).addEventListener("click", next);
      render();
    },
  });

  /* ---------- Articulation ---------- */

  function syllables() {
    const cons = App.shuffle(SYL_CONSONANTS).slice(0, 3);
    return cons.map((c) => SYL_VOWELS.slice(0, 6).map((v) => {
      // « g » et « c » devant é / i doivent rester durs.
      if (/g$/.test(c) && /^(é|i|eu|in)/.test(v)) return c + "u" + v;
      if (c === "c") return "k" + v;
      return c + v;
    }).join("-")).join("  ·  ");
  }

  App.view({
    id: "articulation", title: "Articulation", icon: "👄", group: "voix",
    desc: `${TWISTERS.length} virelangues notés, gammes et sons proches`,
    html: `
      <h1>Articulation</h1>
      <p class="lead">Lisez le virelangue à voix haute. Commencez lentement en exagérant chaque syllabe, puis accélérez sans perdre en netteté. La reconnaissance vocale vérifie ce qui a été compris.</p>
      <div class="toolbar">
        <div class="segmented" id="tw-level">
          <button data-level="tous" class="active">Tous</button>
          <button data-level="facile">Facile</button>
          <button data-level="moyen">Moyen</button>
          <button data-level="difficile">Difficile</button>
        </div>
        <label class="check"><input type="checkbox" id="tw-triple"> Défi : 3 fois de suite</label>
        <label class="check"><input type="checkbox" id="tw-pen"> Stylo entre les dents</label>
      </div>
      <div class="card twister-card">
        <div class="twister-meta">
          <span class="pill" id="tw-badge"></span>
          <span class="muted" id="tw-focus"></span>
          <span class="muted" id="tw-count"></span>
        </div>
        <p class="twister-text" id="tw-text"></p>
        <p class="muted small" id="tw-tip"></p>
        <div class="actions">
          <button class="btn" id="tw-listen">🔊 Écouter</button>
          <select id="tw-rate" aria-label="Vitesse de lecture">
            <option value="0.6">Lent</option>
            <option value="0.9" selected>Normal</option>
            <option value="1.3">Rapide</option>
          </select>
          <button class="btn primary" id="tw-rec">🎙️ À vous !</button>
          <button class="btn ghost" id="tw-prev" aria-label="Précédent">←</button>
          <button class="btn ghost" id="tw-rand" aria-label="Au hasard">🎲</button>
          <button class="btn ghost" id="tw-next">Suivant →</button>
        </div>
        <div id="tw-live" class="live muted" hidden></div>
        <div id="tw-result" class="result" hidden></div>
      </div>
      <div class="card">
        <h3>Gammes d’articulation</h3>
        <p class="muted">Comme un musicien fait ses gammes : prononcez chaque série en ouvrant bien la bouche, d’abord lentement, puis de plus en plus vite.</p>
        <p class="syllables" id="syl-text"></p>
        <div class="actions">
          <button class="btn" id="syl-listen">🔊 Écouter</button>
          <button class="btn ghost" id="syl-new">Nouvelle série</button>
        </div>
      </div>
      <div class="card">
        <h3>Sons proches</h3>
        <p class="muted">Prononcez chaque série en marquant nettement la différence entre les sons. Cliquez sur un mot pour l’écouter.</p>
        <div class="pairs" id="pairs"></div>
      </div>`,
    init(el) {
      const tw = { level: "tous", list: TWISTERS, idx: 0, ctl: null };
      const q = (s) => $(s, el);

      function render(matched) {
        const item = tw.list[tw.idx];
        const reps = q("#tw-triple").checked ? 3 : 1;
        const per = App.tokens(item.t).length;
        let k = 0;
        q("#tw-text").innerHTML = item.t.split(/\s+/).map((w) => {
          const n = App.tokens(w).length;
          let cls = "";
          if (matched && n) {
            const ids = Array.from({ length: n }, (_, i) => k + i);
            const hit = ids.every((id) => [...Array(reps).keys()].some((r) => matched.has(id + r * per)));
            cls = hit ? "ok" : "ko";
          }
          k += n;
          return `<span class="w ${cls}">${esc(w)}</span>`;
        }).join(" ");
        const badge = q("#tw-badge");
        badge.textContent = item.level;
        badge.className = "pill " + item.level;
        q("#tw-focus").textContent = item.focus;
        q("#tw-count").textContent = `${tw.idx + 1} / ${tw.list.length}`;
        const best = store.get("twBest", {})[item.t];
        q("#tw-tip").textContent = q("#tw-pen").checked
          ? "✏️ Placez un stylo horizontalement entre les dents et articulez au maximum. La reconnaissance sera moins précise : c’est normal. Relisez ensuite sans le stylo, vous sentirez la différence !"
          : pick(TWISTER_TIPS) + (best != null ? ` — Votre meilleur score : ${best} %.` : "");
        if (!matched) { q("#tw-result").hidden = true; q("#tw-live").hidden = true; }
      }

      function showResult(item, said, secs) {
        const triple = q("#tw-triple").checked;
        const target = Array(triple ? 3 : 1).fill(App.tokens(item.t)).flat();
        const matched = App.lcsMatch(target, App.tokens(said));
        const score = Math.round((matched.size / target.length) * 100);
        render(matched);
        const stars = score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
        const msg = score >= 95 ? "Parfait ! Essayez maintenant plus vite, ou en mode défi ×3."
          : score >= 80 ? "Très bien ! Quelques mots à peaufiner (en rouge)."
          : score >= 60 ? "Pas mal. Ralentissez et exagérez les consonnes des mots en rouge."
          : "Reprenez plus lentement, syllabe par syllabe. Écoutez d’abord le modèle 🔊.";
        const syl = App.norm(item.t).replace(/[^aeiouy]+/g, " ").trim().split(" ").length * (triple ? 3 : 1);
        q("#tw-live").hidden = true;
        const res = q("#tw-result");
        res.hidden = false;
        res.innerHTML = `
          <div class="score-line">
            <span class="score-big">${score} %</span>
            <span class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>
            <span class="muted">${secs.toFixed(1)} s · ≈ ${(syl / Math.max(secs, 0.5)).toFixed(1)} syllabes/s</span>
          </div>
          <p>${msg}</p>
          <p class="muted small">Compris : « ${esc(said)} »</p>`;
        const pen = q("#tw-pen").checked;
        if (!pen) {
          const best = store.get("twBest", {});
          best[item.t] = Math.max(best[item.t] || 0, score);
          store.set("twBest", best);
        }
        logActivity({
          type: "twister", score, level: item.level, triple,
          label: item.t.slice(0, 40) + (item.t.length > 40 ? "…" : "") + (pen ? " (stylo)" : "") + (triple ? " ×3" : ""),
        });
      }

      function listen() {
        if (!SR) return;
        if (tw.ctl) { tw.ctl.stop(); return; }
        App.stopSpeaking();
        const item = tw.list[tw.idx];
        const btn = q("#tw-rec");
        btn.textContent = "⏹️ Terminer";
        btn.classList.add("recording");
        q("#tw-live").hidden = false;
        q("#tw-live").textContent = "Je vous écoute…";
        q("#tw-result").hidden = true;
        tw.ctl = App.listenOnce({
          maxMs: q("#tw-triple").checked ? 45000 : 25000,
          onInterim: (t) => { q("#tw-live").textContent = t || "…"; },
          onError: (err) => {
            if (err === "not-allowed" || err === "service-not-allowed") q("#tw-live").textContent = "Accès au micro refusé. Autorisez le micro dans votre navigateur.";
            else if (err === "no-speech") q("#tw-live").textContent = "Aucune parole détectée. Réessayez en parlant plus fort.";
          },
          onDone: (said, secs) => {
            tw.ctl = null;
            btn.textContent = "🎙️ À vous !";
            btn.classList.remove("recording");
            if (said) showResult(item, said, secs);
          },
        });
      }

      segmented(q("#tw-level"), (d) => {
        tw.level = d.level;
        tw.list = tw.level === "tous" ? TWISTERS : TWISTERS.filter((t) => t.level === tw.level);
        tw.idx = 0;
        render();
      });
      q("#tw-next").addEventListener("click", () => { tw.idx = (tw.idx + 1) % tw.list.length; render(); });
      q("#tw-prev").addEventListener("click", () => { tw.idx = (tw.idx - 1 + tw.list.length) % tw.list.length; render(); });
      q("#tw-rand").addEventListener("click", () => { tw.idx = tw.list.indexOf(pickOther(tw.list, tw.list[tw.idx])); render(); });
      q("#tw-listen").addEventListener("click", () => {
        const t = tw.list[tw.idx].t;
        speak(q("#tw-triple").checked ? [t, t, t].join(" ") : t, +q("#tw-rate").value);
      });
      q("#tw-rec").addEventListener("click", listen);
      q("#tw-rec").disabled = !SR;
      q("#tw-pen").addEventListener("change", () => render());
      q("#tw-triple").addEventListener("change", () => render());
      this.hide = () => { if (tw.ctl) tw.ctl.stop(); };

      q("#syl-text").textContent = syllables();
      q("#syl-new").addEventListener("click", () => { q("#syl-text").textContent = syllables(); });
      q("#syl-listen").addEventListener("click", () => speak(q("#syl-text").textContent.replace(/·/g, ",").replace(/-/g, " "), 0.8));

      q("#pairs").innerHTML = MINIMAL_PAIRS.map((p) => `<div class="pair">${p.map((w) => `<button class="chip" data-say="${esc(w)}">${esc(w)}</button>`).join("<span>/</span>")}</div>`).join("");
      q("#pairs").addEventListener("click", (e) => {
        const b = e.target.closest("[data-say]");
        if (b) speak(b.dataset.say, 0.8);
      });
      render();
    },
  });

  /* ---------- Analyse de la voix ---------- */

  const VOICE_MODES = {
    libre: { n: "Libre", d: "Parlez librement et observez la mélodie de votre voix. Une courbe plate signale une voix monocorde." },
    sirene: { n: "Sirène", d: "Sur un « ou », glissez de votre note la plus grave à la plus aiguë, puis redescendez. Objectif : dépasser 12 demi-tons d’étendue." },
    projection: { n: "Projection", d: "Dites « Bonjour à tous ! » ou comptez de 1 à 10 en gardant le volume dans la zone verte, comme pour la dernière rangée d’une salle. Tenez 5 secondes cumulées." },
    question: { n: "Question / affirmation", d: "Dites « Tu viens demain ? » puis « Tu viens demain. » La courbe doit monter à la fin de la question et descendre à la fin de l’affirmation." },
    tenue: { n: "Note tenue", d: "Tenez un « aaa » le plus stable possible pendant au moins 8 secondes. La courbe doit rester plate." },
  };

  App.view({
    id: "voix", title: "Voix & intonation", icon: "🎚️", group: "voix",
    desc: "Mesurez la hauteur, le volume et l’expressivité de votre voix",
    html: `
      <h1>Voix &amp; intonation</h1>
      <p class="lead">Visualisez votre voix en temps réel : la courbe montre la hauteur (grave en bas, aigu en haut), la barre le volume. Une voix expressive varie ; une voix monocorde reste plate.</p>
      <div class="card">
        <div class="segmented" id="vx-mode"></div>
        <p class="muted small" id="vx-desc"></p>
        <canvas id="vx-canvas" class="pitch-canvas" width="900" height="260" aria-label="Courbe de hauteur de la voix"></canvas>
        <div class="vx-live">
          <div><b id="vx-hz">—</b><span>hauteur</span></div>
          <div><b id="vx-range">—</b><span>étendue</span></div>
          <div><b id="vx-extra">—</b><span id="vx-extra-l">variation</span></div>
        </div>
        <div class="meter tall"><div id="vx-meter"></div><span class="zone" id="vx-zone" hidden></span></div>
        <div class="actions">
          <button class="btn primary" id="vx-toggle">🎙️ Démarrer</button>
          <span class="muted small" id="vx-status"></span>
        </div>
        <div id="vx-result"></div>
      </div>
      <div class="card">
        <h3>Une phrase, mille intentions</h3>
        <p class="muted">Dites la phrase avec l’émotion demandée, réécoutez-vous, puis changez d’émotion. C’est l’intonation qui donne vie au discours.</p>
        <p class="quote" id="in-sentence"></p>
        <p class="emotion" id="in-emotion"></p>
        <p class="muted small" id="in-tip"></p>
        <div class="actions">
          <button class="btn primary" id="in-rec">🎙️ M’enregistrer</button>
          <button class="btn" id="in-emo">🎭 Autre émotion</button>
          <button class="btn ghost" id="in-new">Autre phrase</button>
        </div>
        <div id="in-audio"></div>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      const vx = { mode: "libre", session: null, data: [], raf: 0, zoneMs: 0 };
      q("#vx-mode").innerHTML = Object.entries(VOICE_MODES).map(([k, m], i) => `<button data-mode="${k}" class="${i ? "" : "active"}">${m.n}</button>`).join("");
      const setMode = (m) => {
        vx.mode = m;
        q("#vx-desc").textContent = VOICE_MODES[m].d;
        q("#vx-zone").hidden = m !== "projection";
        q("#vx-extra-l").textContent = m === "projection" ? "dans la zone" : m === "tenue" ? "stabilité" : "variation";
      };
      segmented(q("#vx-mode"), (d) => { if (!vx.session) setMode(d.mode); });
      setMode("libre");

      const canvas = q("#vx-canvas"), ctx = canvas.getContext("2d");
      const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      const LO = 70, HI = 450, WINDOW = 10;
      const yOf = (f) => canvas.height - ((Math.log2(f / LO)) / Math.log2(HI / LO)) * canvas.height;

      function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const k = W / (canvas.clientWidth || W);
        ctx.strokeStyle = css("--border");
        ctx.fillStyle = css("--muted");
        ctx.font = `${Math.round(12 * k)}px system-ui`;
        ctx.lineWidth = k;
        [100, 150, 200, 300].forEach((f) => {
          const y = yOf(f);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
          ctx.fillText(f + " Hz", 6 * k, y - 4 * k);
        });
        const now = performance.now();
        ctx.strokeStyle = css("--accent");
        ctx.lineWidth = 2.5 * k;
        ctx.lineJoin = "round";
        ctx.beginPath();
        let prev = null;
        vx.data.forEach((p) => {
          const x = W - ((now - p.t) / 1000 / WINDOW) * W;
          if (x < 0 || !p.f) { prev = null; return; }
          const y = yOf(p.f);
          if (prev && p.t - prev.t < 160) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          prev = p;
        });
        ctx.stroke();
        if (vx.session) vx.raf = requestAnimationFrame(draw);
      }

      function live(rms, f) {
        const t = performance.now();
        vx.data.push({ t, f });
        while (vx.data.length && t - vx.data[0].t > WINDOW * 1000 + 500) vx.data.shift();
        const vol = App.clamp(rms * 500, 0, 100);
        q("#vx-meter").style.width = vol + "%";
        if (f) q("#vx-hz").textContent = Math.round(f) + " Hz";
        const s = App.pitchStats(vx.session.pitches);
        if (s) q("#vx-range").textContent = s.range.toFixed(1) + " dt";
        if (vx.mode === "projection") {
          if (vol >= 40 && vol <= 85) vx.zoneMs += 50;
          q("#vx-extra").textContent = (vx.zoneMs / 1000).toFixed(1) + " s";
          if (vx.zoneMs >= 5000 && !vx.zoneDone) { vx.zoneDone = true; App.toast("🎯 Projection réussie : 5 secondes dans la zone !"); }
        } else if (s) {
          q("#vx-extra").textContent = s.std.toFixed(1) + " dt";
        }
      }

      async function start() {
        vx.data = [];
        vx.zoneMs = 0;
        vx.zoneDone = false;
        q("#vx-result").innerHTML = "";
        const s = new App.SpeechSession({ transcribe: false, onLevel: (r, f) => live(r, f) });
        if (!(await s.start())) { q("#vx-status").textContent = s.error; return; }
        vx.session = s;
        q("#vx-toggle").textContent = "⏹️ Arrêter";
        q("#vx-toggle").classList.add("recording");
        q("#vx-status").textContent = "Parlez…";
        draw();
      }

      async function stop() {
        const s = vx.session;
        if (!s) return;
        vx.session = null;
        cancelAnimationFrame(vx.raf);
        const r = await s.stop();
        q("#vx-toggle").textContent = "🎙️ Démarrer";
        q("#vx-toggle").classList.remove("recording");
        q("#vx-status").textContent = "";
        q("#vx-meter").style.width = "0";
        const st = App.pitchStats(r.pitches);
        if (!st) {
          q("#vx-result").innerHTML = `<p class="muted">Pas assez de voix détectée. Parlez plus longtemps ou rapprochez-vous du micro.</p>`;
          return;
        }
        const register = st.median < 165 ? "plutôt grave" : st.median < 255 ? "médium" : "plutôt aiguë";
        let verdict;
        if (vx.mode === "sirene") verdict = st.range >= 12 ? ["good", `Belle étendue : ${st.range.toFixed(1)} demi-tons !`] : ["warn", `Étendue de ${st.range.toFixed(1)} demi-tons : allez plus loin dans le grave et l’aigu.`];
        else if (vx.mode === "projection") verdict = vx.zoneMs >= 5000 ? ["good", "Projection maîtrisée : votre voix porte."] : ["warn", "Pas assez de temps dans la zone : soutenez davantage avec le ventre, sans crier."];
        else if (vx.mode === "tenue") verdict = st.std < 0.8 ? ["good", "Note très stable : excellent contrôle du souffle."] : ["warn", "La note fluctue : inspirez plus profondément et expirez régulièrement."];
        else if (vx.mode === "question") verdict = ["good", "Réécoutez-vous : la question monte-t-elle vraiment à la fin ? L’affirmation descend-elle ?"];
        else verdict = st.std < 1.5 ? ["warn", "Voix plutôt monocorde : exagérez les montées et descentes, appuyez les mots clés."] : st.std > 6 ? ["warn", "Voix très chantante : gardez des fins de phrases posées."] : ["good", "Voix expressive : la mélodie varie naturellement."];
        q("#vx-result").innerHTML = `
          <div class="report-grid">
            <div class="metric"><b>${Math.round(st.median)} Hz</b><span>hauteur médiane (voix ${register})</span></div>
            <div class="metric"><b>${Math.round(st.low)}–${Math.round(st.high)} Hz</b><span>plage habituelle</span></div>
            <div class="metric"><b>${st.range.toFixed(1)}</b><span>demi-tons d’étendue</span></div>
            <div class="metric"><b>${st.std.toFixed(1)}</b><span>variation (demi-tons)</span></div>
          </div>
          <ul class="feedback"><li class="${verdict[0]}">${verdict[1]}</li></ul>
          ${r.audioUrl ? `<audio controls src="${r.audioUrl}"></audio>` : ""}`;
        logActivity({ type: "voice", label: VOICE_MODES[vx.mode].n, duration: r.duration });
      }

      q("#vx-toggle").addEventListener("click", () => (vx.session ? stop() : start()));
      this.hide = () => { if (vx.session) stop(); };

      const inx = { s: pick(INTONATION_SENTENCES), e: pick(EMOTIONS), timer: null };
      inx.clip = App.clipRecorder(q("#in-audio"), () => {
        clearTimeout(inx.timer);
        q("#in-rec").textContent = "🎙️ M’enregistrer";
        q("#in-rec").classList.remove("recording");
      });
      const inRender = () => {
        q("#in-sentence").textContent = "« " + inx.s + " »";
        q("#in-emotion").textContent = `${inx.e.i} ${inx.e.e}`;
        q("#in-tip").textContent = inx.e.tip;
      };
      q("#in-emo").addEventListener("click", () => { inx.e = pickOther(EMOTIONS, inx.e); inRender(); });
      q("#in-new").addEventListener("click", () => { inx.s = pickOther(INTONATION_SENTENCES, inx.s); inx.e = pick(EMOTIONS); inRender(); });
      q("#in-rec").addEventListener("click", async () => {
        if (inx.clip.active) { inx.clip.stop(); return; }
        if (!(await inx.clip.start())) return;
        q("#in-rec").textContent = "⏹️ Arrêter";
        q("#in-rec").classList.add("recording");
        inx.timer = setTimeout(() => inx.clip.stop(), 15000);
        logActivity({ type: "intonation", label: `${inx.e.e} — ${inx.s}` });
      });
      inRender();
    },
  });

  /* ---------- Lecture guidée ---------- */

  App.view({
    id: "lecture", title: "Lecture guidée", icon: "📜", group: "voix",
    desc: "Téléprompteur au bon rythme, avec vos propres textes",
    html: `
      <h1>Lecture guidée</h1>
      <p class="lead">Lisez à voix haute en suivant le surlignage : il avance au rythme choisi et marque les pauses à chaque ponctuation. Idéal pour trouver un débit posé, respirer au bon moment… et répéter vos propres discours.</p>
      <div class="card">
        <div class="toolbar">
          <select id="rd-text" aria-label="Texte"></select>
          <div class="segmented" id="rd-speed">
            <button data-wpm="100">Lent</button>
            <button data-wpm="130" class="active">Posé</button>
            <button data-wpm="160">Dynamique</button>
          </div>
          <label class="check"><input type="checkbox" id="rd-record"> M’enregistrer</label>
          <label class="check"><input type="checkbox" id="rd-big"> Grand texte</label>
        </div>
        <textarea id="rd-custom" rows="5" placeholder="Collez ou écrivez votre texte ici…" hidden></textarea>
        <p class="muted small" id="rd-src"></p>
        <div class="prompter" id="rd-prompter"></div>
        <div class="actions">
          <button class="btn primary" id="rd-play">▶️ Démarrer</button>
          <button class="btn ghost" id="rd-reset">Recommencer</button>
          <span class="muted small" id="rd-est"></span>
        </div>
        <p class="muted small">/ = courte pause · // = pause longue. Levez les yeux vers votre public à chaque pause longue.</p>
        <div id="rd-audio"></div>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      const rd = { key: "0", wpm: 130, pos: 0, timer: null, playing: false, items: [], clip: App.clipRecorder(q("#rd-audio")) };
      const options = () => [
        ...READINGS.map((r, i) => [String(i), r.title]),
        ["atelier", "📝 Mon discours (atelier)"],
        ["custom", "✏️ Texte personnalisé"],
      ];
      q("#rd-text").innerHTML = options().map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join("");

      function source() {
        if (rd.key === "custom") return { src: "Votre texte", t: store.get("customText", "") };
        if (rd.key === "atelier") {
          const t = App.atelierText ? App.atelierText() : "";
          return { src: "Depuis l’atelier de préparation", t: t || "Votre discours de l’atelier est vide. Rendez-vous dans « Préparer un discours » pour l’écrire." };
        }
        return READINGS[+rd.key];
      }

      function render() {
        pause();
        rd.clip.stop();
        rd.pos = 0;
        const r = source();
        q("#rd-custom").hidden = rd.key !== "custom";
        if (rd.key === "custom" && document.activeElement !== q("#rd-custom")) q("#rd-custom").value = r.t;
        q("#rd-src").textContent = r.src;
        rd.items = [];
        (r.t || "").split(/\s+/).filter(Boolean).forEach((w) => {
          // La ponctuation isolée (« ; », « ? »…) est rattachée au mot précédent.
          if (!/\p{L}|\d/u.test(w) && rd.items.length) rd.items[rd.items.length - 1].w += " " + w;
          else rd.items.push({ w });
        });
        rd.items.forEach((it) => {
          const end = it.w.replace(/[»"’)]+$/, "");
          it.pause = /[.!?…]$/.test(end) ? 2 : /[,;:]$/.test(end) ? 1 : 0;
        });
        q("#rd-prompter").innerHTML = rd.items.map((it, i) =>
          `<span class="w" data-i="${i}">${esc(it.w)}</span>${it.pause ? `<span class="mark">${it.pause === 2 ? "//" : "/"}</span>` : ""}`).join(" ")
          || `<span class="muted">Écrivez un texte ci-dessus.</span>`;
        q("#rd-prompter").scrollTop = 0;
        q("#rd-play").textContent = "▶️ Démarrer";
        estimate();
      }
      function delayFor(it) {
        return (60000 / rd.wpm) * (it.w.length > 8 ? 1.25 : 1) + [0, 450, 950][it.pause];
      }
      function estimate() {
        const ms = rd.items.reduce((s, it) => s + delayFor(it), 0);
        q("#rd-est").textContent = rd.items.length ? `${rd.items.length} mots · environ ${fmtTime(ms / 1000)}` : "";
      }
      function step() {
        const spans = q("#rd-prompter").querySelectorAll(".w");
        if (rd.pos > 0) spans[rd.pos - 1].className = "w past";
        if (rd.pos >= rd.items.length) {
          pause();
          rd.clip.stop();
          q("#rd-play").textContent = "▶️ Relire";
          rd.pos = 0;
          logActivity({ type: "reading", label: `${q("#rd-text").selectedOptions[0].textContent} (${rd.wpm} mots/min)` });
          return;
        }
        const span = spans[rd.pos];
        span.className = "w now";
        const box = q("#rd-prompter");
        const top = span.offsetTop - box.offsetTop;
        if (top > box.scrollTop + box.clientHeight * 0.6 || top < box.scrollTop) box.scrollTop = top - box.clientHeight * 0.3;
        const it = rd.items[rd.pos];
        rd.pos++;
        rd.timer = setTimeout(step, delayFor(it));
      }
      function pause() {
        clearTimeout(rd.timer);
        rd.playing = false;
        q("#rd-play").textContent = "▶️ Reprendre";
      }
      q("#rd-play").addEventListener("click", async () => {
        if (rd.playing) { pause(); return; }
        if (!rd.items.length) return;
        if (rd.pos === 0) {
          q("#rd-prompter").querySelectorAll(".w").forEach((s) => { s.className = "w"; });
          q("#rd-audio").innerHTML = "";
          if (q("#rd-record").checked) await rd.clip.start();
        }
        rd.playing = true;
        q("#rd-play").textContent = "⏸️ Pause";
        step();
      });
      q("#rd-reset").addEventListener("click", render);
      q("#rd-text").addEventListener("change", (e) => { rd.key = e.target.value; render(); });
      q("#rd-custom").addEventListener("input", (e) => { store.set("customText", e.target.value); render(); });
      q("#rd-big").addEventListener("change", (e) => q("#rd-prompter").classList.toggle("big", e.target.checked));
      segmented(q("#rd-speed"), (d) => { rd.wpm = +d.wpm; estimate(); });
      this.hide = () => { pause(); rd.clip.stop(); };
      this.open = (key) => { rd.key = key; q("#rd-text").value = key; render(); };
      render();
    },
    show() {
      if (App.pendingReading) {
        this.open(App.pendingReading);
        App.pendingReading = null;
      }
    },
  });
})();
