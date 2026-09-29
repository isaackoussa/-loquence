/* Parole : texte, reconnaissance vocale, analyse audio et bilans. */
(() => {
  "use strict";
  const { esc, clamp, fmtTime, settings, SR } = App;

  /* ---------- Texte ---------- */

  function norm(s) {
    return String(s).toLowerCase()
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

  /* Le texte contient-il ce mot ou cette expression (tolérance phonétique) ? */
  function contains(text, word) {
    const t = tokens(text).map(phon), w = tokens(word).map(phon);
    if (!w.length) return false;
    for (let i = 0; i + w.length <= t.length; i++) {
      if (w.every((x, k) => t[i + k] === x)) return true;
    }
    return false;
  }

  /* ---------- Tics de langage ---------- */

  const FILLER_TOKENS = FILLERS.map((f) => f.split(" ")).sort((a, b) => b.length - a.length);
  const GENRE_OK_BEFORE = new Set(["ce", "un", "le", "quel", "du", "mon", "son", "ton", "de", "meme", "cet"]);
  const FILLER_DISPLAY = new RegExp(
    "(?<![\\p{L}'’])(euh+|heu+|hum+|hmm+|bah|ben|(?<!(?:ce|un|le|quel|du|mon|son|ton|de|même) )genre|du coup|en fait|voilà|voila|en gros|tu vois|vous voyez|je veux dire|bref|entre guillemets|basiquement|littéralement|on va dire)(?![\\p{L}])",
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
  const highlightFillers = (text) => esc(text).replace(FILLER_DISPLAY, '<mark class="filler">$1</mark>');

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

  /* ---------- Hauteur de la voix ---------- */

  /* Estimation de la fréquence fondamentale par autocorrélation (null si non voisé). */
  function detectPitch(buf, sampleRate) {
    const n = buf.length;
    let rms = 0;
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
    if (Math.sqrt(rms / n) < 0.01) return null;
    const minLag = Math.floor(sampleRate / 500), maxLag = Math.floor(sampleRate / 70);
    const size = Math.min(n - maxLag, 1024);
    if (size <= 0) return null;
    let best = -1, bestLag = -1, energy = 0;
    for (let i = 0; i < size; i++) energy += buf[i] * buf[i];
    const corr = new Float32Array(maxLag + 2);
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0;
      for (let i = 0; i < size; i++) s += buf[i] * buf[i + lag];
      corr[lag] = s;
      if (s > best) { best = s; bestLag = lag; }
    }
    if (bestLag < 0 || best / energy < 0.5) return null;
    // Préfère la première crête proche du maximum (évite les erreurs d'octave).
    for (let lag = minLag + 1; lag < bestLag; lag++) {
      if (corr[lag] > 0.9 * best && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) { bestLag = lag; break; }
    }
    const a = corr[bestLag - 1] || 0, b = corr[bestLag], c = corr[bestLag + 1] || 0;
    const shift = (a - c) / (2 * (a - 2 * b + c)) || 0;
    return sampleRate / (bestLag + clamp(shift, -1, 1));
  }
  const semitones = (f, ref) => 12 * Math.log2(f / ref);

  function pitchStats(pitches) {
    if (pitches.length < 20) return null;
    const sorted = [...pitches].sort((a, b) => a - b);
    const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
    const median = q(0.5);
    const st = pitches.map((f) => semitones(f, median));
    const mean = st.reduce((s, x) => s + x, 0) / st.length;
    const std = Math.sqrt(st.reduce((s, x) => s + (x - mean) ** 2, 0) / st.length);
    return { median, low: q(0.1), high: q(0.9), range: semitones(q(0.9), q(0.1)), std };
  }

  /* ---------- Session d'enregistrement ---------- */

  /**
   * Micro + enregistrement audio + analyse (volume, pauses, hauteur) + transcription continue.
   * Options : onTranscript(finals, interim), onFinal(text), onLevel(rms, pitch).
   */
  class SpeechSession {
    constructor(opts = {}) {
      this.opts = opts;
      this.finals = [];
      this.interim = "";
      this.pauses = [];
      this.pitches = [];
      this.chunks = [];
      this.silenceRun = 0;
      this.speechMs = 0;
      this.spoke = false;
      this.floor = 0.01;
      this.on = false;
    }

    async start() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        this.error = "Impossible d’accéder au micro. Vérifiez les autorisations du navigateur.";
        return false;
      }
      App.stopSpeaking();
      this.on = true;
      this.t0 = performance.now();

      if (window.MediaRecorder) {
        this.recorder = new MediaRecorder(this.stream);
        this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
        this.recorder.start();
      }

      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      const src = this.ctx.createMediaStreamSource(this.stream);
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const STEP = 50;
      this.levelTimer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let s = 0;
        for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const rms = Math.sqrt(s / buf.length);
        this.floor = rms < this.floor ? this.floor * 0.7 + rms * 0.3 : this.floor * 0.998 + rms * 0.002;
        const voiced = rms > Math.max(0.012, this.floor * 3);
        let pitch = null;
        if (voiced) {
          if (this.spoke && this.silenceRun >= 700) this.pauses.push(this.silenceRun);
          this.silenceRun = 0;
          this.spoke = true;
          this.speechMs += STEP;
          pitch = detectPitch(buf, this.ctx.sampleRate);
          if (pitch) this.pitches.push(pitch);
        } else {
          this.silenceRun += STEP;
        }
        this.opts.onLevel && this.opts.onLevel(rms, pitch);
      }, STEP);

      if (SR && this.opts.transcribe !== false) this.listen();
      return true;
    }

    get elapsed() { return this.on ? (performance.now() - this.t0) / 1000 : this.duration || 0; }

    listen() {
      const rec = new SR();
      rec.lang = settings.get("lang");
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        this.interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            const t = r[0].transcript.trim();
            if (t) {
              this.finals.push(t);
              this.opts.onFinal && this.opts.onFinal(t);
            }
          } else this.interim += r[0].transcript;
        }
        this.opts.onTranscript && this.opts.onTranscript(this.finals, this.interim);
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") this.srBlocked = true;
      };
      rec.onend = () => {
        if (this.interim.trim()) {
          this.finals.push(this.interim.trim());
          this.opts.onFinal && this.opts.onFinal(this.interim.trim());
          this.interim = "";
        }
        // Chrome coupe la reconnaissance après un silence : on relance tant qu'on enregistre.
        if (this.on && !this.srBlocked) { try { rec.start(); } catch { /* déjà relancée */ } }
        else if (this.onRecEnd) this.onRecEnd();
      };
      this.rec = rec;
      try { rec.start(); } catch { /* ignoré */ }
    }

    /* Beep court (buzzer). */
    beep(freq = 220) {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.08, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      o.connect(g).connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + 0.25);
    }

    async stop() {
      if (!this.on) return this.result;
      this.on = false;
      this.duration = (performance.now() - this.t0) / 1000;
      clearInterval(this.levelTimer);
      const waits = [];
      if (this.rec) {
        waits.push(new Promise((res) => { this.onRecEnd = res; setTimeout(res, 1500); }));
        try { this.rec.stop(); } catch { /* ignoré */ }
      }
      if (this.recorder && this.recorder.state !== "inactive") {
        waits.push(new Promise((res) => { this.recorder.onstop = res; }));
        this.recorder.stop();
      }
      await Promise.all(waits);
      this.stream.getTracks().forEach((t) => t.stop());
      this.ctx && this.ctx.close();
      if (this.interim.trim()) { this.finals.push(this.interim.trim()); this.interim = ""; }
      this.result = {
        text: this.finals.join(" "),
        duration: this.duration,
        pauses: this.pauses,
        speechMs: this.speechMs,
        pitches: this.pitches,
        hasSR: !!SR && !this.srBlocked,
        audioUrl: this.chunks.length ? URL.createObjectURL(new Blob(this.chunks, { type: this.chunks[0].type })) : null,
      };
      return this.result;
    }

    cancel() {
      if (!this.on) return;
      this.on = false;
      clearInterval(this.levelTimer);
      try { this.rec && this.rec.abort(); } catch { /* ignoré */ }
      try { this.recorder && this.recorder.state !== "inactive" && this.recorder.stop(); } catch { /* ignoré */ }
      this.stream && this.stream.getTracks().forEach((t) => t.stop());
      this.ctx && this.ctx.close();
    }
  }

  /* ---------- Analyse d'une prise de parole ---------- */

  function analyze(r) {
    const toks = tokens(r.text);
    const words = toks.length;
    const minutes = Math.max(r.duration, 1) / 60;
    const hasText = r.hasSR && words > 0;
    const wpm = hasText ? words / minutes : null;
    const fill = countFillers(toks);
    const fpm = hasText ? fill.total / minutes : null;
    const div = hasText ? lexicalDiversity(toks) : null;
    const longPauses = r.pauses.filter((p) => p >= 3000).length;
    const ppm = r.pauses.length / minutes;
    const speakRatio = r.speechMs / 1000 / Math.max(r.duration, 1);
    const pitch = pitchStats(r.pitches);

    const counts = {};
    toks.filter((w) => w.length > 3 && !STOPWORDS.has(w)).forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
    const repeated = Object.entries(counts).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const WEAK = new Set(["chose", "choses", "truc", "trucs", "machin", "machins", "tres", "beaucoup"]);
    const weakHits = toks.filter((t) => WEAK.has(t)).length;

    const sDebit = wpm == null ? null : wpm < 120 ? clamp(100 - (120 - wpm) * 1.7, 0, 100) : wpm > 165 ? clamp(100 - (wpm - 165) * 1.5, 0, 100) : 100;
    const sTics = fpm == null ? null : clamp(100 - fpm * 15, 0, 100);
    const sDiv = div == null ? null : clamp(((div - 0.45) / (0.72 - 0.45)) * 100, 0, 100);
    const sPause = clamp((ppm < 3 ? 100 - (3 - ppm) * 20 : ppm > 14 ? 100 - (ppm - 14) * 8 : 100) - longPauses * 10, 0, 100);
    const sVoice = pitch == null ? null : clamp(pitch.std < 1.5 ? 40 + (pitch.std / 1.5) * 50 : pitch.std > 6 ? 70 : 100, 0, 100);
    const parts = [[sDebit, 0.27], [sTics, 0.27], [sDiv, 0.16], [sPause, 0.15], [sVoice, 0.15]].filter(([s]) => s != null);
    const wsum = parts.reduce((s, [, w]) => s + w, 0);
    const score = Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / wsum);

    const lvl = (s) => (s == null ? "" : s >= 75 ? "good" : s >= 45 ? "warn" : "bad");
    const metrics = [
      [fmtTime(r.duration), "durée", ""],
      [wpm != null ? Math.round(wpm) : "—", "mots / minute", lvl(sDebit)],
      [fpm != null ? `${fill.total} <small class="muted">(${fpm.toFixed(1)}/min)</small>` : "—", "tics de langage", lvl(sTics)],
      [div != null ? Math.round(div * 100) + " %" : "—", "diversité du vocabulaire", lvl(sDiv)],
      [`${r.pauses.length}${longPauses ? ` <small class="muted">(${longPauses} longue${longPauses > 1 ? "s" : ""})</small>` : ""}`, "pauses", lvl(sPause)],
      [pitch ? `${pitch.range.toFixed(1)} <small class="muted">demi-tons</small>` : "—", "étendue de la voix", lvl(sVoice)],
    ];

    const fb = [];
    if (r.duration < 20 || (hasText && words < 30)) fb.push(["warn", "Prise de parole courte : parlez au moins 30 secondes pour une analyse plus fiable."]);
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
      if (div < 0.55) fb.push(["warn", "Vocabulaire assez répétitif. Variez vos mots : la section Vocabulaire propose des synonymes."]);
      else if (div >= 0.68) fb.push(["good", "Vocabulaire riche et varié."]);
    }
    if (repeated.length) fb.push(["warn", `Mots souvent répétés : ${repeated.map(([w, c]) => `« ${w} » ×${c}`).join(", ")}. Cherchez des synonymes ou des reformulations.`]);
    if (weakHits >= 3) fb.push(["warn", `Mots passe-partout (« chose », « truc », « très », « beaucoup »…) utilisés ${weakHits} fois. Préférez des termes plus précis.`]);
    if (longPauses) fb.push(["warn", `${longPauses} silence${longPauses > 1 ? "s" : ""} de plus de 3 secondes. Une pause de 1 à 2 secondes suffit pour ménager un effet ; au-delà, on semble chercher ses mots.`]);
    else if (ppm < 3 && r.duration > 20) fb.push(["warn", "Très peu de pauses. Respirez entre vos idées : les silences donnent du relief et de l’autorité à votre propos."]);
    else if (r.pauses.length) fb.push(["good", "Bon usage des pauses : vous laissez respirer votre discours."]);
    if (pitch) {
      if (pitch.std < 1.5) fb.push(["warn", "Voix plutôt monocorde : variez davantage la hauteur (montez sur les questions, descendez en fin d’affirmation, appuyez les mots clés)."]);
      else if (pitch.std > 6) fb.push(["warn", "Intonation très chantante : attention à ne pas paraître surjoué, gardez des fins de phrases posées."]);
      else fb.push(["good", "Intonation vivante : votre voix varie naturellement, ce qui maintient l’attention."]);
    }
    if (!SR) fb.push(["warn", "Votre navigateur ne propose pas la reconnaissance vocale : seules les pauses, la voix et la durée sont analysées. Utilisez Chrome ou Edge pour le bilan complet."]);
    else if (!words) fb.push(["warn", "Aucune parole n’a été transcrite. Vérifiez votre micro et parlez un peu plus fort."]);

    return {
      score, words, wpm, fpm, fillers: fill.total, fillerList: fill.found, div, pitch,
      metrics, feedback: fb,
    };
  }

  function reportHTML(r, a, { title = "Votre bilan", topic = "", actions = "" } = {}) {
    return `
      <div class="card report">
        <div class="score-line"><h3>${esc(title)}</h3><span class="score-big">${a.score}<small class="muted">/100</small></span></div>
        ${topic ? `<p class="muted">Sujet : ${esc(topic)}</p>` : ""}
        <div class="report-grid">${a.metrics.map(([v, l, c]) => `<div class="metric ${c}"><b>${v}</b><span>${l}</span></div>`).join("")}</div>
        <h3>Conseils</h3>
        <ul class="feedback">${a.feedback.map(([c, t]) => `<li class="${c}">${t}</li>`).join("")}</ul>
        ${r.text ? `<details class="details"><summary>Transcription</summary><p>${highlightFillers(r.text)}</p></details>` : ""}
        ${r.audioUrl ? `<h3 class="mt">Réécoutez-vous</h3><p class="muted small">Écoutez votre intonation : est-elle variée ? Vos fins de phrases sont-elles posées ?</p><audio controls src="${r.audioUrl}"></audio>` : ""}
        ${actions ? `<div class="actions">${actions}</div>` : ""}
      </div>`;
  }

  /* ---------- Reconnaissance ponctuelle (virelangues) ---------- */

  /* Écoute jusqu'au silence. Retourne un contrôleur { stop }. */
  function listenOnce({ onInterim, onDone, onError, maxMs = 25000, silenceMs = 2200 }) {
    const rec = new SR();
    rec.lang = settings.get("lang");
    rec.continuous = true;
    rec.interimResults = true;
    const finals = [];
    let interim = "", last = null, silence = null;
    const start = performance.now();
    const max = setTimeout(() => rec.stop(), maxMs);
    rec.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals.push(r[0].transcript);
        else interim += r[0].transcript;
      }
      last = performance.now();
      onInterim && onInterim((finals.join(" ") + " " + interim).trim());
      clearTimeout(silence);
      silence = setTimeout(() => rec.stop(), silenceMs);
    };
    rec.onerror = (e) => onError && onError(e.error);
    rec.onend = () => {
      clearTimeout(max);
      clearTimeout(silence);
      onDone((finals.join(" ") + " " + interim).trim(), ((last || performance.now()) - start) / 1000);
    };
    try { rec.start(); } catch { onDone("", 0); }
    return { stop: () => rec.stop() };
  }

  /* ---------- Enregistreur de clips ---------- */

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
          if (chunks.length) out.innerHTML = `<audio controls src="${URL.createObjectURL(new Blob(chunks, { type: chunks[0].type }))}"></audio>`;
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

  /* Vumètre + chrono + bouton d'enregistrement réutilisable. */
  function recorderHTML(id) {
    return `<div class="recorder">
        <button class="rec-btn" id="${id}-rec" aria-label="Démarrer l’enregistrement"><span class="rec-dot"></span></button>
        <div class="rec-info">
          <div class="timer" id="${id}-timer">0:00</div>
          <div class="meter"><div id="${id}-meter"></div></div>
          <div class="muted small" id="${id}-status">Appuyez pour commencer</div>
        </div>
      </div>`;
  }

  Object.assign(App, {
    norm, tokens, phon, lcsMatch, contains, countFillers, highlightFillers, lexicalDiversity,
    detectPitch, semitones, pitchStats, SpeechSession, analyze, reportHTML, listenOnce, clipRecorder, recorderHTML,
  });
})();
