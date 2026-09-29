// Contenu des rappels, bilans et e-mails de paliers, personnalisé selon la progression.
import { addDays, type Profile, type Summary } from "./common.mts";
import { appUrl, bar, esc, hello, layout, statRow } from "./mail.mts";

/** État sauvegardé par l'app (clés du stockage local, sans le préfixe « eloquence. »). */
export interface StoredState {
  history?: { day: string; type: string; score?: number | null; duration?: number; mode?: string }[];
}

const TYPE_LABEL: Record<string, [string, string]> = {
  twister: ["virelangue", "virelangues"], speech: ["prise de parole", "prises de parole"], interview: ["entretien", "entretiens"],
  game: ["jeu", "jeux"], quiz: ["quiz", "quiz"], lesson: ["cours", "cours"], reading: ["lecture", "lectures"],
  breath: ["respiration", "respirations"], warmup: ["échauffement", "échauffements"], voice: ["exercice de voix", "exercices de voix"],
  intonation: ["intonation", "intonations"],
};

export function weekStats(state: StoredState | null, today: string) {
  const from = addDays(today, -6);
  const week = (state?.history ?? []).filter((h) => h.day >= from && h.day <= today);
  const speeches = week.filter((h) => h.type === "speech" && typeof h.score === "number");
  const byType: Record<string, number> = {};
  week.forEach((h) => { byType[h.type] = (byType[h.type] ?? 0) + 1; });
  const top = Object.entries(byType).filter(([t]) => TYPE_LABEL[t]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    exercises: week.length,
    activeDays: new Set(week.map((h) => h.day)).size,
    speeches: speeches.length,
    avgScore: speeches.length ? Math.round(speeches.reduce((a, h) => a + (h.score ?? 0), 0) / speeches.length) : null,
    minutes: Math.round(week.reduce((a, h) => a + (h.duration ?? 0), 0) / 60),
    top: top.map(([t, n]) => `${n} ${TYPE_LABEL[t][n > 1 ? 1 : 0]}`),
  };
}

// ————— Rappel (push + e-mail) —————

export function reminderText(s: Summary | null, today: string) {
  const name = s?.name ? `${s.name}, ` : "";
  const missed = s?.lastActiveDate ? Math.max(0, daysBetween(today, s.lastActiveDate) - 1) : 0;
  const day = s ? `Jour ${s.programDay} du programme` : "Votre séance du jour";
  let title: string;
  let body: string;
  if (s && s.streak >= 2) {
    title = `🔥 ${s.streak} jours d'affilée : on continue ?`;
    body = `${name}votre série vous attend. ${day} : 15 minutes pour parler avec plus d'aisance.`;
  } else if (missed >= 2) {
    title = "Votre voix vous attend 🎙️";
    body = `${name}cela fait ${missed} jours ! Un échauffement et trois virelangues suffisent pour reprendre le rythme.`;
  } else {
    title = "C'est l'heure de votre séance d'éloquence ✨";
    body = `${name}${day} : souffle, articulation et une prise de parole vous attendent.`;
  }
  return { title, body };
}

export function reminderEmail(p: Profile, today: string) {
  const s = p.summary;
  const { title, body } = reminderText(s, today);
  const html = layout({
    preheader: body,
    title,
    body: `<p style="margin:0 0 12px">${hello(s?.name)}</p>
<p style="margin:0 0 8px">${esc(body)}</p>
${s ? statRow([[`🔥 ${s.streak}`, "série"], [String(s.exercises), "exercices"], [s.avgScore == null ? "—" : `${s.avgScore}/100`, "score moyen"]]) : ""}
${s ? `<p style="margin:0 0 6px;font-size:14px;color:#6b655c">Programme 30 jours · ${s.programDone} jour(s) terminé(s)</p>${bar((s.programDone / 30) * 100)}` : ""}`,
    cta: { label: "Commencer ma séance", href: `${appUrl()}/#programme` },
  });
  return { subject: title, html };
}

// ————— Bilan hebdomadaire —————

export function weeklyEmail(p: Profile, state: StoredState | null, today: string) {
  const s = p.summary;
  const w = weekStats(state, today);
  const verdict =
    w.activeDays >= 6 ? "Semaine parfaite, bravo ! 🏆" : w.activeDays >= 4 ? "Très belle semaine 💪" : w.activeDays >= 1 ? "Chaque séance compte 🌱" : "Nouvelle semaine, nouveau départ 🚀";
  const html = layout({
    preheader: `${w.activeDays} jour(s) actif(s), ${w.exercises} exercice(s) cette semaine`,
    title: "Votre bilan de la semaine",
    body: `<p style="margin:0 0 12px">${hello(s?.name)}</p>
<p style="margin:0 0 4px"><b>${verdict}</b></p>
${statRow([[`${w.activeDays}/7`, "jours actifs"], [String(w.exercises), "exercices"], [String(w.speeches), "discours analysés"]])}
${statRow([[w.avgScore === null ? "—" : `${w.avgScore}/100`, "score moyen"], [`${w.minutes} min`, "de parole"], [`🔥 ${s?.streak ?? 0}`, "série actuelle"]])}
${w.top.length ? `<p style="margin:0 0 12px;font-size:14px;color:#6b655c">Cette semaine : ${esc(w.top.join(", "))}.</p>` : ""}
${
  s
    ? `<p style="margin:18px 0 6px;font-size:15px"><b>Programme 30 jours</b> · ${s.programDone}/30</p>${bar((s.programDone / 30) * 100)}
<p style="margin:14px 0 0;font-size:14px;color:#6b655c">🎓 ${s.lessonsRead} cours lus · 🏅 ${s.badges} badges · meilleure série : ${s.bestStreak} jours.</p>`
    : ""
}`,
    cta: { label: "Continuer mon programme", href: `${appUrl()}/#programme` },
  });
  return { subject: `📊 Votre bilan : ${w.activeDays} jour${w.activeDays > 1 ? "s" : ""} actif${w.activeDays > 1 ? "s" : ""}, ${w.exercises} exercice${w.exercises > 1 ? "s" : ""}`, html };
}

