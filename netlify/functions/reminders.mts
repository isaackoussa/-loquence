import type { Config } from "@netlify/functions";
import { localParts, profiles, saveProfile, states, type Profile } from "../lib/common.mts";
import { sendMail } from "../lib/mail.mts";
import { reminderEmail, reminderText, weeklyEmail, type StoredState } from "../lib/messages.mts";
import { sendPush } from "../lib/push.mts";

const WINDOW = 15; // minutes : la fonction tourne toutes les 15 minutes

// Rappels aux jours et heures choisis + bilan hebdomadaire le dimanche
export default async () => {
  const { blobs } = await profiles().list();
  let reminded = 0;
  let weekly = 0;
  for (const { key } of blobs) {
    try {
      const p = (await profiles().get(key, { type: "json" })) as Profile | null;
      if (!p || p.blocked) continue;
      const now = localParts(p.prefs.tz);
      const [h, m] = p.prefs.time.split(":").map(Number);
      const target = h * 60 + m;
      const inWindow = now.minutes >= target && now.minutes < target + WINDOW;
      if (!inWindow) continue;
      let changed = false;

      // Rappel : seulement les jours choisis, une fois par jour, et si aucun exercice n'a été fait aujourd'hui
      const doneToday = p.summary?.lastActiveDate === now.date;
      if (p.prefs.days.includes(now.weekday) && p.lastReminder !== now.date && !doneToday && (p.prefs.push || p.prefs.email)) {
        if (p.prefs.push) {
          const { title, body } = reminderText(p.summary, now.date);
          const r = await sendPush(p, { title, body, url: "./#programme", tag: "reminder" });
          if (r === "gone") {
            p.prefs.subscription = null;
            p.prefs.push = false;
          }
        }
        if (p.prefs.email) {
          const mail = reminderEmail(p, now.date);
          await sendMail(p.email, mail.subject, mail.html);
        }
        p.lastReminder = now.date;
        changed = true;
        reminded++;
      }

      // Bilan de la semaine : le dimanche à l'heure de rappel
      if (p.prefs.weekly && now.weekday === 0 && p.lastWeekly !== now.date && p.summary) {
        const state = (await states().get(p.email, { type: "json" })) as StoredState | null;
        const mail = weeklyEmail(p, state, now.date);
        await sendMail(p.email, mail.subject, mail.html);
        p.lastWeekly = now.date;
        changed = true;
        weekly++;
      }
      if (changed) await saveProfile(p);
    } catch (e) {
      console.error("reminders :", key, e);
    }
  }
  console.log(`reminders : ${reminded} rappel(s), ${weekly} bilan(s) sur ${blobs.length} compte(s)`);
};

export const config: Config = { schedule: "*/15 * * * *" };
