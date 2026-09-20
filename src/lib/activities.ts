import type { ActivityConfig, ActivityEntry, ActivityId, ActivityMap } from '@/types'

export const DEFAULT_ACTIVITIES: ActivityMap<ActivityConfig> = {
  trading_study: {
    label: 'Trading Study',
    icon: '🧠',
    target: '1 hour',
    unit: 'hours',
    targetMinutes: 60,
  },
  meditation: {
    label: 'Meditation',
    icon: '🧘',
    target: '10 minutes',
    unit: 'minutes',
    targetMinutes: 10,
  },
  hunting: {
    label: 'Hunting',
    icon: '🎯',
    target: '1 session',
    unit: 'sessions',
    targetMinutes: null,
  },
}

export const PILLARS: ActivityMap<string> = {
  trading_study: 'Mind',
  meditation: 'Spirit',
  hunting: 'Body',
}

export const EMPTY_ENTRY: ActivityEntry = {
  completed: false,
  grade: null,
  mood: null,
  timeSpent: null,
  notes: '',
}

export function activityLabel(
  activities: ActivityMap<ActivityConfig> | undefined,
  id: ActivityId,
): string {
  return activities?.[id]?.label ?? DEFAULT_ACTIVITIES[id].label
}