// ————— Paliers —————

interface Milestone {
  id: string;
  title: string;
  text: string;
  emoji: string;
}

export function newMilestones(next: Summary, already: string[]): Milestone[] {
  const out: Milestone[] = [];
  const seen = new Set(already);
  const add = (m: Milestone) => {
    if (!seen.has(m.id)) out.push(m);
  };
  if (next.exercises >= 1) add({ id: "first", emoji: "🎉", title: "Premier exercice réalisé !", text: "Le plus dur est fait : vous avez commencé. Revenez demain pour garder le rythme." });
  for (const n of [7, 30, 100, 365])
    if (next.streak >= n) add({ id: `streak-${n}`, emoji: "🔥", title: `${n} jours d'affilée !`, text: `Quelle régularité : ${n} jours de suite. C'est exactement ce qui transforme une prise de parole.` });
  for (const n of [10, 50, 100])
    if (next.speeches >= n) add({ id: `speeches-${n}`, emoji: "🎤", title: `${n} prises de parole analysées !`, text: `Vous avez parlé et été analysé ${n} fois. Comparez vos premières et vos dernières séances dans Progression.` });
  if (next.bestScore != null && next.bestScore >= 85) add({ id: "score-85", emoji: "🏆", title: "Un score de 85 !", text: "Débit, pauses, vocabulaire, voix : votre prise de parole a atteint un excellent niveau." });
  if (next.programDone >= 7) add({ id: "program-7", emoji: "📅", title: "Première semaine du programme terminée !", text: "Les fondations sont posées : souffle, articulation, posture. Place à la voix." });
  if (next.programDone >= 30) add({ id: "program-30", emoji: "🎓", title: "Programme 30 jours terminé !", text: "Vous avez suivi tout le parcours. Refaites votre présentation du jour 1 et mesurez le chemin parcouru." });
  return out;
}

export function milestoneEmail(p: Profile, m: Milestone) {
  const s = p.summary;
  const html = layout({
    preheader: m.text,
    title: `${m.emoji} ${m.title}`,
    body: `<p style="margin:0 0 12px">${hello(s?.name)}</p><p style="margin:0 0 8px">${esc(m.text)}</p>
${s ? statRow([[`🔥 ${s.streak}`, "série"], [String(s.exercises), "exercices"], [`${s.badges}`, "badges"]]) : ""}`,
    cta: { label: "Voir mes progrès", href: `${appUrl()}/#progression` },
  });
  return { subject: `${m.emoji} ${m.title}`, html };
}

export function welcomeEmail(name?: string) {
  return {
    subject: "Bienvenue dans Éloquence 🎙️",
    html: layout({
      preheader: "Votre entraînement à la prise de parole commence maintenant.",
      title: "Bienvenue dans Éloquence !",
      body: `<p style="margin:0 0 12px">${hello(name)}</p>
<p style="margin:0 0 12px">Votre compte est créé : votre progression est sauvegardée et vous suit sur tous vos appareils.</p>
<p style="margin:0 0 6px"><b>Chaque jour, en 15 minutes :</b></p>
<ul style="margin:0 0 12px;padding-left:20px"><li>respiration et échauffement vocal</li><li>virelangues notés pour l'articulation</li><li>une prise de parole analysée : débit, tics, pauses, voix</li><li>un cours ou un quiz pour apprendre les techniques des orateurs</li></ul>
<p style="margin:0">Choisissez vos jours et votre heure de rappel dans <b>Compte &amp; rappels</b>.</p>`,
      cta: { label: "Commencer le programme", href: `${appUrl()}/#programme` },
    }),
  };
}

export function codeEmail(code: string) {
  return {
    subject: `${code} est votre code Éloquence`,
    html: layout({
      preheader: `Votre code de connexion : ${code}`,
      title: "Votre code de connexion",
      body: `<p style="margin:0 0 12px">Voici votre code pour vous connecter à Éloquence :</p>
<p style="margin:0 0 16px;font-size:36px;font-weight:800;letter-spacing:8px;color:#b4432b">${code}</p>
<p style="margin:0;font-size:14px;color:#6b655c">Il est valable 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>`,
    }),
  };
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
}
