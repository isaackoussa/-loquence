// Envoi d'e-mails via Brevo + gabarits HTML.
import { env, type Summary } from "./common.mts";

/** MAIL_DRY_RUN=1 : les e-mails sont écrits dans les logs au lieu d'être envoyés (tests locaux). */
const dryRun = () => env("MAIL_DRY_RUN") === "1";

export function mailConfigured(): boolean {
  return dryRun() || !!(env("BREVO_API_KEY") && env("MAIL_FROM"));
}

export function appUrl(): string {
  return (env("APP_URL") ?? env("URL") ?? "https://eloquence-coach.netlify.app").replace(/\/$/, "");
}

export async function sendMail(to: string, subject: string, html: string): Promise<{ ok: boolean; status?: number; details?: string }> {
  if (dryRun()) {
    console.log(`[MAIL_DRY_RUN] à ${to} — ${subject}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}`);
    return { ok: true };
  }
  const key = env("BREVO_API_KEY");
  const from = env("MAIL_FROM");
  if (!key || !from) return { ok: false, details: "mail_not_configured" };
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: from, name: env("MAIL_FROM_NAME") ?? "Éloquence" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const details = await res.text().catch(() => "");
    console.error("Brevo : échec d'envoi", res.status, details);
    return { ok: false, status: res.status, details };
  }
  return { ok: true };
}

/**
 * Met à jour le contact Brevo avec la progression (attributs), pour pouvoir
 * créer des campagnes et automatisations dans Brevo. Sans effet si non configuré.
 */
export async function syncBrevoContact(email: string, s: Summary | null) {
  const key = env("BREVO_API_KEY");
  if (!key) return;
  const listId = Number(env("BREVO_LIST_ID"));
  const attributes: Record<string, string | number> = {};
  if (s) {
    if (s.name) attributes.PRENOM = s.name;
    Object.assign(attributes, {
      SERIE: s.streak,
      EXERCICES: s.exercises,
      DISCOURS: s.speeches,
      SCORE_MOYEN: s.avgScore ?? 0,
      JOUR_PROGRAMME: s.programDay,
      BADGES: s.badges,
    });
    if (s.lastActiveDate) attributes.DERNIERE_ACTIVITE = s.lastActiveDate;
  }
  const body = JSON.stringify({ email, attributes, updateEnabled: true, ...(listId ? { listIds: [listId] } : {}) });
  const post = (b: string) =>
    fetch("https://api.brevo.com/v3/contacts", { method: "POST", headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" }, body: b });
  try {
    let res = await post(body);
    // Si des attributs n'existent pas encore dans Brevo, on enregistre au moins le contact
    if (!res.ok && res.status === 400) res = await post(JSON.stringify({ email, updateEnabled: true, ...(listId ? { listIds: [listId] } : {}) }));
    if (!res.ok) console.warn("Brevo contact :", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.warn("Brevo contact :", e);
  }
}

// ————— Gabarits —————

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const ACCENT = "#b4432b";

export function layout(opts: { preheader: string; title: string; body: string; cta?: { label: string; href: string } }): string {
  const cta = opts.cta
    ? `<tr><td align="center" style="padding:8px 32px 32px"><a href="${opts.cta.href}" style="display:inline-block;background:${ACCENT};color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:14px 28px;border-radius:12px">${esc(opts.cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1f1d1a">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e3dccf">
<tr><td style="background:${ACCENT};padding:28px 32px;color:#ffffff">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.2);text-align:center;font-family:Georgia,serif;font-weight:700;font-size:22px;color:#fff">É</td>
<td style="padding-left:12px;font-weight:700;font-size:18px;color:#fff">Éloquence</td></tr></table>
<h1 style="margin:18px 0 0;font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#ffffff">${esc(opts.title)}</h1>
</td></tr>
<tr><td style="padding:28px 32px 12px;font-size:16px;line-height:1.6">${opts.body}</td></tr>
${cta}
</table>
<p style="font-size:12px;color:#6b655c;margin:16px 0 0">Vous recevez cet e-mail car vous avez un compte Éloquence. Gérez vos rappels dans <a href="${appUrl()}/#compte" style="color:${ACCENT}">Compte &amp; rappels</a>.</p>
</td></tr></table></body></html>`;
}

export function statRow(items: [string, string][]): string {
  const cells = items
    .map(
      ([v, l]) =>
        `<td align="center" style="padding:14px 6px;background:#f1ece4;border-radius:12px"><div style="font-size:24px;font-weight:800;color:#1f1d1a">${esc(v)}</div><div style="font-size:12px;color:#6b655c">${esc(l)}</div></td>`,
    )
    .join('<td style="width:8px"></td>');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr>${cells}</tr></table>`;
}

export function bar(pct: number, color = ACCENT): string {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ebe5da;border-radius:999px"><tr><td style="width:${p}%;background:${color};height:10px;border-radius:999px;font-size:0">&nbsp;</td><td style="font-size:0">&nbsp;</td></tr></table>`;
}

export const hello = (name?: string) => (name ? `Bonjour ${esc(name)} 👋` : "Bonjour 👋");
export { esc };
