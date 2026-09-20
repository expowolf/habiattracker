export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/** ISO dates are anchored at UTC noon so day arithmetic never trips over DST. */
function anchor(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12))
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** The current calendar date in the given IANA timezone. */
export function todayISO(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return toISO(new Date())
  }
}

/** Wall-clock hour (0-23) in the given IANA timezone. */
export function hourInZone(timezone: string): number {
  try {
    return Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        hour12: false,
      }).format(new Date()),
    )
  } catch {
    return new Date().getHours()
  }
}

export function addDays(iso: string, days: number): string {
  const d = anchor(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toISO(d)
}

export function dayIndex(iso: string): number {
  return anchor(iso).getUTCDay()
}

export function weekdayName(iso: string): string {
  return WEEKDAY_NAMES[dayIndex(iso)]
}

/** Monday–Friday only: the challenge ignores weekends. */
export function isChallengeDay(iso: string): boolean {
  const day = dayIndex(iso)
  return day >= 1 && day <= 5
}

export function eachDay(startISO: string, endISO: string): string[] {
  const out: string[] = []
  let cursor = startISO
  let guard = 0
  while (cursor <= endISO && guard++ < 400) {
    out.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return out
}

/** Every Mon–Fri date within the run, inclusive. */
export function challengeDays(startISO: string, endISO: string): string[] {
  return eachDay(startISO, endISO).filter(isChallengeDay)
}

export function formatShort(iso: string): string {
  const d = anchor(iso)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatLong(iso: string): string {
  const d = anchor(iso)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function formatCompact(iso: string): string {
  const d = anchor(iso)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/** Default 2-week window: the next (or current) Monday plus 11 days, ending on a Friday. */
export function defaultRunWindow(timezone: string): { startDate: string; endDate: string } {
  const today = todayISO(timezone)
  const day = dayIndex(today)
  const offsetToMonday = day === 0 ? 1 : day === 6 ? 2 : 0
  const startDate = addDays(today, offsetToMonday)
  return { startDate, endDate: addDays(startDate, 11) }
}

export function defaultRunName(startDate: string, endDate: string): string {
  const year = anchor(endDate).getUTCFullYear()
  return `${formatCompact(startDate)} – ${formatCompact(endDate)}, ${year}`
}
