/* Expression, apprentissage et réglages : vocabulaire, quiz, cours, atelier, paramètres. */
(() => {
  "use strict";
  const { $, $$, esc, store, pick, pickOther, shuffle, fmtTime, segmented, speak, logActivity, settings, go, download } = App;

  /* ---------- Vocabulaire & reformulation ---------- */

  App.view({
    id: "vocabulaire", title: "Vocabulaire & style", icon: "✒️", group: "expression",
    desc: "Mot du jour, lexique, reformulations, connecteurs, figures",
    html: `
      <h1>Vocabulaire &amp; style</h1>
      <p class="lead">L’éloquence, c’est aussi choisir le mot juste. Enrichissez votre vocabulaire, remplacez les mots « passe-partout », enchaînez vos idées avec les bons connecteurs et maîtrisez les figures de style.</p>
      <div class="card">
        <p class="eyebrow">Mot du jour</p>
        <div id="voc-word"></div>
        <div class="actions">
          <button class="btn" id="voc-say">🔊 Prononcer</button>
          <button class="btn" id="voc-fav">⭐ Ajouter à mon lexique</button>
          <button class="btn ghost" id="voc-random">Un autre mot</button>
        </div>
        <p class="muted small">Défi : utilisez ce mot aujourd’hui dans une conversation ou une improvisation.</p>
      </div>
      <div class="card">
        <h3>Mon lexique</h3>
        <div id="voc-lex"></div>
      </div>
      <div class="card">
        <h3>Remplacer les mots passe-partout</h3>
        <p class="muted">Cliquez sur un mot pour voir des alternatives plus précises.</p>
        <div class="chips" id="weak-chips"></div>
        <div id="weak-detail"></div>
      </div>
      <div class="card">
        <h3>Reformulation express</h3>
        <p class="muted">Reformulez la phrase de façon plus élégante et précise, à voix haute ou par écrit, puis comparez avec une proposition.</p>
        <p class="quote" id="ref-sentence"></p>
        <textarea id="ref-input" rows="2" placeholder="Votre reformulation…"></textarea>
        <div class="actions">
          <button class="btn" id="ref-show">Voir une proposition</button>
          <button class="btn ghost" id="ref-next">Autre phrase</button>
        </div>
        <p class="answer" id="ref-answer" hidden></p>
      </div>
      <div class="card">
        <h3>Connecteurs logiques</h3>
        <p class="muted">Les connecteurs sont les panneaux indicateurs de votre discours : ils montrent au public où va votre raisonnement.</p>
        <div class="connectors">${CONNECTEURS.map((c) => `<div><h4>${esc(c.f)}</h4><p>${c.w.map(esc).join(" · ")}</p></div>`).join("")}</div>
      </div>
      <div class="card">
        <h3>Figures de style de l’orateur</h3>
        <div class="figures">${FIGURES.map((f) => `<div class="figure"><h4>${esc(f.n)}</h4><p>${esc(f.d)}</p><p class="ex">${esc(f.e)}</p></div>`).join("")}</div>
        <div class="actions"><a class="btn" href="#quiz/figures">🧠 Tester mes connaissances</a></div>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      let word = WORDS[App.dayNumber() % WORDS.length];
      const lex = () => store.get("lexique", []);
      const renderWord = () => {
        q("#voc-word").innerHTML = App.wordHTML(word);
        q("#voc-fav").textContent = lex().includes(word.w) ? "✓ Dans mon lexique" : "⭐ Ajouter à mon lexique";
      };
      const renderLex = () => {
        const l = lex();
        q("#voc-lex").innerHTML = l.length
          ? `<div class="lexicon">${l.map((w) => {
            const x = WORDS.find((y) => y.w === w);
            return x ? `<div class="lex-item"><b>${esc(x.w)}</b> <span class="muted small">${esc(x.d)}</span><button class="btn small ghost" data-rm="${esc(x.w)}" aria-label="Retirer">✕</button></div>` : "";
          }).join("")}</div>`
          : `<p class="muted small">Ajoutez des mots avec ⭐ pour les réviser ici.</p>`;
      };
      q("#voc-random").addEventListener("click", () => { word = pickOther(WORDS, word); renderWord(); });
      q("#voc-say").addEventListener("click", () => speak(`${word.w}. ${word.e}`));
      q("#voc-fav").addEventListener("click", () => {
        const l = lex();
        if (!l.includes(word.w)) { l.push(word.w); store.set("lexique", l); }
        renderWord();
        renderLex();
      });
      q("#voc-lex").addEventListener("click", (e) => {
        const b = e.target.closest("[data-rm]");
        if (!b) return;
        store.set("lexique", lex().filter((w) => w !== b.dataset.rm));
        renderLex();
        renderWord();
      });

      q("#weak-chips").innerHTML = Object.keys(WEAK_WORDS).map((k) => `<button class="chip" data-w="${esc(k)}">${esc(k)}</button>`).join("");
      q("#weak-chips").addEventListener("click", (e) => {
        const b = e.target.closest(".chip");
        if (!b) return;
        $$(".chip", q("#weak-chips")).forEach((c) => c.classList.toggle("active", c === b));
        const w = WEAK_WORDS[b.dataset.w];
        q("#weak-detail").innerHTML = `
          <p><b>Alternatives :</b> ${w.alt.map(esc).join(", ")}.</p>
          ${w.ex.map((x) => `<p class="example">${esc(x)}</p>`).join("")}`;
      });

      let ref = pick(REFORMULATIONS);
      const refRender = () => {
        q("#ref-sentence").textContent = "« " + ref.s + " »";
        q("#ref-answer").hidden = true;
        q("#ref-input").value = "";
      };
      q("#ref-show").addEventListener("click", () => {
        q("#ref-answer").textContent = "💡 " + ref.a;
        q("#ref-answer").hidden = false;
      });
      q("#ref-next").addEventListener("click", () => { ref = pickOther(REFORMULATIONS, ref); refRender(); });
      renderWord();
      renderLex();
      refRender();
    },
    show() { App.markDaily("vocab"); },
  });

  /* ---------- Quiz ---------- */

  function withOptions(correct, pool, n = 4) {
    const others = shuffle(pool.filter((x) => x !== correct)).slice(0, n - 1);
    const o = shuffle([correct, ...others]);
    return { o, a: o.indexOf(correct) };
  }
  const QUIZZES = {
    vocabulaire: {
      n: "Vocabulaire", i: "📚",
      make: () => shuffle(WORDS).slice(0, 10).map((w) => ({ q: `Quel mot correspond à cette définition : « ${w.d} »`, ...withOptions(w.w, WORDS.map((x) => x.w)), why: w.e })),
    },
    figures: {
      n: "Figures de style", i: "🎨",
      make: () => shuffle(FIGURES).slice(0, 10).map((f) => ({ q: `Quelle figure de style ? ${f.e}`, ...withOptions(f.n, FIGURES.map((x) => x.n)), why: f.d })),
    },
    connecteurs: {
      n: "Connecteurs", i: "🔗",
      make: () => shuffle(CONNECTEUR_QUIZ).slice(0, 10).map((c) => ({ q: c.q, ...withOptions(c.o[c.a], c.o), why: c.why })),
    },
    vraifaux: {
      n: "Vrai ou faux de l’orateur", i: "✅",
      make: () => shuffle(TRUE_FALSE).slice(0, 10).map((t) => ({ q: t.s, o: ["Vrai", "Faux"], a: t.a ? 0 : 1, why: t.why })),
    },
    cours: {
      n: "Les cours", i: "🎓",
      make: () => shuffle(LESSONS.flatMap((l) => l.quiz.map((x) => ({ ...x, lesson: l.title })))).slice(0, 10)
        .map((x) => ({ q: x.q, ...withOptions(x.o[x.a], x.o), why: `${x.why} (Cours : ${x.lesson})` })),
    },
  };

  App.view({
    id: "quiz", title: "Quiz", icon: "🧠", group: "expression",
    desc: "Vocabulaire, figures, connecteurs, vrai ou faux",
    html: `
      <h1>Quiz</h1>
      <p class="lead">Testez et consolidez vos connaissances. Chaque réponse est expliquée.</p>
      <div class="choice-grid" id="qz-list"></div>
      <div class="card" id="qz-run" hidden></div>`,
    init(el) {
      const q = (s) => $(s, el);
      const best = () => store.get("quizBest", {});
      const renderList = () => {
        q("#qz-list").innerHTML = Object.entries(QUIZZES).map(([k, z]) => `
          <button class="choice" data-quiz="${k}"><span class="module-icon">${z.i}</span><b>${esc(z.n)}</b><small>${best()[k] != null ? `Meilleur score : ${best()[k]} %` : "Pas encore tenté"}</small></button>`).join("");
      };
      const qz = {};
      function startQuiz(k) {
        Object.assign(qz, { k, items: QUIZZES[k].make(), i: 0, good: 0, answered: false });
        q("#qz-run").hidden = false;
        renderQ();
        q("#qz-run").scrollIntoView({ behavior: "smooth", block: "start" });
      }
      function renderQ() {
        const it = qz.items[qz.i];
        q("#qz-run").innerHTML = `
          <div class="twister-meta"><span class="pill">${esc(QUIZZES[qz.k].n)}</span><span class="muted">Question ${qz.i + 1} / ${qz.items.length}</span><span class="muted">Score : ${qz.good}</span></div>
          <div class="progress"><div style="width:${(qz.i / qz.items.length) * 100}%"></div></div>
          <p class="quiz-q">${esc(it.q)}</p>
          <div class="options">${it.o.map((o, i) => `<button class="option" data-i="${i}">${esc(o)}</button>`).join("")}</div>
          <p class="answer" id="qz-why" hidden></p>
          <div class="actions"><button class="btn primary" id="qz-next" hidden>Suivant →</button></div>`;
        qz.answered = false;
      }
      function finish() {
        const pct = Math.round((qz.good / qz.items.length) * 100);
        const b = best();
        b[qz.k] = Math.max(b[qz.k] || 0, pct);
        store.set("quizBest", b);
        q("#qz-run").innerHTML = `
          <div class="score-line"><h3>${esc(QUIZZES[qz.k].n)}</h3><span class="score-big">${qz.good}/${qz.items.length}</span></div>
          <p>${pct === 100 ? "Sans faute, bravo ! 🏆" : pct >= 70 ? "Très bon résultat !" : "Continuez : relisez les explications et retentez votre chance."}</p>
          <div class="actions"><button class="btn primary" data-quiz="${qz.k}">Rejouer</button><a class="btn ghost" href="#cours">Revoir les cours</a></div>`;
        logActivity({ type: "quiz", score: pct, label: QUIZZES[qz.k].n });
        renderList();
      }
      el.addEventListener("click", (e) => {
        const start = e.target.closest("[data-quiz]");
        if (start) { startQuiz(start.dataset.quiz); return; }
        const opt = e.target.closest(".option");
        if (opt && !qz.answered) {
          qz.answered = true;
          const it = qz.items[qz.i];
          const ok = +opt.dataset.i === it.a;
          if (ok) qz.good++;
          $$(".option", q("#qz-run")).forEach((b) => {
            b.disabled = true;
            if (+b.dataset.i === it.a) b.classList.add("right");
          });
          if (!ok) opt.classList.add("wrong");
          const why = q("#qz-why");
          why.hidden = false;
          why.className = "answer " + (ok ? "" : "bad");
          why.textContent = (ok ? "✅ Bonne réponse. " : "❌ Raté. ") + it.why;
          q("#qz-next").hidden = false;
          q("#qz-next").textContent = qz.i + 1 < qz.items.length ? "Suivant →" : "Voir le résultat";
          return;
        }
        if (e.target.closest("#qz-next")) {
          qz.i++;
          if (qz.i < qz.items.length) renderQ(); else finish();
        }
      });
      renderList();
      this.startQuiz = startQuiz;
    },
    show(el, param) {
      if (param && QUIZZES[param]) this.startQuiz(param);
      App.markDaily("vocab");
    },
  });

  /* ---------- Cours ---------- */

  const lessonsRead = () => store.get("lessons", {});
  function markRead(id) {
    const r = lessonsRead();
    if (r[id]) return;
    r[id] = new Date().toISOString();
    store.set("lessons", r);
    const l = LESSONS.find((x) => x.id === id);
    logActivity({ type: "lesson", label: l.title });
  }

  App.view({
    id: "cours", title: "Cours & fiches", icon: "🎓", group: "apprendre",
    desc: `${LESSONS.length} fiches pratiques : trac, voix, structure, persuasion…`,
    html: `<div id="cs-body"></div>`,
    show(el, param) {
      const body = $("#cs-body", el);
      const lesson = LESSONS.find((l) => l.id === param);
      const read = lessonsRead();
      if (!lesson) {
        body.innerHTML = `
          <h1>Cours &amp; fiches</h1>
          <p class="lead">Les techniques des grands orateurs, en fiches courtes et pratiques. Chaque fiche se termine par un exercice et un mini-quiz.</p>
          <div class="progress"><div style="width:${(Object.keys(read).length / LESSONS.length) * 100}%"></div></div>
          <p class="muted small">${Object.keys(read).length} / ${LESSONS.length} fiches lues</p>
          <div class="modules">${LESSONS.map((l, i) => `
            <a class="module ${read[l.id] ? "read" : ""}" href="#cours/${l.id}">
              <span class="module-icon">${l.icon}</span>
              <span><b>${i + 1}. ${esc(l.title)}</b><small>${read[l.id] ? "✓ Lu" : esc(l.intro.slice(0, 70)) + "…"}</small></span>
            </a>`).join("")}</div>`;
        App.markDaily("vocab");
        return;
      }
      const i = LESSONS.indexOf(lesson);
      const prev = LESSONS[i - 1], next = LESSONS[i + 1];
      body.innerHTML = `
        <a class="back" href="#cours">← Tous les cours</a>
        <p class="eyebrow">Fiche ${i + 1} / ${LESSONS.length}</p>
        <h1>${lesson.icon} ${esc(lesson.title)}</h1>
        <p class="lead">${esc(lesson.intro)}</p>
        <div class="lesson-points">${lesson.points.map(([h, p], k) => `
          <div class="card point"><span class="num">${k + 1}</span><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></div>`).join("")}</div>
        <div class="card exercise">
          <p class="eyebrow">Exercice pratique</p>
          <p>${esc(lesson.exercise.t)}</p>
          <a class="btn primary" href="#${lesson.exercise.view}">Faire l’exercice →</a>
        </div>
        <div class="card">
          <h3>Mini-quiz</h3>
          ${lesson.quiz.map((x, k) => `
            <div class="mini-quiz" data-k="${k}">
              <p class="quiz-q">${esc(x.q)}</p>
              <div class="options">${x.o.map((o, j) => `<button class="option" data-j="${j}">${esc(o)}</button>`).join("")}</div>
              <p class="answer" hidden></p>
            </div>`).join("")}
        </div>
        <div class="actions spread">
          ${prev ? `<a class="btn ghost" href="#cours/${prev.id}">← ${esc(prev.title)}</a>` : "<span></span>"}
          <button class="btn" id="cs-read">${read[lesson.id] ? "✓ Fiche lue" : "Marquer comme lue"}</button>
          ${next ? `<a class="btn ghost" href="#cours/${next.id}">${esc(next.title)} →</a>` : "<span></span>"}
        </div>`;
      $("#cs-read", el).addEventListener("click", (e) => { markRead(lesson.id); e.target.textContent = "✓ Fiche lue"; });
      $$(".mini-quiz", el).forEach((mq) => mq.addEventListener("click", (e) => {
        const b = e.target.closest(".option");
        if (!b || mq.dataset.done) return;
        mq.dataset.done = "1";
        const x = lesson.quiz[+mq.dataset.k];
        const ok = +b.dataset.j === x.a;
        $$(".option", mq).forEach((o) => { o.disabled = true; if (+o.dataset.j === x.a) o.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        const a = $(".answer", mq);
        a.hidden = false;
        a.className = "answer " + (ok ? "" : "bad");
        a.textContent = (ok ? "✅ " : "❌ ") + x.why;
        if ($$(".mini-quiz", el).every((m) => m.dataset.done)) {
          markRead(lesson.id);
          $("#cs-read", el).textContent = "✓ Fiche lue";
        }
      }));
    },
  });

  /* ---------- Atelier : préparer un discours ---------- */

  const HOOKS = [
    ["La question", "Qui, parmi vous, a déjà… ?"],
    ["Le chiffre choc", "Saviez-vous que… ?"],
    ["L’anecdote", "Il y a quelques années, j’ai vécu…"],
    ["La citation", "« … », disait… Cette phrase résume parfaitement…"],
    ["L’image", "Imaginez que demain…"],
    ["Le paradoxe", "On pense souvent que… En réalité, c’est tout l’inverse."],
  ];
  const FIELDS = [
    ["accroche", "Accroche", "La première phrase : question, anecdote, chiffre choc…", 2],
    ["intro", "Introduction et annonce du plan", "Présentez le sujet et annoncez vos parties.", 2],
    ["p1", "Partie 1", "Idée + argument + exemple", 3],
    ["p2", "Partie 2", "Idée + argument + exemple", 3],
    ["p3", "Partie 3 (facultative)", "Idée + argument + exemple", 3],
    ["conclusion", "Conclusion", "Résumé, écho à l’accroche, dernière phrase forte.", 2],
    ["action", "Appel à l’action", "Que doit faire votre public en repartant ?", 1],
  ];
  const blankDraft = () => ({ id: Date.now().toString(36), titre: "Nouveau discours", objectif: "convaincre", public: "", duree: 3, message: "" });
  const drafts = () => store.get("drafts", []);
  const composeText = (d) => FIELDS.map(([k]) => (d[k] || "").trim()).filter(Boolean).join("\n\n");
  App.atelierText = () => {
    const all = drafts();
    const cur = all.find((d) => d.id === store.get("draftCurrent")) || all[0];
    return cur ? composeText(cur) : "";
  };

  App.view({
    id: "atelier", title: "Préparer un discours", icon: "📝", group: "apprendre",
    desc: "Construisez, chronométrez et répétez vos discours",
    html: `
      <h1>Préparer un discours</h1>
      <p class="lead">Construisez votre discours étape par étape, vérifiez sa durée, puis répétez-le au téléprompteur ou prononcez-le pour obtenir une analyse.</p>
      <div class="toolbar">
        <select id="at-list" aria-label="Mes discours"></select>
        <button class="btn small" id="at-new">＋ Nouveau</button>
        <button class="btn small ghost" id="at-del">Supprimer</button>
        <button class="btn small ghost" id="at-export">⬇️ Exporter (.txt)</button>
      </div>
      <div class="card">
        <label class="field"><span>Titre</span><input type="text" data-f="titre"></label>
        <div class="grid-3">
          <label class="field"><span>Objectif</span>
            <select data-f="objectif"><option value="informer">Informer</option><option value="convaincre">Convaincre</option><option value="emouvoir">Émouvoir</option><option value="divertir">Divertir</option><option value="presenter">Me présenter</option></select>
          </label>
          <label class="field"><span>Public</span><input type="text" data-f="public" placeholder="Collègues, jury, amis…"></label>
          <label class="field"><span>Durée visée (min)</span><input type="number" min="1" max="60" data-f="duree"></label>
        </div>
        <label class="field"><span>Message clé : si le public ne retient qu’une phrase…</span><input type="text" data-f="message" placeholder="En une phrase"></label>
      </div>
      <div class="card">
        <div class="builder" id="at-fields"></div>
        <details class="details"><summary>💡 Idées d’accroche</summary>
          <div class="grid-3">${HOOKS.map(([t, x]) => `<div><h4>${esc(t)}</h4><p class="small muted">${esc(x)}</p></div>`).join("")}</div>
        </details>
      </div>
      <div class="card sticky-summary">
        <div class="report-grid" id="at-stats"></div>
        <ul class="feedback" id="at-checks"></ul>
        <div class="actions">
          <button class="btn primary" id="at-read">📜 Répéter au téléprompteur</button>
          <button class="btn" id="at-speak">🎙️ Prononcer sans notes</button>
        </div>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      q("#at-fields").innerHTML = FIELDS.map(([k, l, p, rows]) => `
        <label class="field"><span>${esc(l)}</span><textarea rows="${rows}" data-f="${k}" placeholder="${esc(p)}"></textarea></label>`).join("");
      let all = drafts();
      if (!all.length) { all = [blankDraft()]; store.set("drafts", all); }
      let cur = all.find((d) => d.id === store.get("draftCurrent")) || all[0];
      const save = () => {
        all = all.map((d) => (d.id === cur.id ? cur : d));
        store.set("drafts", all);
        store.set("draftCurrent", cur.id);
      };
      function renderList() {
        q("#at-list").innerHTML = all.map((d) => `<option value="${d.id}" ${d.id === cur.id ? "selected" : ""}>${esc(d.titre || "Sans titre")}</option>`).join("");
      }
      function fill() {
        $$("[data-f]", el).forEach((f) => { f.value = cur[f.dataset.f] ?? ""; });
        stats();
      }
      function stats() {
        const text = composeText(cur);
        const words = App.tokens(text).length;
        const secs = (words / 140) * 60;
        const target = (+cur.duree || 3) * 60;
        const ratio = secs / target;
        q("#at-stats").innerHTML = `
          <div class="metric"><b>${words}</b><span>mots</span></div>
          <div class="metric ${ratio > 1.15 ? "bad" : ratio < 0.7 ? "warn" : "good"}"><b>${fmtTime(secs)}</b><span>durée estimée (à 140 mots/min)</span></div>
          <div class="metric"><b>${fmtTime(target)}</b><span>durée visée</span></div>`;
        const checks = [];
        if (!(cur.message || "").trim()) checks.push(["warn", "Définissez votre message clé : tout le discours doit le servir."]);
        if (!(cur.accroche || "").trim()) checks.push(["warn", "Ajoutez une accroche forte (évitez « Bonjour, je vais vous parler de… »)."]);
        if (/^\s*(bonjour|alors|donc|euh)/i.test(cur.accroche || "")) checks.push(["warn", "Votre accroche commence par un mot faible : entrez directement dans le vif du sujet."]);
        if (!(cur.conclusion || "").trim()) checks.push(["warn", "Rédigez une conclusion : c’est ce que le public retiendra le mieux."]);
        if (ratio > 1.15) checks.push(["bad", "Trop long pour la durée visée : coupez ou resserrez vos parties."]);
        else if (words && ratio < 0.7) checks.push(["warn", "Un peu court : développez avec des exemples concrets."]);
        const fill = App.countFillers(App.tokens(text)).total;
        if (fill) checks.push(["warn", `${fill} tic(s) de langage écrit(s) dans le texte : supprimez-les.`]);
        if (!checks.length && words) checks.push(["good", "Structure complète : place à la répétition !"]);
        q("#at-checks").innerHTML = checks.map(([c, t]) => `<li class="${c}">${t}</li>`).join("");
      }
      el.addEventListener("input", (e) => {
        const f = e.target.closest("[data-f]");
        if (!f) return;
        cur[f.dataset.f] = f.type === "number" ? +f.value : f.value;
        save();
        if (f.dataset.f === "titre") renderList();
        stats();
      });
      el.addEventListener("change", (e) => { if (e.target.matches("select[data-f]")) { cur[e.target.dataset.f] = e.target.value; save(); } });
      q("#at-list").addEventListener("change", (e) => {
        cur = all.find((d) => d.id === e.target.value);
        store.set("draftCurrent", cur.id);
        fill();
      });
      q("#at-new").addEventListener("click", () => {
        cur = blankDraft();
        all.push(cur);
        save();
        renderList();
        fill();
        q("[data-f=titre]").focus();
      });
      q("#at-del").addEventListener("click", () => {
        if (!confirm(`Supprimer « ${cur.titre} » ?`)) return;
        all = all.filter((d) => d.id !== cur.id);
        if (!all.length) all = [blankDraft()];
        cur = all[0];
        save();
        renderList();
        fill();
      });
      q("#at-export").addEventListener("click", () => {
        const head = `${cur.titre}\nObjectif : ${cur.objectif} · Public : ${cur.public || "—"} · Durée : ${cur.duree} min\nMessage clé : ${cur.message || "—"}\n\n`;
        download(`${(cur.titre || "discours").replace(/[^\p{L}\d]+/gu, "-")}.txt`, head + FIELDS.map(([k, l]) => (cur[k] ? `— ${l} —\n${cur[k].trim()}` : "")).filter(Boolean).join("\n\n"));
      });
      q("#at-read").addEventListener("click", () => { App.pendingReading = "atelier"; go("lecture"); });
      q("#at-speak").addEventListener("click", () => App.startSpeech({ topic: cur.titre, duration: (+cur.duree || 3) * 60, mode: "atelier", back: ["atelier", "Retour à l’atelier"] }));
      renderList();
      fill();
    },
  });

  /* ---------- Paramètres ---------- */

  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e; });

  App.view({
    id: "parametres", title: "Paramètres", icon: "⚙️", group: "reglages",
    html: `
      <h1>Paramètres</h1>
      <div class="card settings">
        <label class="field"><span>Votre prénom</span><input type="text" id="st-name" placeholder="Pour vous saluer sur l’accueil"></label>
        <label class="field"><span>Thème</span>
          <select id="st-theme"><option value="auto">Automatique (système)</option><option value="light">Clair</option><option value="dark">Sombre</option></select>
        </label>
        <label class="field"><span>Langue de reconnaissance vocale</span>
          <select id="st-lang"><option value="fr-FR">Français (France)</option><option value="fr-BE">Français (Belgique)</option><option value="fr-CH">Français (Suisse)</option><option value="fr-CA">Français (Canada)</option></select>
        </label>
        <label class="field"><span>Voix de lecture</span><select id="st-voice"></select></label>
        <label class="field"><span>Vitesse de lecture : <b id="st-rate-v"></b></span><input type="range" id="st-rate" min="0.6" max="1.4" step="0.05"></label>
        <div class="actions"><button class="btn" id="st-test">🔊 Tester la voix</button></div>
      </div>
      <div class="card">
        <h3>Vos données</h3>
        <p class="muted small">Tout est enregistré uniquement dans ce navigateur. Exportez une sauvegarde pour la transférer sur un autre appareil.</p>
        <div class="actions">
          <button class="btn" id="st-export">⬇️ Exporter mes données</button>
          <label class="btn">⬆️ Importer<input type="file" id="st-import" accept="application/json" hidden></label>
          <button class="btn ghost danger" id="st-reset">Tout effacer</button>
        </div>
      </div>
      <div class="card">
        <h3>Application</h3>
        <p class="muted small">Installez Éloquence sur votre téléphone ou votre ordinateur pour l’ouvrir comme une application, même hors connexion (hors reconnaissance vocale).</p>
        <div class="actions"><button class="btn primary" id="st-install">📲 Installer l’application</button></div>
        <p class="muted small" id="st-install-help"></p>
        <p class="muted small">La reconnaissance vocale fonctionne dans Chrome et Edge. Les enregistrements audio restent sur votre appareil ; la transcription de Chrome passe par le service de reconnaissance de Google.</p>
      </div>`,
    init(el) {
      const q = (s) => $(s, el);
      q("#st-name").value = settings.get("name");
      q("#st-theme").value = settings.get("theme");
      q("#st-lang").value = settings.get("lang");
      q("#st-rate").value = settings.get("rate");
      q("#st-rate-v").textContent = "×" + settings.get("rate");
      q("#st-name").addEventListener("input", (e) => settings.set("name", e.target.value.trim()));
      q("#st-theme").addEventListener("change", (e) => settings.set("theme", e.target.value));
      q("#st-lang").addEventListener("change", (e) => settings.set("lang", e.target.value));
      q("#st-rate").addEventListener("input", (e) => { settings.set("rate", +e.target.value); q("#st-rate-v").textContent = "×" + e.target.value; });
      q("#st-voice").addEventListener("change", (e) => settings.set("voice", e.target.value));
      q("#st-test").addEventListener("click", () => speak("Bonjour ! Ce que l'on conçoit bien s'énonce clairement."));
      q("#st-export").addEventListener("click", () => {
        const data = {};
        store.keys().forEach((k) => { data[k] = localStorage.getItem(k); });
        download(`eloquence-sauvegarde-${App.todayKey()}.json`, JSON.stringify(data, null, 2), "application/json");
      });
      q("#st-import").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          Object.entries(data).forEach(([k, v]) => { if (k.startsWith("eloquence.")) localStorage.setItem(k, v); });
          App.toast("✅ Données importées");
          setTimeout(() => location.reload(), 800);
        } catch {
          App.toast("❌ Fichier invalide");
        }
      });
      q("#st-reset").addEventListener("click", () => {
        if (!confirm("Effacer toute votre progression, vos discours et vos réglages ?")) return;
        store.keys().forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignoré */ } });
        location.hash = "accueil";
        location.reload();
      });
      q("#st-install").addEventListener("click", async () => {
        if (installPrompt) {
          installPrompt.prompt();
          installPrompt = null;
        } else {
          q("#st-install-help").textContent = "Sur iPhone : bouton Partager puis « Sur l’écran d’accueil ». Sur Android ou ordinateur : menu du navigateur puis « Installer l’application ».";
        }
      });
    },
    show(el) {
      const voices = App.frenchVoices();
      const sel = $("#st-voice", el);
      sel.innerHTML = voices.length
        ? voices.map((v) => `<option value="${esc(v.name)}">${esc(v.name)} (${esc(v.lang)})</option>`).join("")
        : `<option value="">Voix française par défaut</option>`;
      if (settings.get("voice")) sel.value = settings.get("voice");
    },
  });
})();
