import type { DayLog, Profile, Run, StudyTopic } from '@/types'
import type { HabitStore, NewRunInput, SessionUser } from './store'

/**
 * Offline store used when no Firebase credentials are present, so the app is
 * runnable for local development and demos. Data lives in this browser only.
 */

const KEY = 'habitat-tracker/local-v1'
const DEMO_UID = 'local-user'

interface LocalState {
  user: SessionUser | null
  profile: Profile | null
  runs: Run[]
  logs: Record<string, Record<string, DayLog>>
  studyTopics: StudyTopic[]
}

function emptyState(): LocalState {
  return { user: null, profile: null, runs: [], logs: {}, studyTopics: [] }
}

function read(): LocalState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...emptyState(), ...(JSON.parse(raw) as LocalState) } : emptyState()
  } catch {
    return emptyState()
  }
}

function write(state: LocalState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable: keep the in-memory copy only */
  }
}

export function createLocalStore(): HabitStore {
  let state = read()
  const listeners = new Set<() => void>()

  const commit = (next: LocalState) => {
    state = next
    write(state)
    listeners.forEach((fn) => fn())
  }

  const subscribe = (fn: () => void) => {
    listeners.add(fn)
    fn()
    return () => listeners.delete(fn) as unknown as void
  }

  return {
    kind: 'local',

    watchAuth(callback) {
      return subscribe(() => callback(state.user))
    },

    async signIn(email) {
      const user = { uid: DEMO_UID, email }
      commit({
        ...state,
        user,
        profile: state.profile ?? {
          email,
          discordWebhookUrl: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
          createdAt: Date.now(),
        },
      })
    },

    async signUp(email, password) {
      await this.signIn(email, password)
    },

    async signOut() {
      commit({ ...state, user: null })
    },

    watchProfile(_uid, callback) {
      return subscribe(() => callback(state.profile))
    },

    async saveProfile(_uid, patch) {
      const base: Profile = state.profile ?? {
        email: state.user?.email ?? '',
        discordWebhookUrl: '',
        timezone: 'America/Chicago',
        createdAt: Date.now(),
      }
      commit({ ...state, profile: { ...base, ...patch } })
    },

    watchRuns(_uid, callback) {
      return subscribe(() =>
        callback([...state.runs].sort((a, b) => b.startDate.localeCompare(a.startDate))),
      )
    },

    async createRun(_uid, input: NewRunInput) {
      const id = `run-${Date.now()}`
      const run: Run = { id, ...input, status: 'active', createdAt: Date.now(), archivedAt: null }
      commit({ ...state, runs: [...state.runs, run], logs: { ...state.logs, [id]: {} } })
      return id
    },

    async archiveRun(_uid, runId) {
      commit({
        ...state,
        runs: state.runs.map((run) =>
          run.id === runId ? { ...run, status: 'archived', archivedAt: Date.now() } : run,
        ),
      })
    },

    watchLogs(_uid, runId, callback) {
      return subscribe(() => callback(state.logs[runId] ?? {}))
    },

    async saveLog(_uid, runId, log) {
      commit({
        ...state,
        logs: { ...state.logs, [runId]: { ...(state.logs[runId] ?? {}), [log.date]: log } },
      })
    },

    watchStudyTopics(_uid, callback) {
      return subscribe(() => callback([...state.studyTopics].sort((a, b) => a.order - b.order)))
    },

    async saveStudyTopic(_uid, topic) {
      const exists = state.studyTopics.some((t) => t.id === topic.id)
      commit({
        ...state,
        studyTopics: exists
          ? state.studyTopics.map((t) => (t.id === topic.id ? topic : t))
          : [...state.studyTopics, topic],
      })
    },

    async deleteStudyTopic(_uid, topicId) {
      commit({ ...state, studyTopics: state.studyTopics.filter((t) => t.id !== topicId) })
    },
  }
}
