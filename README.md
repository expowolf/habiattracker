# Habitat Tracker

A two-week "non-negotiables" tracker for three daily habits — Mind (trading study), Spirit
(meditation), and Body (hunting) — built around a strict streak counter, evening logging, and an
analytics dashboard.

React 18 + TypeScript + Vite · Tailwind CSS · Firebase Auth & Firestore · Recharts · Framer Motion

## The rules it enforces

- **Weekdays only.** Monday–Friday are challenge days; weekends are rest days and never break a streak.
- **Strict streak.** All three activities complete on a challenge day earns one point. Any settled
  weekday that is not perfect resets the streak to zero.
- **Today is never a miss.** An unlogged day only breaks the streak once it is in the past, so the
  counter does not drop while you still have time to finish.
- **Archived runs are read-only**, enforced both in the UI and in the Firestore security rules.

## Study plan

The trading habit is backed by an ordered backlog of topics, so the morning nudge has a concrete
answer rather than "study something". The first unfinished topic is **next up**: it appears on the
dashboard and is preselected when you log the day. Reorder with the arrows to change what comes
next; tick *Finished it* while logging to retire a topic and advance the queue.

The backlog is **global, not per-run** — unfinished topics roll forward into your next challenge,
and each completed topic records which run covered it (`completedInRunId`), so archived runs stay
auditable. A topic can span several days: selecting it records what you studied, while marking it
covered is a separate, deliberate action.

## Running locally

```bash
npm install
npm run dev
```

With no Firebase credentials present the app starts in **local demo mode**: sign in with any email
and password, and all data is kept in that browser's `localStorage`. This is useful for trying the
app out, but it is not persistence — clearing site data erases everything.

## Connecting Firebase

1. Create a Firebase project, then enable **Authentication → Email/Password** and **Firestore**.
2. Copy the web app config into `.env` (see `.env.example`):

   ```
   VITE_FIREBASE_API_KEY=…
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=…
   VITE_FIREBASE_APP_ID=…
   ```

3. Deploy the security rules: `npx firebase deploy --only firestore:rules`

Restart the dev server; the banner disappears once real credentials are detected.

### Data model

```
users/{uid}                                    profile: email, discordWebhookUrl, timezone
users/{uid}/studyTopics/{topicId}              trading study backlog, ordered, spans runs
users/{uid}/runs/{runId}                       name, startDate, endDate, status, activities
users/{uid}/runs/{runId}/logs/{YYYY-MM-DD}     per-activity completion, grade, mood, time, notes
                                               plus studyTopicId: what was studied that day
```

Statistics (completion %, streaks, best day, hardest activity, quality and mood trends, weekly
summaries) are **derived** from the logs by `src/lib/stats.ts` rather than stored. They therefore
cannot drift out of sync with the underlying entries, and editing a past day recomputes everything.

## Deploying to Vercel

Import the repository, keep the detected Vite settings (`npm run build` → `dist`), and add the six
`VITE_FIREBASE_*` variables under **Settings → Environment Variables**. `vercel.json` already
rewrites all paths to `index.html` so client-side routes deep-link correctly.

## Discord reminders

`.github/workflows/habit-reminders.yml` sends two Discord messages on weekdays: a 07:00 nudge
listing the three activities and a 20:00 check-in prompting you to log.

Configure in the repository:

- **Secret** `DISCORD_WEBHOOK_URL` — from Discord: Server Settings → Integrations → Webhooks.
- **Variable** `APP_URL` — your deployed URL, so the messages link back to the app.

Use **Actions → Habit Reminders → Run workflow** to send one on demand, or the *Send test message*
button in Settings to verify the webhook itself.

### A note on the schedule

GitHub Actions cron runs only in UTC, while `America/Chicago` alternates between UTC-6 and UTC-5.
The workflow therefore schedules **both** candidate UTC hours for each reminder and a guard step
drops the run that does not land on 07:00 / 20:00 local time. The guard also re-checks the local
weekday, because an evening reminder at 20:00 CST falls on the *next* UTC day — a `0 2 * * 1-5`
schedule would actually deliver Sunday through Thursday evenings.

To track a different timezone, change `TIMEZONE` in the workflow's `env` block and adjust the four
cron lines to the matching UTC hours.

## Project layout

```
src/lib/stats.ts        streak and analytics engine (pure functions, the core of the app)
src/lib/dates.ts        timezone-aware date helpers; ISO dates anchored at UTC noon
src/data/               store interface with Firebase and local-demo implementations
src/context/            auth, active run, logs, and derived stats
src/pages/              dashboard, analytics, logging, day detail, runs, settings
```

## Scope notes

Two deliberate departures from the original build spec:

- **No Cloud Functions.** The spec proposed `logHabit`, `calculateStats`, `archiveRun`, and
  `createNewRun` as callable functions. For a single-user app whose statistics are deterministic
  functions of the logs, a server round-trip adds a second write path to keep consistent, and
  Cloud Functions require the Blaze billing plan. Ownership and the archived-run lock are enforced
  by Firestore security rules instead. If multi-user or server-side scheduling is added later,
  `src/lib/stats.ts` is already a dependency-free module that a function can import as-is.
- **Local demo mode** is not in the spec. It exists so the app is runnable and testable without
  provisioning Firebase; it is bypassed entirely the moment credentials are present.
