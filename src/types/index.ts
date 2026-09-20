export const ACTIVITY_IDS = ['trading_study', 'meditation', 'hunting'] as const
export type ActivityId = (typeof ACTIVITY_IDS)[number]

export const GRADES = ['A', 'B', 'C', 'D', 'F'] as const
export type Grade = (typeof GRADES)[number]

export type Mood = 1 | 2 | 3 | 4 | 5

export interface ActivityConfig {
  label: string
  icon: string
  target: string
  unit: 'hours' | 'minutes' | 'sessions'
  /** Minimum time in minutes that meets the target; null for session-based activities. */
  targetMinutes: number | null
}

export type ActivityMap<T> = Record<ActivityId, T>

export interface ActivityEntry {
  completed: boolean
  grade: Grade | null
  mood: Mood | null
  timeSpent: number | null
  notes: string
}

export interface DayLog {
  /** ISO date, e.g. "2026-09-22". Also the Firestore document id. */
  date: string
  trading_study: ActivityEntry
  meditation: ActivityEntry
  hunting: ActivityEntry
  allComplete: boolean
  dailyStreak: number
  loggedAt: number
  updatedAt: number
}

export type RunStatus = 'active' | 'archived'

export interface Run {
  id: string
  name: string
  startDate: string
  endDate: string
  status: RunStatus
  activities: ActivityMap<ActivityConfig>
  createdAt: number
  archivedAt: number | null
}

export interface Profile {
  email: string
  discordWebhookUrl: string
  timezone: string
  createdAt: number
}

export interface WeekSummary {
  index: number
  label: string
  start: string
  end: string
  completionPercent: number
  perfectDays: number
  loggedDays: number
  totalDays: number
}

export interface RunStats {
  completionPercent: number
  perActivity: ActivityMap<{ completed: number; possible: number; percent: number }>
  currentStreak: number
  longestStreak: number
  perfectDays: number
  loggedDays: number
  elapsedDays: number
  totalDays: number
  bestDay: { weekday: string; completed: number; possible: number } | null
  hardestActivity: ActivityId | null
  averageQuality: number | null
  averageMood: number | null
  qualityTrend: Array<{ date: string; label: string; value: number | null }>
  moodTrend: Array<{ date: string; label: string; value: number | null }>
  weeks: WeekSummary[]
}
