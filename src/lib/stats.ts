import { ACTIVITY_IDS, type ActivityId, type DayLog, type Grade, type RunStats } from '@/types'
import { challengeDays, formatCompact, isChallengeDay, weekdayName } from './dates'

export const GRADE_POINTS: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 }

export function gradeFromPoints(points: number): Grade {
  if (points >= 4.5) return 'A'
  if (points >= 3.5) return 'B'
  if (points >= 2.5) return 'C'
  if (points >= 1.5) return 'D'
  return 'F'
}

export function isAllComplete(log: Pick<DayLog, ActivityId> | undefined): boolean {
  if (!log) return false
  return ACTIVITY_IDS.every((id) => log[id]?.completed === true)
}

export type DayStatus = 'complete' | 'partial' | 'missed' | 'pending' | 'rest'

export function dayStatus(date: string, log: DayLog | undefined, today: string): DayStatus {
  if (!isChallengeDay(date) && !log) return 'rest'
  if (date > today) return 'pending'
  if (!log) return date === today ? 'pending' : 'missed'
  const done = ACTIVITY_IDS.filter((id) => log[id]?.completed).length
  if (done === ACTIVITY_IDS.length) return 'complete'
  if (done > 0) return 'partial'
  return 'missed'
}

/**
 * Strict streak: every Mon–Fri in the run must have all three activities complete.
 * A settled day (one that is already over) that is not perfect resets the count to zero.
 * Today is never counted as a miss until it is logged complete.
 */
export function computeStreaks(
  dates: string[],
  logs: Record<string, DayLog>,
  today: string,
): { current: number; longest: number } {
  let current = 0
  let longest = 0
  for (const date of dates) {
    if (date > today) break
    const complete = isAllComplete(logs[date])
    if (complete) {
      current += 1
      longest = Math.max(longest, current)
    } else if (date < today) {
      current = 0
    }
  }
  return { current, longest }
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function round(value: number, places = 1): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

export function computeStats(
  startDate: string,
  endDate: string,
  logs: Record<string, DayLog>,
  today: string,
): RunStats {
  const dates = challengeDays(startDate, endDate)
  const elapsed = dates.filter((d) => d <= today)
  const settledOrToday = elapsed

  const { current, longest } = computeStreaks(dates, logs, today)

  const perActivity = {} as RunStats['perActivity']
  for (const id of ACTIVITY_IDS) {
    const completed = settledOrToday.filter((d) => logs[d]?.[id]?.completed).length
    const possible = settledOrToday.length
    perActivity[id] = {
      completed,
      possible,
      percent: possible === 0 ? 0 : round((completed / possible) * 100),
    }
  }

  const totalPossible = settledOrToday.length * ACTIVITY_IDS.length
  const totalCompleted = ACTIVITY_IDS.reduce((sum, id) => sum + perActivity[id].completed, 0)

  const byWeekday = new Map<string, { completed: number; possible: number }>()
  for (const date of settledOrToday) {
    const name = weekdayName(date)
    const entry = byWeekday.get(name) ?? { completed: 0, possible: 0 }
    entry.possible += 1
    if (isAllComplete(logs[date])) entry.completed += 1
    byWeekday.set(name, entry)
  }
  let bestDay: RunStats['bestDay'] = null
  for (const [weekday, entry] of byWeekday) {
    const rate = entry.completed / entry.possible
    const bestRate = bestDay ? bestDay.completed / bestDay.possible : -1
    if (rate > bestRate || (rate === bestRate && bestDay && entry.possible > bestDay.possible)) {
      bestDay = { weekday, ...entry }
    }
  }
  if (bestDay && bestDay.completed === 0) bestDay = null

  // A bottleneck only exists if one activity is strictly behind the others.
  const percents = ACTIVITY_IDS.map((id) => perActivity[id].percent)
  const lowest = Math.min(...percents)
  const tied = percents.filter((p) => p === lowest).length > 1
  const hardestActivity: ActivityId | null =
    settledOrToday.length === 0 || tied
      ? null
      : (ACTIVITY_IDS.find((id) => perActivity[id].percent === lowest) ?? null)

  const gradePoints: number[] = []
  const moodPoints: number[] = []
  const qualityTrend: RunStats['qualityTrend'] = []
  const moodTrend: RunStats['moodTrend'] = []

  for (const date of dates) {
    const log = logs[date]
    const dayGrades: number[] = []
    const dayMoods: number[] = []
    if (log) {
      for (const id of ACTIVITY_IDS) {
        const entry = log[id]
        if (entry?.grade) dayGrades.push(GRADE_POINTS[entry.grade])
        if (entry?.mood) dayMoods.push(entry.mood)
      }
    }
    gradePoints.push(...dayGrades)
    moodPoints.push(...dayMoods)
    const label = formatCompact(date)
    const dayGrade = average(dayGrades)
    const dayMood = average(dayMoods)
    qualityTrend.push({ date, label, value: dayGrade === null ? null : round(dayGrade, 2) })
    moodTrend.push({ date, label, value: dayMood === null ? null : round(dayMood, 2) })
  }

  const weeks: RunStats['weeks'] = []
  for (let i = 0; i < dates.length; i += 5) {
    const chunk = dates.slice(i, i + 5)
    const chunkElapsed = chunk.filter((d) => d <= today)
    const completedInChunk = chunkElapsed.reduce(
      (sum, d) => sum + ACTIVITY_IDS.filter((id) => logs[d]?.[id]?.completed).length,
      0,
    )
    const possibleInChunk = chunkElapsed.length * ACTIVITY_IDS.length
    weeks.push({
      index: weeks.length + 1,
      label: `Week ${weeks.length + 1}`,
      start: chunk[0],
      end: chunk[chunk.length - 1],
      completionPercent: possibleInChunk === 0 ? 0 : round((completedInChunk / possibleInChunk) * 100),
      perfectDays: chunkElapsed.filter((d) => isAllComplete(logs[d])).length,
      loggedDays: chunkElapsed.filter((d) => Boolean(logs[d])).length,
      totalDays: chunk.length,
    })
  }

  const avgQuality = average(gradePoints)
  const avgMood = average(moodPoints)

  return {
    completionPercent: totalPossible === 0 ? 0 : round((totalCompleted / totalPossible) * 100),
    perActivity,
    currentStreak: current,
    longestStreak: longest,
    perfectDays: settledOrToday.filter((d) => isAllComplete(logs[d])).length,
    loggedDays: settledOrToday.filter((d) => Boolean(logs[d])).length,
    elapsedDays: settledOrToday.length,
    totalDays: dates.length,
    bestDay,
    hardestActivity,
    averageQuality: avgQuality === null ? null : round(avgQuality, 2),
    averageMood: avgMood === null ? null : round(avgMood, 2),
    qualityTrend,
    moodTrend,
    weeks,
  }
}
