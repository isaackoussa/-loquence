/* Prise de parole : discours, improvisation, débat, entretien, récit. */
(() => {
  "use strict";
  const { $, esc, store, pick, pickOther, fmtTime, segmented, setSegment, speak, logActivity, settings, SR, go } = App;

  /* Lance une prise de parole analysée depuis n'importe quelle section. */
  App.startSpeech = (opts) => {
    App.pendingSpeech = opts;
    go("discours");
  };

  /* ---------- Analyse de discours ---------- */

  App.view({
    id: "discours", title: "Analyse de discours", icon: "🎙️", group: "parole",
    desc: "Débit, tics, pauses, vocabulaire et voix analysés",
    html: `
      <h1>Analyse de discours</h1>
      <p class="lead">Parlez librement ou sur un sujet. À la fin, vous obtenez votre débit, vos tics de langage, vos pauses, la richesse de votre vocabulaire, l’expressivité de votre voix et des conseils personnalisés.</p>
      <div class="card">
        <label class="field"><span>Sujet (facultatif)</span>
          <input type="text" id="sp-topic" placeholder="Ex. : Présentez-vous en une minute">
        </label>
        <div class="toolbar">
          <span class="muted">Durée :</span>
          <div class="segmented" id="sp-duration">
            <button data-sec="0" class="active">Libre</button>
            <button data-sec="30">30 s</button>
            <button data-sec="60">1 min</button>
            <button data-sec="120">2 min</button>
            <button data-sec="180">3 min</button>
            <button data-sec="300">5 min</button>
          </div>
          <label class="check"><input type="checkbox" id="sp-buzz"> 🔔 Buzzer anti-tics</label>
          <label class="check"><input type="checkbox" id="sp-hide"> Masquer la transcription</label>
        </div>
        ${App.recorderHTML("sp")}
        <div class="transcript" id="sp-transcript" aria-live="polite"></div>
      </div>
      <div id="sp-report" hidden></div>`,
    init(el) {
      const q = (s) => $(s, el);
      const sp = { limit: 0, session: null, mode: "libre", back: null };
      q("#sp-buzz").checked = settings.get("buzz");
      q("#sp-buzz").addEventListener("change", (e) => settings.set("buzz", e.target.checked));
      q("#sp-hide").addEventListener("change", (e) => q("#sp-transcript").classList.toggle("blurred", e.target.checked));
      segmented(q("#sp-duration"), (d) => {
        sp.limit = +d.sec;
        if (!sp.session) q("#sp-timer").textContent = fmtTime(sp.limit);
      });
      const setDuration = (sec) => {
        sp.limit = sec;
        setSegment(q("#sp-duration"), "sec", sec);
        q("#sp-timer").textContent = fmtTime(sec);
      };

      let fillers = 0;
      async function start() {
        fillers = 0;
        q("#sp-report").hidden = true;
        q("#sp-transcript").innerHTML = "";
        const s = new App.SpeechSession({
          onTranscript: (finals, interim) => {
            const box = q("#sp-transcript");
            box.innerHTML = App.highlightFillers(finals.join(" ")) + (interim ? ` <span class="interim">${esc(interim)}</span>` : "");
            box.scrollTop = box.scrollHeight;
          },
          onFinal: (t) => {
            const n = App.countFillers(App.tokens(t)).total;
            if (!n) return;
            fillers += n;
            if (q("#sp-buzz").checked) s.beep();
            q("#sp-status").textContent = `Tics détectés : ${fillers}`;
          },
          onLevel: (rms) => { q("#sp-meter").style.width = App.clamp(rms * 500, 0, 100) + "%"; },
        });
        if (!(await s.start())) { q("#sp-status").textContent = s.error; return; }
        sp.session = s;
        q("#sp-rec").classList.add("on");
        q("#sp-rec").setAttribute("aria-label", "Arrêter l’enregistrement");
        q("#sp-status").textContent = sp.limit ? "Parlez… l’enregistrement s’arrêtera automatiquement." : "Parlez… appuyez de nouveau pour terminer.";
        sp.clock = setInterval(() => {
          const t = s.elapsed;
          q("#sp-timer").textContent = sp.limit ? fmtTime(Math.max(0, sp.limit - t)) : fmtTime(t);
          if (sp.limit && t >= sp.limit) stop();
        }, 200);
      }

      async function stop() {
        const s = sp.session;
        if (!s) return;
        sp.session = null;
        clearInterval(sp.clock);
        q("#sp-rec").classList.remove("on");
        q("#sp-rec").setAttribute("aria-label", "Démarrer l’enregistrement");
        q("#sp-meter").style.width = "0";
        q("#sp-status").textContent = "Analyse en cours…";
        const r = await s.stop();
        const a = App.analyze(r);
        const topic = q("#sp-topic").value.trim();
        q("#sp-status").textContent = "Terminé. Consultez votre bilan ci-dessous.";
        q("#sp-report").hidden = false;
        q("#sp-report").innerHTML = App.reportHTML(r, a, {
          topic,
          actions: `<button class="btn primary" data-act="again">Recommencer</button>
            ${sp.back ? `<a class="btn" href="#${sp.back[0]}">${esc(sp.back[1])}</a>` : ""}
            <a class="btn ghost" href="#impro">Nouveau sujet</a>`,
        });
        q("#sp-report").scrollIntoView({ behavior: "smooth", block: "start" });
        logActivity({
          type: "speech", mode: sp.mode, score: a.score, label: topic || "Discours libre",
          wpm: a.wpm != null ? Math.round(a.wpm) : null, fpm: a.fpm != null ? +a.fpm.toFixed(2) : null,
          fillers: a.fpm != null ? a.fillers : null, words: a.words, duration: Math.round(r.duration),
        });
      }

      q("#sp-report").addEventListener("click", (e) => {
        if (e.target.closest("[data-act=again]")) { window.scrollTo({ top: 0, behavior: "smooth" }); start(); }
      });
      q("#sp-rec").addEventListener("click", () => (sp.session ? stop() : start()));
      q("#sp-topic").addEventListener("input", () => { sp.mode = "libre"; sp.back = null; });
      this.hide = () => { if (sp.session) stop(); };
      this.launch = (o) => {
        if (sp.session) return;
        q("#sp-topic").value = o.topic || "";
        sp.mode = o.mode || "libre";
        sp.back = o.back || null;
        setDuration(o.duration ?? sp.limit);
        if (o.autostart !== false) start();
      };
    },
    show() {
      if (App.pendingSpeech) {
        const o = App.pendingSpeech;
        App.pendingSpeech = null;
        this.launch(o);
      }
    },
  });

  /* ---------- Improvisation ---------- */

  const CAT_LABEL = { argumenter: "Argumenter", raconter: "Raconter", convaincre: "Pitcher", decaler: "Décalé" };

  App.view({
    id: "impro", title: "Improvisation", icon: "⚡", group: "parole",
    desc: `${TOPICS.length} sujets, contraintes et temps de préparation`,
    html: `
      <h1>Improvisation</h1>
      <p class="lead">Tirez un sujet au hasard, préparez-vous quelques secondes, puis lancez-vous. Structure simple qui marche toujours : <strong>une accroche</strong>, <strong>deux ou trois idées</strong>, <strong>une conclusion</strong>.</p>
      <div class="toolbar">
        <div class="segmented" id="im-cat">
          <button data-cat="tous" class="active">Tous</button>
          <button data-cat="argumenter">Argumenter</button>
          <button data-cat="raconter">Raconter</button>
          <button data-cat="convaincre">Pitcher</button>
          <button data-cat="decaler">Décalé</button>
        </div>
        <label class="check"><input type="checkbox" id="im-constraint" checked> Ajouter une contrainte</label>
      </div>
      <div class="toolbar">
        <label class="check">Préparation
          <select id="im-prep-sec"><option value="15">15 s</option><option value="30" selected>30 s</option><option value="60">1 min</option></select>
        </label>
        <label class="check">Parole
          <select id="im-talk"><option value="60" selected>1 min</option><option value="90">1 min 30</option><option value="120">2 min</option></select>
        </label>
      </div>
      <div class="card impro-card">
        <span class="pill" id="im-type"></span>
        <p class="impro-topic" id="im-topic">Cliquez sur « Tirer un sujet »</p>
        <p class="constraint" id="im-cons" hidden></p>
        <div class="prep" id="im-prep" hidden>
          <div class="timer big" id="im-prep-timer">30</div>
          <div class="muted">secondes de préparation</div>
        </div>
        <div class="actions">
          <button class="btn primary" id="im-draw">🎲 Tirer un sujet</button>
          <button class="btn" id="im-start" disabled>⏱️ Préparer</button>
          <button class="btn" id="im-go" disabled>🎙️ Parler maintenant</button>
        </div>
      </div>
      <div class="card">
        <h3>Structures pour ne jamais être pris de court</h3>
        <div class="grid-3">
          <div><h4>PREP</h4><p class="small"><b>P</b>osition · <b>R</b>aison · <b>E</b>xemple · <b>P</b>osition réaffirmée. Idéal pour donner son avis.</p></div>
          <div><h4>Passé · Présent · Futur</h4><p class="small">D’où l’on vient, où l’on en est, où l’on va. Parfait pour raconter ou présenter.</p></div>
          <div><h4>Problème · Solution · Bénéfice</h4><p class="small">La structure du pitch : un besoin, une réponse, ce que l’on y gagne.</p></div>
        </div>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      const im = { cat: "tous", topic: null, cons: null, timer: null };
      const stopPrep = () => { clearInterval(im.timer); q("#im-prep").hidden = true; };
      function draw() {
        const pool = im.cat === "tous" ? TOPICS : TOPICS.filter((t) => t.cat === im.cat);
        im.topic = pickOther(pool, im.topic);
        im.cons = q("#im-constraint").checked ? pick(CONSTRAINTS) : null;
        q("#im-topic").textContent = im.topic.t;
        q("#im-type").textContent = CAT_LABEL[im.topic.cat];
        q("#im-cons").hidden = !im.cons;
        q("#im-cons").textContent = im.cons ? "Contrainte : " + im.cons : "";
        q("#im-start").disabled = false;
        q("#im-go").disabled = false;
        q("#im-start").textContent = `⏱️ Préparer (${q("#im-prep-sec").value} s)`;
        stopPrep();
      }
      function goSpeak() {
        stopPrep();
        App.startSpeech({ topic: im.topic.t + (im.cons ? " — " + im.cons : ""), duration: +q("#im-talk").value, mode: "impro", back: ["impro", "Autre sujet"] });
      }
      segmented(q("#im-cat"), (d) => { im.cat = d.cat; draw(); });
      q("#im-draw").addEventListener("click", draw);
      q("#im-go").addEventListener("click", goSpeak);
      q("#im-prep-sec").addEventListener("change", () => { if (im.topic) q("#im-start").textContent = `⏱️ Préparer (${q("#im-prep-sec").value} s)`; });
      q("#im-start").addEventListener("click", () => {
        let left = +q("#im-prep-sec").value;
        q("#im-prep").hidden = false;
        q("#im-prep-timer").textContent = left;
        clearInterval(im.timer);
        im.timer = setInterval(() => {
          left--;
          q("#im-prep-timer").textContent = left;
          if (left <= 0) goSpeak();
        }, 1000);
      });
      this.hide = stopPrep;
    },
  });

  /* ---------- Débat & argumentation ---------- */

  App.view({
    id: "debat", title: "Débat & argumentation", icon: "⚖️", group: "parole",
    desc: "Plaidoiries pour ou contre, réfutations express",
    html: `
      <h1>Débat &amp; argumentation</h1>
      <p class="lead">Apprenez à défendre une position, à anticiper les objections et à réfuter avec élégance. Le meilleur entraînement : plaider une cause… puis la cause inverse.</p>

      <div class="card">
        <h3>Plaidoirie</h3>
        <div class="toolbar">
          <button class="btn" id="db-draw">🎲 Nouvelle motion</button>
          <div class="segmented" id="db-side">
            <button data-side="pour" class="active">Pour</button>
            <button data-side="contre">Contre</button>
          </div>
        </div>
        <p class="impro-topic left" id="db-motion"></p>
        <p class="constraint" id="db-side-label"></p>
        <div class="builder">
          <label class="field"><span>1. Ma thèse (une phrase claire)</span><input type="text" data-k="these" placeholder="Je suis convaincu que…"></label>
          <label class="field"><span>2. Premier argument + exemple</span><textarea rows="2" data-k="a1" placeholder="D’abord, … Par exemple, …"></textarea></label>
          <label class="field"><span>3. Deuxième argument + exemple</span><textarea rows="2" data-k="a2" placeholder="Ensuite, … Prenons le cas de …"></textarea></label>
          <label class="field"><span>4. L’objection que l’on va me faire… et ma réponse</span><textarea rows="2" data-k="obj" placeholder="On me dira que… Certes, mais…"></textarea></label>
          <label class="field"><span>5. Conclusion et appel</span><textarea rows="2" data-k="concl" placeholder="En définitive, …"></textarea></label>
        </div>
        <details class="details"><summary>Types d’arguments</summary>
          <div class="grid-3">${ARGUMENT_TYPES.map((a) => `<div><h4>${esc(a.n)}</h4><p class="small">${esc(a.d)}</p></div>`).join("")}</div>
        </details>
        <div class="actions">
          <button class="btn primary" id="db-plead">🎙️ Plaider (2 min)</button>
          <button class="btn" id="db-switch">🔄 Changer de camp</button>
          <button class="btn ghost" id="db-read">📜 Lire mes notes au téléprompteur</button>
        </div>
      </div>

      <div class="card">
        <h3>Réfutation express</h3>
        <p class="muted">Une affirmation contestable vous est lancée. Vous avez 45 secondes pour la démonter avec calme et méthode.</p>
        <p class="quote" id="rf-statement"></p>
        <details class="details"><summary>Indice</summary><p id="rf-hint"></p></details>
        <div class="chips">${REFUTATION_TECHNIQUES.map((t) => `<span class="chip static">${esc(t)}</span>`).join("")}</div>
        <div class="actions">
          <button class="btn" id="rf-listen">🔊 Entendre l’affirmation</button>
          <button class="btn primary" id="rf-go">🎙️ Réfuter (45 s)</button>
          <button class="btn ghost" id="rf-next">Autre affirmation</button>
        </div>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      const db = store.get("debate", { motion: MOTIONS[0], side: "pour", notes: {} });
      const save = () => store.set("debate", db);
      function render() {
        q("#db-motion").textContent = `« ${db.motion} »`;
        q("#db-side-label").textContent = db.side === "pour" ? "Vous défendez la motion" : "Vous vous opposez à la motion";
        setSegment(q("#db-side"), "side", db.side);
        el.querySelectorAll("[data-k]").forEach((f) => { f.value = db.notes[f.dataset.k] || ""; });
      }
      el.querySelectorAll("[data-k]").forEach((f) => f.addEventListener("input", () => { db.notes[f.dataset.k] = f.value; save(); }));
      q("#db-draw").addEventListener("click", () => { db.motion = pickOther(MOTIONS, db.motion); db.notes = {}; save(); render(); });
      segmented(q("#db-side"), (d) => { db.side = d.side; save(); render(); });
      q("#db-switch").addEventListener("click", () => {
        db.side = db.side === "pour" ? "contre" : "pour";
        db.notes = {};
        save();
        render();
        App.toast("🔄 Vous changez de camp : préparez vos nouveaux arguments !");
      });
      q("#db-plead").addEventListener("click", () => App.startSpeech({
        topic: `${db.motion} — ${db.side === "pour" ? "Pour" : "Contre"}`, duration: 120, mode: "debat", back: ["debat", "Retour au débat"],
      }));
      q("#db-read").addEventListener("click", () => {
        const n = db.notes;
        store.set("customText", [n.these, n.a1, n.a2, n.obj, n.concl].filter(Boolean).join("\n\n"));
        App.pendingReading = "custom";
        go("lecture");
      });

      let rf = pick(REFUTATIONS);
      const rfRender = () => {
        q("#rf-statement").textContent = `« ${rf.s} »`;
        q("#rf-hint").textContent = rf.h;
      };
      q("#rf-next").addEventListener("click", () => { rf = pickOther(REFUTATIONS, rf); rfRender(); });
      q("#rf-listen").addEventListener("click", () => speak(rf.s));
      q("#rf-go").addEventListener("click", () => App.startSpeech({ topic: `Réfuter : « ${rf.s} »`, duration: 45, mode: "refutation", back: ["debat", "Retour au débat"] }));
      render();
      rfRender();
    },
  });

  /* ---------- Entretien & oral ---------- */

  App.view({
    id: "entretien", title: "Entretien & oral", icon: "💼", group: "parole",
    desc: "Simulations d’entretien, d’oral d’examen et d’interview",
    html: `
      <h1>Entretien &amp; oral</h1>
      <p class="lead">Un examinateur virtuel vous pose des questions à voix haute. Répondez comme en situation réelle : chaque réponse est enregistrée et analysée, puis vous obtenez un bilan complet.</p>
      <div id="iv-setup" class="card">
        <h3>Choisissez votre simulation</h3>
        <div class="choice-grid" id="iv-sets"></div>
        <div class="toolbar">
          <label class="check">Nombre de questions
            <select id="iv-count"><option value="3">3</option><option value="5" selected>5</option><option value="99">Toutes</option></select>
          </label>
          <label class="check">Temps par réponse
            <select id="iv-time"><option value="60">1 min</option><option value="90" selected>1 min 30</option><option value="120">2 min</option></select>
          </label>
          <label class="check"><input type="checkbox" id="iv-voice" checked> Questions lues à voix haute</label>
          <label class="check"><input type="checkbox" id="iv-random" checked> Ordre aléatoire</label>
        </div>
        <div class="actions"><button class="btn primary" id="iv-start">Commencer la simulation</button></div>
      </div>
      <div id="iv-run" class="card" hidden>
        <div class="twister-meta"><span class="pill" id="iv-step"></span><span class="muted" id="iv-set-name"></span></div>
        <p class="impro-topic left" id="iv-question"></p>
        <details class="details"><summary>Conseil</summary><p id="iv-tip"></p></details>
        ${App.recorderHTML("iv")}
        <div class="transcript" id="iv-transcript"></div>
        <div class="actions">
          <button class="btn primary" id="iv-next" disabled>Réponse terminée →</button>
          <button class="btn ghost" id="iv-repeat">🔊 Répéter la question</button>
          <button class="btn ghost" id="iv-quit">Abandonner</button>
        </div>
      </div>
      <div id="iv-summary" hidden></div>`,
    init(el) {
      const q = (s) => $(s, el);
      const iv = { set: "embauche", list: [], i: 0, results: [], session: null };
      q("#iv-sets").innerHTML = Object.entries(INTERVIEWS).map(([k, s], i) => `
        <button class="choice ${i ? "" : "active"}" data-set="${k}"><span class="module-icon">${s.icon}</span><b>${esc(s.name)}</b><small>${s.q.length} questions</small></button>`).join("");
      q("#iv-sets").addEventListener("click", (e) => {
        const b = e.target.closest("[data-set]");
        if (!b) return;
        iv.set = b.dataset.set;
        q("#iv-sets").querySelectorAll(".choice").forEach((c) => c.classList.toggle("active", c === b));
      });

      function askCurrent() {
        const item = iv.list[iv.i];
        q("#iv-step").textContent = `Question ${iv.i + 1} / ${iv.list.length}`;
        q("#iv-question").textContent = item.q;
        q("#iv-tip").textContent = item.tip;
        q("#iv-transcript").innerHTML = "";
        q("#iv-next").disabled = true;
        q("#iv-timer").textContent = fmtTime(+q("#iv-time").value);
        q("#iv-status").textContent = "L’examinateur pose la question…";
        if (q("#iv-voice").checked && "speechSynthesis" in window) speak(item.q, 0.95, () => setTimeout(record, 400));
        else setTimeout(record, 800);
      }

      async function record() {
        if (iv.session || q("#iv-run").hidden) return;
        const limit = +q("#iv-time").value;
        const s = new App.SpeechSession({
          onTranscript: (f, i) => { q("#iv-transcript").innerHTML = App.highlightFillers(f.join(" ")) + (i ? ` <span class="interim">${esc(i)}</span>` : ""); },
          onLevel: (rms) => { q("#iv-meter").style.width = App.clamp(rms * 500, 0, 100) + "%"; },
        });
        if (!(await s.start())) { q("#iv-status").textContent = s.error; return; }
        iv.session = s;
        q("#iv-rec").classList.add("on");
        q("#iv-status").textContent = "À vous : répondez à la question.";
        q("#iv-next").disabled = false;
        iv.clock = setInterval(() => {
          q("#iv-timer").textContent = fmtTime(Math.max(0, limit - s.elapsed));
          if (s.elapsed >= limit) finishAnswer();
        }, 250);
      }

      async function finishAnswer() {
        const s = iv.session;
        if (!s) return;
        iv.session = null;
        clearInterval(iv.clock);
        q("#iv-rec").classList.remove("on");
        q("#iv-meter").style.width = "0";
        q("#iv-next").disabled = true;
        q("#iv-status").textContent = "Analyse…";
        const r = await s.stop();
        iv.results.push({ q: iv.list[iv.i].q, r, a: App.analyze(r) });
        iv.i++;
        if (iv.i < iv.list.length) askCurrent();
        else summary();
      }

      function summary() {
        q("#iv-run").hidden = true;
        q("#iv-setup").hidden = false;
        const avg = Math.round(iv.results.reduce((s, x) => s + x.a.score, 0) / iv.results.length);
        const totalFill = iv.results.reduce((s, x) => s + (x.a.fillers || 0), 0);
        const wpms = iv.results.filter((x) => x.a.wpm).map((x) => x.a.wpm);
        const avgWpm = wpms.length ? Math.round(wpms.reduce((s, x) => s + x, 0) / wpms.length) : null;
        const short = iv.results.filter((x) => x.r.duration < 20).length;
        const tips = [];
        if (short) tips.push(["warn", `${short} réponse(s) très courte(s) : développez avec un exemple concret (méthode STAR).`]);
        if (totalFill > iv.results.length * 3) tips.push(["warn", "Nombreux tics de langage : prenez une seconde de silence avant de répondre plutôt qu’un « euh »."]);
        if (avgWpm && avgWpm > 170) tips.push(["warn", "Débit rapide : le stress accélère. Respirez entre les idées."]);
        if (avg >= 75) tips.push(["good", "Très bonne prestation d’ensemble : vous paraissez posé et clair."]);
        tips.push(["", "Réécoutez chaque réponse : la première phrase répond-elle directement à la question ?"]);
        q("#iv-summary").hidden = false;
        q("#iv-summary").innerHTML = `
          <div class="card">
            <div class="score-line"><h3>Bilan : ${esc(INTERVIEWS[iv.set].name)}</h3><span class="score-big">${avg}<small class="muted">/100</small></span></div>
            <div class="report-grid">
              <div class="metric"><b>${iv.results.length}</b><span>réponses</span></div>
              <div class="metric"><b>${avgWpm ?? "—"}</b><span>mots / minute (moy.)</span></div>
              <div class="metric"><b>${totalFill}</b><span>tics de langage au total</span></div>
              <div class="metric"><b>${fmtTime(iv.results.reduce((s, x) => s + x.r.duration, 0))}</b><span>temps de parole</span></div>
            </div>
            <ul class="feedback">${tips.map(([c, t]) => `<li class="${c}">${t}</li>`).join("")}</ul>
          </div>
          ${iv.results.map((x, i) => `
            <details class="card answer-card">
              <summary><b>Q${i + 1}.</b> ${esc(x.q)} <span class="pill">${x.a.score}/100</span></summary>
              ${App.reportHTML(x.r, x.a, { title: "Réponse " + (i + 1) })}
            </details>`).join("")}`;
        q("#iv-summary").scrollIntoView({ behavior: "smooth" });
        logActivity({ type: "interview", score: avg, label: INTERVIEWS[iv.set].name, duration: Math.round(iv.results.reduce((s, x) => s + x.r.duration, 0)) });
      }

      q("#iv-start").addEventListener("click", () => {
        const all = INTERVIEWS[iv.set].q;
        const list = q("#iv-random").checked ? [all[0], ...App.shuffle(all.slice(1))] : [...all];
        iv.list = list.slice(0, +q("#iv-count").value);
        iv.i = 0;
        iv.results = [];
        q("#iv-setup").hidden = true;
        q("#iv-summary").hidden = true;
        q("#iv-run").hidden = false;
        q("#iv-set-name").textContent = INTERVIEWS[iv.set].name;
        askCurrent();
      });
      q("#iv-next").addEventListener("click", finishAnswer);
      q("#iv-repeat").addEventListener("click", () => speak(iv.list[iv.i].q, 0.95));
      const quit = () => {
        if (iv.session) { iv.session.cancel(); iv.session = null; }
        clearInterval(iv.clock);
        App.stopSpeaking();
        q("#iv-rec").classList.remove("on");
        q("#iv-run").hidden = true;
        q("#iv-setup").hidden = false;
      };
      q("#iv-quit").addEventListener("click", quit);
      this.hide = quit;
    },
  });

  /* ---------- Storytelling ---------- */

  const CARD_LABEL = { personnage: "Personnage", lieu: "Lieu", objet: "Objet", probleme: "Rebondissement" };

  App.view({
    id: "histoire", title: "Storytelling", icon: "📖", group: "parole",
    desc: "Cartes à tirer et schéma narratif pour raconter",
    html: `
      <h1>Storytelling</h1>
      <p class="lead">Tirez quatre cartes et racontez une histoire qui les relie. Les histoires captivent bien plus que les faits : c’est l’arme secrète des grands orateurs.</p>
      <div class="story-cards" id="st-cards"></div>
      <div class="actions">
        <button class="btn" id="st-all">🎲 Tout retirer</button>
        <label class="check">Durée
          <select id="st-time"><option value="60">1 min</option><option value="120" selected>2 min</option><option value="180">3 min</option></select>
        </label>
        <button class="btn primary" id="st-go">🎙️ Raconter</button>
      </div>
      <div class="card">
        <h3>Le schéma narratif</h3>
        <ol class="steps">${STORY_STEPS.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol>
        <p class="muted small">Astuce : donnez un prénom à votre personnage, ajoutez un détail sensoriel (une odeur, un bruit) et au moins une réplique de dialogue.</p>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      const cards = {};
      Object.keys(STORY_CARDS).forEach((k) => { cards[k] = pick(STORY_CARDS[k]); });
      const render = () => {
        q("#st-cards").innerHTML = Object.entries(cards).map(([k, v]) => `
          <button class="story-card" data-k="${k}" title="Retirer cette carte">
            <small>${CARD_LABEL[k]}</small><b>${esc(v)}</b><span aria-hidden="true">🎲</span>
          </button>`).join("");
      };
      q("#st-cards").addEventListener("click", (e) => {
        const b = e.target.closest("[data-k]");
        if (!b) return;
        cards[b.dataset.k] = pickOther(STORY_CARDS[b.dataset.k], cards[b.dataset.k]);
        render();
      });
      q("#st-all").addEventListener("click", () => {
        Object.keys(cards).forEach((k) => { cards[k] = pickOther(STORY_CARDS[k], cards[k]); });
        render();
      });
      q("#st-go").addEventListener("click", () => App.startSpeech({
        topic: `Histoire : ${cards.personnage}, ${cards.lieu}, ${cards.objet}… ${cards.probleme}`,
        duration: +q("#st-time").value, mode: "histoire", back: ["histoire", "Nouvelle histoire"],
      }));
      render();
    },
  });

  App.SRWarning = () => (SR ? "" : `<p class="banner">Ce jeu utilise la reconnaissance vocale : ouvrez l’application dans Chrome ou Edge.</p>`);
})();
