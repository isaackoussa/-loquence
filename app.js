/* Éloquence — application d'entraînement à la prise de parole. */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  /* ---------- Utilitaires ---------- */

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
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const todayKey = (d = new Date()) => d.toLocaleDateString("sv");
  const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  function norm(s) {
    return s.toLowerCase()
      .replace(/œ/g, "oe").replace(/æ/g, "ae")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/['’\-]/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ").trim();
  }

  function frNum(n) {
    const u = ["zero", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
    if (n < 17) return u[n];
    if (n < 20) return "dix " + u[n - 10];
    if (n < 100) {
      const tens = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante", 8: "quatre vingt" };
      let d = Math.floor(n / 10), r = n % 10;
      if (d === 7 || d === 9) { d--; r += 10; }
      if (r === 0) return tens[d];
      if ((r === 1 || r === 11) && d !== 8) return tens[d] + " et " + u[r];
      return tens[d] + " " + frNum(r);
    }
    if (n < 1000) {
      const c = Math.floor(n / 100), r = n % 100;
      return (c > 1 ? u[c] + " " : "") + "cent" + (r ? " " + frNum(r) : "");
    }
    if (n < 1e6) {
      const m = Math.floor(n / 1000), r = n % 1000;
      return (m > 1 ? frNum(m) + " " : "") + "mille" + (r ? " " + frNum(r) : "");
    }
    return String(n);
  }

  /* Découpe en mots normalisés, chiffres écrits en toutes lettres. */
  function tokens(s) {
    return norm(s).split(" ").filter(Boolean)
      .flatMap((w) => (/^\d+$/.test(w) ? frNum(+w).split(" ") : [w]));
  }

  /* Clé phonétique grossière : rapproche les homophones (ver / vert / verre / vers). */
  function phon(w) {
    return w
      .replace(/^h/, "")
      .replace(/sc(?=[eiy])/g, "s").replace(/c(?=[eiy])/g, "s")
      .replace(/qu/g, "k").replace(/ph/g, "f").replace(/y/g, "i")
      .replace(/eau|au/g, "o").replace(/ai|ei/g, "e").replace(/(?<=...)(ez|er)$/, "e")
      .replace(/(.)\1+/g, "$1")
      .replace(/(ent|[sxtdpe])+$/g, (m, _g, off) => (off > 1 ? "" : m)) || w;
  }

  /* Plus longue sous-séquence commune : indices des mots cibles reconnus. */
  function lcsMatch(target, spoken) {
    const a = target.map(phon), b = spoken.map(phon);
    const n = a.length, m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const matched = new Set();
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { matched.add(i); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return matched;
  }

  /* Synthèse vocale française. */
  function speak(text, rate = 0.9) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = rate;
    const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("fr"));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  function segmented(el, onChange) {
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !el.contains(btn)) return;
      el.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      onChange(btn.dataset);
    });
  }

  /* ---------- Historique & progression ---------- */

  const history = () => store.get("history", []);
  function logActivity(entry) {
    const h = history();
    h.unshift({ date: new Date().toISOString(), day: todayKey(), ...entry });
    store.set("history", h.slice(0, 500));
    renderHome();
  }
  function markDaily(key) {
    const d = store.get("daily", {});
    if (d.day !== todayKey()) { d.day = todayKey(); d.done = {}; }
    d.done[key] = true;
    store.set("daily", d);
  }
  function dailyDone() {
    const d = store.get("daily", {});
    const done = d.day === todayKey() ? { ...d.done } : {};
    const today = history().filter((h) => h.day === todayKey());
    if (today.filter((h) => h.type === "twister").length >= 3) done.twister = true;
    if (today.some((h) => h.type === "speech")) done.speech = true;
    if (today.some((h) => h.type === "breath" || h.type === "warmup")) done.souffle = true;
    return done;
  }
  function streak() {
    const days = new Set(history().map((h) => h.day));
    const d = new Date();
    if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------- Navigation ---------- */

  const TABS = ["accueil", "virelangues", "lecture", "discours", "impro", "souffle", "vocabulaire"];
  function showTab(name) {
    if (!TABS.includes(name)) name = "accueil";
    TABS.forEach((t) => { $("#tab-" + t).hidden = t !== name; });
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    const current = $(`.tabs button[data-tab="${name}"]`);
    current && current.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (name === "vocabulaire") markDaily("vocab");
    if (name === "accueil") renderHome();
    window.scrollTo({ top: 0 });
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => { location.hash = b.dataset.tab; }));
  window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

  /* ---------- Accueil ---------- */

  const TYPE_LABEL = { twister: "Virelangue", speech: "Discours", breath: "Respiration", warmup: "Échauffement", reading: "Lecture", intonation: "Intonation" };

  function renderHome() {
    const h = history();
    const speeches = h.filter((x) => x.type === "speech" && x.wpm).slice(0, 5);
    const avg = (arr, k) => (arr.length ? arr.reduce((s, x) => s + x[k], 0) / arr.length : null);
    const wpm = avg(speeches, "wpm");
    const fpm = avg(speeches.filter((x) => x.fpm != null), "fpm");
    const tw = h.filter((x) => x.type === "twister").slice(0, 10);
    const twAvg = avg(tw, "score");

    $("#stats").innerHTML = [
      [streak(), "jour(s) d’affilée 🔥"],
      [h.length, "exercices réalisés"],
      [twAvg != null ? Math.round(twAvg) + " %" : "—", "précision articulation"],
      [wpm != null ? Math.round(wpm) : "—", "mots / minute (moy.)"],
      [fpm != null ? fpm.toFixed(1) : "—", "tics / minute (moy.)"],
    ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");

    const done = dailyDone();
    const steps = [
      ["souffle", "souffle", "Respirer & s’échauffer", "Une respiration ou l’échauffement vocal guidé"],
      ["twister", "virelangues", "3 virelangues", "Articulez lentement, puis accélérez"],
      ["speech", "impro", "1 prise de parole", "Improvisez sur un sujet ou parlez librement"],
      ["vocab", "vocabulaire", "Mot du jour & expression", "Enrichissez votre vocabulaire"],
    ];
    $("#daily").innerHTML = steps.map(([k, tab, t, s], i) => `
      <li data-go="${tab}" class="${done[k] ? "done" : ""}">
        <span class="num">${done[k] ? "✓" : i + 1}</span>
        <div><div class="d-title">${t}</div><div class="d-sub">${s}</div></div>
      </li>`).join("");

    const w = WORDS[dayNumber() % WORDS.length];
    $("#home-word").innerHTML = wordHTML(w);
    $("#home-tip").textContent = TIPS[dayNumber() % TIPS.length];

    $("#history").innerHTML = h.length
      ? h.slice(0, 12).map((x) => `
        <div class="row">
          <span><b>${TYPE_LABEL[x.type] || x.type}</b> · ${esc(x.label || "")}</span>
          <span class="muted">${x.score != null ? `${Math.round(x.score)}${x.type === "twister" ? " %" : "/100"} · ` : ""}${new Date(x.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>`).join("")
      : `<p class="muted">Aucun exercice pour l’instant. Commencez par la séance du jour !</p>`;
    $("#reset-history").hidden = !h.length;
  }
  $("#daily").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-go]");
    if (li) location.hash = li.dataset.go;
  });
  $("#reset-history").addEventListener("click", () => {
    if (confirm("Effacer tout l’historique de progression ?")) {
      store.set("history", []);
      store.set("daily", {});
      renderHome();
    }
  });

  function wordHTML(w) {
    return `<p class="word-big">${esc(w.w)}</p>
      <p class="word-nature">${esc(w.n)}</p>
      <p>${esc(w.d)}</p>
      <p class="example">${esc(w.e)}</p>`;
  }

  /* ---------- Virelangues ---------- */

  const tw = { level: "tous", list: TWISTERS, idx: 0, rec: null, listening: false };

  function twFilter() {
    tw.list = tw.level === "tous" ? TWISTERS : TWISTERS.filter((t) => t.level === tw.level);
    tw.idx = 0;
    twRender();
  }
  function twRender(matched) {
    const item = tw.list[tw.idx];
    const words = item.t.split(/\s+/);
    // Associe chaque mot affiché à ses jetons normalisés pour surligner le résultat.
    let k = 0;
    const html = words.map((w) => {
      const n = tokens(w).length;
      let cls = "";
      if (matched) {
        const ids = Array.from({ length: n }, (_, i) => k + i);
        const reps = $("#tw-triple").checked ? 3 : 1;
        const per = tokens(item.t).length;
        const hit = ids.every((id) => [...Array(reps).keys()].some((r) => matched.has(id + r * per)));
        cls = n === 0 ? "" : hit ? "ok" : "ko";
      }
      k += n;
      return `<span class="w ${cls}">${esc(w)}</span>`;
    }).join(" ");
    $("#tw-text").innerHTML = html;
    const badge = $("#tw-badge");
    badge.textContent = item.level;
    badge.className = "pill " + item.level;
    $("#tw-focus").textContent = item.focus;
    $("#tw-count").textContent = `${tw.idx + 1} / ${tw.list.length}`;
    const best = store.get("twBest", {})[item.t];
    $("#tw-tip").textContent = $("#tw-pen").checked
      ? "✏️ Placez un stylo horizontalement entre les dents et articulez au maximum. La reconnaissance sera moins précise : c’est normal. Relisez ensuite sans le stylo, vous sentirez la différence !"
      : pick(TWISTER_TIPS) + (best != null ? ` — Votre meilleur score : ${best} %.` : "");
    if (!matched) { $("#tw-result").hidden = true; $("#tw-live").hidden = true; }
  }

  function twStart() {
    if (!SR) return;
    if (tw.listening) { tw.rec && tw.rec.stop(); return; }
    window.speechSynthesis && speechSynthesis.cancel();
    const item = tw.list[tw.idx];
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;
    tw.rec = rec;
    tw.listening = true;
    let finals = [], interim = "", start = performance.now(), last = null, silenceTimer = null;
    const maxTimer = setTimeout(() => rec.stop(), $("#tw-triple").checked ? 45000 : 25000);
    const btn = $("#tw-rec");
    btn.textContent = "⏹️ Terminer";
    btn.classList.add("recording");
    $("#tw-live").hidden = false;
    $("#tw-live").textContent = "Je vous écoute…";
    $("#tw-result").hidden = true;

    rec.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals.push(r[0].transcript);
        else interim += r[0].transcript;
      }
      last = performance.now();
      $("#tw-live").textContent = (finals.join(" ") + " " + interim).trim() || "…";
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => rec.stop(), 2200);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        $("#tw-live").textContent = "Accès au micro refusé. Autorisez le micro dans votre navigateur.";
      } else if (e.error === "no-speech") {
        $("#tw-live").textContent = "Aucune parole détectée. Réessayez en parlant plus fort.";
      }
    };
    rec.onend = () => {
      clearTimeout(maxTimer);
      clearTimeout(silenceTimer);
      tw.listening = false;
      btn.textContent = "🎙️ À vous !";
      btn.classList.remove("recording");
      const said = (finals.join(" ") + " " + interim).trim();
      if (!said) return;
      const reps = $("#tw-triple").checked ? 3 : 1;
      const target = Array(reps).fill(tokens(item.t)).flat();
      const matched = lcsMatch(target, tokens(said));
      const score = Math.round((matched.size / target.length) * 100);
      const secs = ((last || performance.now()) - start) / 1000;
      twShowResult(item, score, secs, said, matched);
    };
    try { rec.start(); } catch { tw.listening = false; }
  }

  function twShowResult(item, score, secs, said, matched) {
    twRender(matched);
    const stars = score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
    const msg = score >= 95 ? "Parfait ! Essayez maintenant plus vite, ou en mode défi ×3."
      : score >= 80 ? "Très bien ! Quelques mots à peaufiner (en rouge)."
      : score >= 60 ? "Pas mal. Ralentissez et exagérez les consonnes des mots en rouge."
      : "Reprenez plus lentement, syllabe par syllabe. Écoutez d’abord le modèle 🔊.";
    $("#tw-live").hidden = true;
    const res = $("#tw-result");
    res.hidden = false;
    res.innerHTML = `
      <div class="score-line">
        <span class="score-big">${score} %</span>
        <span class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>
        <span class="muted">${secs.toFixed(1)} s</span>
      </div>
      <p>${msg}</p>
      <p class="muted small">Compris : « ${esc(said)} »</p>`;
    const best = store.get("twBest", {});
    const pen = $("#tw-pen").checked;
    if (!pen) {
      best[item.t] = Math.max(best[item.t] || 0, score);
      store.set("twBest", best);
    }
    logActivity({ type: "twister", score, label: item.t.slice(0, 40) + (item.t.length > 40 ? "…" : "") + (pen ? " (stylo)" : "") + ($("#tw-triple").checked ? " ×3" : "") });
  }

  segmented($("#tw-level"), (d) => { tw.level = d.level; twFilter(); });
  $("#tw-next").addEventListener("click", () => { tw.idx = (tw.idx + 1) % tw.list.length; twRender(); });
  $("#tw-prev").addEventListener("click", () => { tw.idx = (tw.idx - 1 + tw.list.length) % tw.list.length; twRender(); });
  $("#tw-listen").addEventListener("click", () => {
    const t = tw.list[tw.idx].t;
    speak($("#tw-triple").checked ? [t, t, t].join(" ") : t, +$("#tw-rate").value);
  });
  $("#tw-rec").addEventListener("click", twStart);
  $("#tw-pen").addEventListener("change", () => twRender());
  $("#tw-triple").addEventListener("change", () => twRender());

  function syllables() {
    const cons = [...SYL_CONSONANTS].sort(() => Math.random() - 0.5).slice(0, 3);
    return cons.map((c) => SYL_VOWELS.slice(0, 6).map((v) => {
      // « g » et « c » devant é / i doivent rester durs.
      if (/g$/.test(c) && /^(é|i|eu|in)/.test(v)) return c + "u" + v;
      if (/^c$/.test(c)) return "k" + v;
      return c + v;
    }).join("-")).join("  ·  ");
  }
  $("#pairs").innerHTML = MINIMAL_PAIRS.map((p) => `<div class="pair">${p.map((w) => `<button class="chip" data-say="${esc(w)}">${esc(w)}</button>`).join("<span>/</span>")}</div>`).join("");
  $("#pairs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (b) speak(b.dataset.say, 0.8);
  });

  $("#syl-new").addEventListener("click", () => { $("#syl-text").textContent = syllables(); });
  $("#syl-listen").addEventListener("click", () => speak($("#syl-text").textContent.replace(/·/g, ",").replace(/-/g, " "), 0.8));

  /* ---------- Analyse de discours ---------- */

  const FILLER_TOKENS = FILLERS.map((f) => f.split(" ")).sort((a, b) => b.length - a.length);
  const GENRE_OK_BEFORE = new Set(["ce", "un", "le", "quel", "du", "mon", "son", "ton", "de", "meme", "cet"]);
  const FILLER_DISPLAY = new RegExp(
    "(?<![\\p{L}'’])(euh+|heu+|hum+|hmm+|bah|ben|(?<!(?:ce|un|le|quel|du|mon|son|ton|de|même) )genre|du coup|en fait|voilà|voila|en gros|tu vois|vous voyez|je veux dire|j['’]veux dire|bref|entre guillemets|basiquement|littéralement|on va dire)(?![\\p{L}])",
    "giu");

  function countFillers(toks) {
    const found = {};
    let total = 0;
    for (let i = 0; i < toks.length; i++) {
      for (const f of FILLER_TOKENS) {
        if (f.every((w, k) => toks[i + k] === w)) {
          if (f[0] === "genre" && f.length === 1 && GENRE_OK_BEFORE.has(toks[i - 1])) continue;
          const key = f.join(" ");
          found[key] = (found[key] || 0) + 1;
          total++;
          i += f.length - 1;
          break;
        }
      }
    }
    return { total, found };
  }

  function lexicalDiversity(toks) {
    if (toks.length < 50) return toks.length ? new Set(toks).size / toks.length : 0;
    const win = 50;
    let sum = 0, n = 0;
    for (let i = 0; i + win <= toks.length; i += 10) {
      sum += new Set(toks.slice(i, i + win)).size / win;
      n++;
    }
    return sum / n;
  }

  const sp = { on: false, limit: 0 };

  function spRenderTranscript() {
    const text = sp.finals.join(" ");
    const html = esc(text).replace(FILLER_DISPLAY, '<mark class="filler">$1</mark>');
    $("#sp-transcript").innerHTML = html + (sp.interim ? ` <span class="interim">${esc(sp.interim)}</span>` : "");
    const box = $("#sp-transcript");
    box.scrollTop = box.scrollHeight;
  }

  async function spStart() {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      $("#sp-status").textContent = "Impossible d’accéder au micro. Vérifiez les autorisations du navigateur.";
      return;
    }
    window.speechSynthesis && speechSynthesis.cancel();
    Object.assign(sp, {
      on: true, stream, finals: [], interim: "", chunks: [], start: performance.now(),
      pauses: [], silenceRun: 0, srBlocked: false, liveFillers: 0, spoke: false, speechMs: 0, floor: 0.01, audioUrl: null,
    });
    $("#sp-report").hidden = true;
    $("#sp-transcript").innerHTML = "";
    $("#sp-rec").classList.add("on");
    $("#sp-rec").setAttribute("aria-label", "Arrêter l’enregistrement");
    $("#sp-status").textContent = sp.limit ? "Parlez… l’enregistrement s’arrêtera automatiquement." : "Parlez… appuyez de nouveau pour terminer.";

    // Enregistrement audio pour la réécoute.
    if (window.MediaRecorder) {
      sp.recorder = new MediaRecorder(stream);
      sp.recorder.ondataavailable = (e) => e.data.size && sp.chunks.push(e.data);
      sp.recorder.start();
    }

    // Analyse du volume : vumètre et détection des pauses.
    const AC = window.AudioContext || window.webkitAudioContext;
    sp.ctx = new AC();
    const src = sp.ctx.createMediaStreamSource(stream);
    const analyser = sp.ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    const STEP = 50;
    sp.levelTimer = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const rms = Math.sqrt(s / buf.length);
      sp.floor = rms < sp.floor ? sp.floor * 0.7 + rms * 0.3 : sp.floor * 0.998 + rms * 0.002;
      const voiced = rms > Math.max(0.012, sp.floor * 3);
      if (voiced) {
        if (sp.spoke && sp.silenceRun >= 700) sp.pauses.push(sp.silenceRun);
        sp.silenceRun = 0;
        sp.spoke = true;
        sp.speechMs += STEP;
      } else {
        sp.silenceRun += STEP;
      }
      $("#sp-meter").style.width = clamp(rms * 500, 0, 100) + "%";
    }, STEP);

    sp.clock = setInterval(() => {
      const el = (performance.now() - sp.start) / 1000;
      $("#sp-timer").textContent = sp.limit ? fmtTime(Math.max(0, sp.limit - el)) : fmtTime(el);
      if (sp.limit && el >= sp.limit) spStop();
    }, 200);

    if (SR) spListen();
  }

  function spListen() {
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      sp.interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          sp.finals.push(r[0].transcript.trim());
          const n = countFillers(tokens(r[0].transcript)).total;
          if (n) {
            sp.liveFillers += n;
            if ($("#sp-buzz").checked) buzz();
            $("#sp-status").textContent = `Tics détectés : ${sp.liveFillers}`;
          }
        } else sp.interim += r[0].transcript;
      }
      spRenderTranscript();
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") sp.srBlocked = true;
    };
    rec.onend = () => {
      if (sp.interim) { sp.finals.push(sp.interim.trim()); sp.interim = ""; }
      // Chrome coupe la reconnaissance après un silence : on relance tant qu'on enregistre.
      if (sp.on && !sp.srBlocked) { try { rec.start(); } catch { /* déjà relancée */ } }
      else if (sp.onRecEnd) sp.onRecEnd();
    };
    sp.rec = rec;
    try { rec.start(); } catch { /* ignoré */ }
  }

  /* Petit signal sonore quand un tic de langage est détecté. */
  function buzz() {
    if (!sp.ctx) return;
    const o = sp.ctx.createOscillator(), g = sp.ctx.createGain();
    o.type = "square";
    o.frequency.value = 220;
    g.gain.setValueAtTime(0.08, sp.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, sp.ctx.currentTime + 0.25);
    o.connect(g).connect(sp.ctx.destination);
    o.start();
    o.stop(sp.ctx.currentTime + 0.25);
  }

  async function spStop() {
    if (!sp.on) return;
    sp.on = false;
    const duration = (performance.now() - sp.start) / 1000;
    clearInterval(sp.levelTimer);
    clearInterval(sp.clock);
    $("#sp-rec").classList.remove("on");
    $("#sp-rec").setAttribute("aria-label", "Démarrer l’enregistrement");
    $("#sp-meter").style.width = "0";
    $("#sp-status").textContent = "Analyse en cours…";

    const waits = [];
    if (sp.rec) {
      waits.push(new Promise((res) => { sp.onRecEnd = res; setTimeout(res, 1500); }));
      try { sp.rec.stop(); } catch { /* ignoré */ }
    }
    if (sp.recorder && sp.recorder.state !== "inactive") {
      waits.push(new Promise((res) => { sp.recorder.onstop = res; }));
      sp.recorder.stop();
    }
    await Promise.all(waits);
    sp.stream.getTracks().forEach((t) => t.stop());
    sp.ctx && sp.ctx.close();
    if (sp.chunks.length) sp.audioUrl = URL.createObjectURL(new Blob(sp.chunks, { type: sp.chunks[0].type }));
    spRenderTranscript();
    $("#sp-status").textContent = "Terminé. Consultez votre bilan ci-dessous.";
    spReport(duration);
  }

  function spReport(duration) {
    const text = sp.finals.join(" ");
    const toks = tokens(text);
    const words = toks.length;
    const minutes = duration / 60;
    const hasText = !!SR && words > 0;
    const wpm = hasText ? words / minutes : null;
    const fill = countFillers(toks);
    const fpm = hasText ? fill.total / minutes : null;
    const div = hasText ? lexicalDiversity(toks) : null;
    const longPauses = sp.pauses.filter((p) => p >= 3000).length;
    const ppm = sp.pauses.length / minutes;
    const speakRatio = sp.speechMs / 1000 / duration;

    // Mots de contenu répétés.
    const counts = {};
    toks.filter((w) => w.length > 3 && !STOPWORDS.has(w)).forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
    const repeated = Object.entries(counts).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const WEAK = new Set(["chose", "choses", "truc", "trucs", "machin", "machins", "tres", "beaucoup"]);
    const weakHits = toks.filter((t) => WEAK.has(t)).length;

    // Scores partiels (0–100).
    const sDebit = wpm == null ? null : wpm < 120 ? clamp(100 - (120 - wpm) * 1.7, 0, 100) : wpm > 165 ? clamp(100 - (wpm - 165) * 1.5, 0, 100) : 100;
    const sTics = fpm == null ? null : clamp(100 - fpm * 15, 0, 100);
    const sDiv = div == null ? null : clamp(((div - 0.45) / (0.72 - 0.45)) * 100, 0, 100);
    const sPause = clamp((ppm < 3 ? 100 - (3 - ppm) * 20 : ppm > 14 ? 100 - (ppm - 14) * 8 : 100) - longPauses * 10, 0, 100);
    const parts = [[sDebit, 0.3], [sTics, 0.3], [sDiv, 0.2], [sPause, 0.2]].filter(([s]) => s != null);
    const wsum = parts.reduce((s, [, w]) => s + w, 0);
    const score = Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / wsum);

    const lvl = (s) => (s == null ? "" : s >= 75 ? "good" : s >= 45 ? "warn" : "bad");
    const metrics = [
      [fmtTime(duration), "durée", ""],
      [wpm != null ? Math.round(wpm) : "—", "mots / minute", lvl(sDebit)],
      [fpm != null ? `${fill.total} <small class="muted">(${fpm.toFixed(1)}/min)</small>` : "—", "tics de langage", lvl(sTics)],
      [div != null ? Math.round(div * 100) + " %" : "—", "diversité du vocabulaire", lvl(sDiv)],
      [`${sp.pauses.length}${longPauses ? ` <small class="muted">(${longPauses} longue${longPauses > 1 ? "s" : ""})</small>` : ""}`, "pauses", lvl(sPause)],
      [Math.round(speakRatio * 100) + " %", "temps de parole", ""],
    ];

    const fb = [];
    if (duration < 20 || (hasText && words < 30)) fb.push(["warn", "Prise de parole courte : parlez au moins 30 secondes pour une analyse plus fiable."]);
    if (wpm != null) {
      if (wpm < 110) fb.push(["warn", `Débit un peu lent (${Math.round(wpm)} mots/min). Gagnez en énergie : visez 120 à 160 mots/min, sans sacrifier l’articulation.`]);
      else if (wpm > 170) fb.push(["bad", `Débit rapide (${Math.round(wpm)} mots/min). Ralentissez : votre auditoire a besoin de temps pour suivre. Marquez des pauses entre vos idées.`]);
      else fb.push(["good", `Débit agréable (${Math.round(wpm)} mots/min) : dans la zone idéale de 120 à 160.`]);
    }
    if (fpm != null) {
      const list = Object.entries(fill.found).sort((a, b) => b[1] - a[1]).map(([w, c]) => `« ${w} » ×${c}`).join(", ");
      if (fill.total === 0) fb.push(["good", "Aucun tic de langage détecté. Bravo ! (Les « euh » sont parfois filtrés par la reconnaissance : réécoutez-vous pour vérifier.)"]);
      else if (fpm <= 2) fb.push(["good", `Peu de tics de langage : ${list}.`]);
      else fb.push([fpm > 5 ? "bad" : "warn", `Tics de langage : ${list}. Remplacez-les par un silence : une pause paraît toujours plus assurée qu’un « du coup ».`]);
    }
    if (div != null && words >= 30) {
      if (div < 0.55) fb.push(["warn", "Vocabulaire assez répétitif. Variez vos mots : consultez l’onglet Expression pour des synonymes."]);
      else if (div >= 0.68) fb.push(["good", "Vocabulaire riche et varié."]);
    }
    if (repeated.length) fb.push(["warn", `Mots souvent répétés : ${repeated.map(([w, c]) => `« ${w} » ×${c}`).join(", ")}. Cherchez des synonymes ou des reformulations.`]);
    if (weakHits >= 3) fb.push(["warn", `Mots passe-partout (« chose », « truc », « très », « beaucoup »…) utilisés ${weakHits} fois. Préférez des termes plus précis.`]);
    if (longPauses) fb.push(["warn", `${longPauses} silence${longPauses > 1 ? "s" : ""} de plus de 3 secondes. Une pause de 1 à 2 secondes suffit pour ménager un effet ; au-delà, on semble chercher ses mots.`]);
    else if (ppm < 3 && duration > 20) fb.push(["warn", "Très peu de pauses. Respirez entre vos idées : les silences donnent du relief et de l’autorité à votre propos."]);
    else if (sp.pauses.length) fb.push(["good", "Bon usage des pauses : vous laissez respirer votre discours."]);
    if (!SR) fb.push(["warn", "Votre navigateur ne propose pas la reconnaissance vocale : seules les pauses et la durée sont analysées. Utilisez Chrome ou Edge pour le bilan complet."]);
    else if (!words) fb.push(["warn", "Aucune parole n’a été transcrite. Vérifiez votre micro et parlez un peu plus fort."]);

    const topic = $("#sp-topic").value.trim();
    $("#sp-report").hidden = false;
    $("#sp-report").innerHTML = `
      <div class="card">
        <div class="score-line"><h3>Votre bilan</h3><span class="score-big">${score}<small class="muted">/100</small></span></div>
        ${topic ? `<p class="muted">Sujet : ${esc(topic)}</p>` : ""}
        <div class="report-grid">${metrics.map(([v, l, c]) => `<div class="metric ${c}"><b>${v}</b><span>${l}</span></div>`).join("")}</div>
        <h3>Conseils</h3>
        <ul class="feedback">${fb.map(([c, t]) => `<li class="${c}">${t}</li>`).join("")}</ul>
        ${sp.audioUrl ? `<h3 style="margin-top:1.25rem">Réécoutez-vous</h3><p class="muted small">Écoutez votre intonation : est-elle variée ? Vos fins de phrases sont-elles posées ?</p><audio controls src="${sp.audioUrl}"></audio>` : ""}
        <div class="actions"><button class="btn primary" id="sp-again">Recommencer</button><a class="btn ghost" href="#impro">Nouveau sujet</a></div>
      </div>`;
    $("#sp-again").addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }); spStart(); });
    $("#sp-report").scrollIntoView({ behavior: "smooth", block: "start" });

    logActivity({
      type: "speech", score, label: topic || "Discours libre",
      wpm: wpm != null ? Math.round(wpm) : null, fpm: fpm != null ? +fpm.toFixed(2) : null,
    });
  }

  $("#sp-rec").addEventListener("click", () => (sp.on ? spStop() : spStart()));
  segmented($("#sp-duration"), (d) => {
    sp.limit = +d.sec;
    if (!sp.on) $("#sp-timer").textContent = fmtTime(sp.limit);
  });

  function setDuration(sec) {
    $$("#sp-duration button").forEach((b) => b.classList.toggle("active", +b.dataset.sec === sec));
    sp.limit = sec;
    $("#sp-timer").textContent = fmtTime(sec);
  }

  /* ---------- Improvisation ---------- */

  const im = { cat: "tous", topic: null, cons: null, prepTimer: null };
  const CAT_LABEL = { argumenter: "Argumenter", raconter: "Raconter", convaincre: "Pitcher", decaler: "Décalé" };

  function imDraw() {
    const pool = im.cat === "tous" ? TOPICS : TOPICS.filter((t) => t.cat === im.cat);
    let next;
    do { next = pick(pool); } while (pool.length > 1 && next === im.topic);
    im.topic = next;
    im.cons = $("#im-constraint").checked ? pick(CONSTRAINTS) : null;
    $("#im-topic").textContent = next.t;
    $("#im-type").textContent = CAT_LABEL[next.cat];
    $("#im-cons").hidden = !im.cons;
    $("#im-cons").textContent = im.cons ? "Contrainte : " + im.cons : "";
    $("#im-start").disabled = false;
    $("#im-go").disabled = false;
    imStopPrep();
  }
  function imStopPrep() {
    clearInterval(im.prepTimer);
    $("#im-prep").hidden = true;
  }
  function imGo() {
    imStopPrep();
    $("#sp-topic").value = im.topic.t + (im.cons ? " — " + im.cons : "");
    setDuration(sp.limit || 60);
    location.hash = "discours";
    if (!sp.on) spStart();
  }
  segmented($("#im-cat"), (d) => { im.cat = d.cat; imDraw(); });
  $("#im-draw").addEventListener("click", imDraw);
  $("#im-go").addEventListener("click", imGo);
  $("#im-start").addEventListener("click", () => {
    let left = 30;
    $("#im-prep").hidden = false;
    $("#im-prep-timer").textContent = left;
    clearInterval(im.prepTimer);
    im.prepTimer = setInterval(() => {
      left--;
      $("#im-prep-timer").textContent = left;
      if (left <= 0) imGo();
    }, 1000);
  });

  /* ---------- Lecture & intonation ---------- */

  /* Enregistreur simple : un clip audio à réécouter. */
  function clipRecorder(out, onStop) {
    let rec = null;
    return {
      get active() { return !!rec; },
      async start() {
        let stream;
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {
          out.innerHTML = `<p class="muted small">Impossible d’accéder au micro.</p>`;
          return false;
        }
        if (!window.MediaRecorder) { stream.getTracks().forEach((t) => t.stop()); return false; }
        const chunks = [];
        rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (chunks.length) {
            out.innerHTML = `<audio controls src="${URL.createObjectURL(new Blob(chunks, { type: chunks[0].type }))}"></audio>`;
          }
          onStop && onStop();
        };
        rec.start();
        out.innerHTML = `<p class="muted small">🔴 Enregistrement en cours…</p>`;
        return true;
      },
      stop() {
        if (rec && rec.state !== "inactive") rec.stop();
        rec = null;
      },
    };
  }

  const rd = { idx: 0, wpm: 130, pos: 0, timer: null, playing: false, items: [], clip: clipRecorder($("#rd-audio")) };
  $("#rd-text").innerHTML = READINGS.map((r, i) => `<option value="${i}">${esc(r.title)}</option>`).join("");

  function rdRender() {
    rdPause();
    rd.clip.stop();
    rd.pos = 0;
    const r = READINGS[rd.idx];
    $("#rd-src").textContent = r.src;
    // La ponctuation isolée (« ; », « ? »…) est rattachée au mot précédent.
    rd.items = [];
    r.t.split(/\s+/).forEach((w) => {
      if (!/\p{L}|\d/u.test(w) && rd.items.length) rd.items[rd.items.length - 1].w += "\u00a0" + w;
      else rd.items.push({ w });
    });
    rd.items.forEach((it) => {
      const end = it.w.replace(/[»"’)]+$/, "");
      it.pause = /[.!?…]$/.test(end) ? 2 : /[,;:]$/.test(end) ? 1 : 0;
    });
    $("#rd-prompter").innerHTML = rd.items.map((it, i) =>
      `<span class="w" data-i="${i}">${esc(it.w)}</span>${it.pause ? `<span class="mark">${it.pause === 2 ? "//" : "/"}</span>` : ""}`).join(" ");
    $("#rd-prompter").scrollTop = 0;
    $("#rd-play").textContent = "▶️ Démarrer";
  }

  function rdStep() {
    const spans = $("#rd-prompter").querySelectorAll(".w");
    if (rd.pos > 0) spans[rd.pos - 1].className = "w past";
    if (rd.pos >= rd.items.length) {
      rdPause();
      rd.clip.stop();
      $("#rd-play").textContent = "▶️ Relire";
      rd.pos = 0;
      logActivity({ type: "reading", label: `${READINGS[rd.idx].title} (${rd.wpm} mots/min)` });
      return;
    }
    const el = spans[rd.pos];
    el.className = "w now";
    const box = $("#rd-prompter");
    const top = el.offsetTop - box.offsetTop;
    if (top > box.scrollTop + box.clientHeight * 0.6 || top < box.scrollTop) box.scrollTop = top - box.clientHeight * 0.3;
    const it = rd.items[rd.pos];
    const base = 60000 / rd.wpm;
    const delay = base * (it.w.length > 8 ? 1.25 : 1) + [0, 450, 950][it.pause];
    rd.pos++;
    rd.timer = setTimeout(rdStep, delay);
  }
  function rdPause() {
    clearTimeout(rd.timer);
    rd.playing = false;
    $("#rd-play").textContent = "▶️ Reprendre";
  }
  $("#rd-play").addEventListener("click", async () => {
    if (rd.playing) { rdPause(); return; }
    if (rd.pos === 0) {
      $("#rd-prompter").querySelectorAll(".w").forEach((s) => { s.className = "w"; });
      $("#rd-audio").innerHTML = "";
      if ($("#rd-record").checked) await rd.clip.start();
    }
    rd.playing = true;
    $("#rd-play").textContent = "⏸️ Pause";
    rdStep();
  });
  $("#rd-reset").addEventListener("click", rdRender);
  $("#rd-text").addEventListener("change", (e) => { rd.idx = +e.target.value; rdRender(); });
  segmented($("#rd-speed"), (d) => { rd.wpm = +d.wpm; });

  const inx = { s: pick(INTONATION_SENTENCES), e: pick(EMOTIONS), timer: null };
  inx.clip = clipRecorder($("#in-audio"), () => {
    clearTimeout(inx.timer);
    $("#in-rec").textContent = "🎙️ M’enregistrer";
    $("#in-rec").classList.remove("recording");
  });
  function inRender() {
    $("#in-sentence").textContent = "« " + inx.s + " »";
    $("#in-emotion").textContent = `${inx.e.i} ${inx.e.e}`;
    $("#in-tip").textContent = inx.e.tip;
  }
  $("#in-emo").addEventListener("click", () => {
    let e;
    do { e = pick(EMOTIONS); } while (e === inx.e);
    inx.e = e;
    inRender();
  });
  $("#in-new").addEventListener("click", () => {
    let s2;
    do { s2 = pick(INTONATION_SENTENCES); } while (s2 === inx.s);
    inx.s = s2;
    inx.e = pick(EMOTIONS);
    inRender();
  });
  $("#in-rec").addEventListener("click", async () => {
    if (inx.clip.active) { inx.clip.stop(); return; }
    if (!(await inx.clip.start())) return;
    $("#in-rec").textContent = "⏹️ Arrêter";
    $("#in-rec").classList.add("recording");
    inx.timer = setTimeout(() => inx.clip.stop(), 15000);
    logActivity({ type: "intonation", label: `${inx.e.e} — ${inx.s}` });
  });

  /* ---------- Souffle & voix ---------- */

  const br = { pattern: BREATH_PATTERNS[0], running: false, timers: [], started: 0 };

  $("#br-pattern").innerHTML = BREATH_PATTERNS.map((p, i) => `<button data-i="${i}" class="${i ? "" : "active"}">${p.name}</button>`).join("");
  $("#br-desc").textContent = br.pattern.desc;
  segmented($("#br-pattern"), (d) => {
    brStop();
    br.pattern = BREATH_PATTERNS[+d.i];
    $("#br-desc").textContent = br.pattern.desc;
  });

  function brStop(completed) {
    br.timers.forEach(clearTimeout);
    br.timers.forEach(clearInterval);
    br.timers = [];
    if (br.running && (completed || performance.now() - br.started > 60000)) {
      logActivity({ type: "breath", label: br.pattern.name });
    }
    br.running = false;
    const c = $("#br-circle");
    c.style.transitionDuration = "1s";
    c.style.transform = "scale(1)";
    $("#br-label").textContent = completed ? "Bravo 🌿" : "Prêt ?";
    $("#br-count").textContent = "";
    $("#br-toggle").textContent = "Commencer";
  }

  function brStart() {
    br.running = true;
    br.started = performance.now();
    $("#br-toggle").textContent = "Arrêter";
    const { steps, cycles } = br.pattern;
    let cycle = 0, step = 0;
    const c = $("#br-circle");
    const run = () => {
      if (!br.running) return;
      if (step >= steps.length) { step = 0; cycle++; }
      if (cycle >= cycles) { brStop(true); return; }
      const [label, secs, scale] = steps[step];
      c.style.transitionDuration = secs + "s";
      c.style.transform = `scale(${scale})`;
      let left = secs;
      $("#br-label").textContent = `${label} · ${left}`;
      $("#br-count").textContent = `Cycle ${cycle + 1} / ${cycles}`;
      const iv = setInterval(() => {
        left--;
        if (left > 0) $("#br-label").textContent = `${label} · ${left}`;
      }, 1000);
      br.timers.push(iv);
      br.timers.push(setTimeout(() => { clearInterval(iv); step++; run(); }, secs * 1000));
    };
    run();
  }
  $("#br-toggle").addEventListener("click", () => (br.running ? brStop() : brStart()));

  const wu = { idx: -1, timer: null, left: 0 };
  function wuRender() {
    $("#wu-list").innerHTML = WARMUP.map((s, i) => `
      <li class="${i < wu.idx ? "done" : i === wu.idx ? "current" : ""}">
        <b>${esc(s.t)}</b> <span class="muted small">(${s.s} s)</span>
        <small>${esc(s.d)}</small>
      </li>`).join("");
  }
  function wuStep() {
    clearInterval(wu.timer);
    wu.idx++;
    wuRender();
    if (wu.idx >= WARMUP.length) {
      $("#wu-timer").textContent = "Terminé ! Votre voix est prête 🎤";
      $("#wu-skip").hidden = true;
      $("#wu-start").hidden = false;
      $("#wu-start").textContent = "Recommencer";
      wu.idx = -1;
      logActivity({ type: "warmup", label: "Échauffement vocal complet" });
      return;
    }
    wu.left = WARMUP[wu.idx].s;
    $("#wu-timer").textContent = fmtTime(wu.left);
    $("#wu-list").children[wu.idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
    wu.timer = setInterval(() => {
      wu.left--;
      $("#wu-timer").textContent = fmtTime(Math.max(0, wu.left));
      if (wu.left <= 0) wuStep();
    }, 1000);
  }
  $("#wu-start").addEventListener("click", () => {
    wu.idx = -1;
    $("#wu-start").hidden = true;
    $("#wu-skip").hidden = false;
    wuStep();
  });
  $("#wu-skip").addEventListener("click", wuStep);

  /* ---------- Expression ---------- */

  $("#voc-word").innerHTML = wordHTML(WORDS[dayNumber() % WORDS.length]);
  $("#voc-random").addEventListener("click", () => { $("#voc-word").innerHTML = wordHTML(pick(WORDS)); });

  $("#weak-chips").innerHTML = Object.keys(WEAK_WORDS).map((k) => `<button class="chip" data-w="${esc(k)}">${esc(k)}</button>`).join("");
  $("#weak-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    $$("#weak-chips .chip").forEach((c) => c.classList.toggle("active", c === b));
    const w = WEAK_WORDS[b.dataset.w];
    $("#weak-detail").innerHTML = `
      <p><b>Alternatives :</b> ${w.alt.map(esc).join(", ")}.</p>
      ${w.ex.map((x) => `<p class="example">${esc(x)}</p>`).join("")}`;
  });

  let refIdx = Math.floor(Math.random() * REFORMULATIONS.length);
  function refRender() {
    $("#ref-sentence").textContent = "« " + REFORMULATIONS[refIdx].s + " »";
    $("#ref-answer").hidden = true;
    $("#ref-input").value = "";
  }
  $("#ref-show").addEventListener("click", () => {
    $("#ref-answer").textContent = "💡 " + REFORMULATIONS[refIdx].a;
    $("#ref-answer").hidden = false;
  });
  $("#ref-next").addEventListener("click", () => { refIdx = (refIdx + 1) % REFORMULATIONS.length; refRender(); });

  $("#figures").innerHTML = FIGURES.map((f) => `
    <div class="figure"><h4>${esc(f.n)}</h4><p>${esc(f.d)}</p><p class="ex">${esc(f.e)}</p></div>`).join("");

  /* ---------- Initialisation ---------- */

  if (!SR) {
    const b = $("#support-banner");
    b.hidden = false;
    b.textContent = "Votre navigateur ne prend pas en charge la reconnaissance vocale. Les exercices restent disponibles, mais pour l’analyse de votre parole (virelangues notés, débit, tics de langage), utilisez Chrome ou Edge.";
    $("#tw-rec").disabled = true;
  }
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  twRender();
  $("#syl-text").textContent = syllables();
  wuRender();
  refRender();
  rdRender();
  inRender();
  showTab(location.hash.slice(1));
})();
