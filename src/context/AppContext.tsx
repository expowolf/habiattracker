import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { store, type NewRunInput, type SessionUser } from '@/data'
import { todayISO } from '@/lib/dates'
import { computeStats } from '@/lib/stats'
import type { DayLog, Profile, Run, RunStats, StudyTopic } from '@/types'

interface AppContextValue {
  user: SessionUser | null
  profile: Profile | null
  authReady: boolean
  runs: Run[]
  activeRun: Run | null
  selectedRun: Run | null
  selectRun: (runId: string | null) => void
  logs: Record<string, DayLog>
  stats: RunStats | null
  studyTopics: StudyTopic[]
  /** First unfinished topic in the backlog — what to study next. */
  nextTopic: StudyTopic | null
  saveStudyTopic: (topic: StudyTopic) => Promise<void>
  deleteStudyTopic: (topicId: string) => Promise<void>
  timezone: string
  today: string
  loadingRun: boolean
  saveLog: (log: DayLog) => Promise<void>
  createRun: (input: NewRunInput) => Promise<string>
  archiveRun: (runId: string) => Promise<void>
  saveProfile: (patch: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [logs, setLogs] = useState<Record<string, DayLog>>({})
  const [studyTopics, setStudyTopics] = useState<StudyTopic[]>([])
  const [loadingRun, setLoadingRun] = useState(true)

  useEffect(
    () =>
      store.watchAuth((next) => {
        setUser(next)
        setAuthReady(true)
        if (!next) {
          setProfile(null)
          setRuns([])
          setLogs({})
          setStudyTopics([])
          setSelectedRunId(null)
        }
      }),
    [],
  )

  useEffect(() => {
    if (!user) return
    return store.watchProfile(user.uid, setProfile)
  }, [user])

  useEffect(() => {
    if (!user) return
    return store.watchRuns(user.uid, (next) => {
      setRuns(next)
      setLoadingRun(false)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    return store.watchStudyTopics(user.uid, setStudyTopics)
  }, [user])

  const activeRun = useMemo(() => runs.find((run) => run.status === 'active') ?? null, [runs])

  const selectedRun = useMemo(() => {
    if (selectedRunId) return runs.find((run) => run.id === selectedRunId) ?? activeRun
    return activeRun ?? runs[0] ?? null
  }, [runs, selectedRunId, activeRun])

  useEffect(() => {
    if (!user || !selectedRun) {
      setLogs({})
      return
    }
    return store.watchLogs(user.uid, selectedRun.id, setLogs)
  }, [user, selectedRun])

  const timezone =
    profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'
  const today = todayISO(timezone)

  const stats = useMemo(
    () => (selectedRun ? computeStats(selectedRun.startDate, selectedRun.endDate, logs, today) : null),
    [selectedRun, logs, today],
  )

  const saveLog = useCallback(
    async (log: DayLog) => {
      if (!user || !selectedRun) throw new Error('No active challenge to log against.')
      if (selectedRun.status === 'archived') throw new Error('This run is archived and cannot be edited.')
      await store.saveLog(user.uid, selectedRun.id, log)
    },
    [user, selectedRun],
  )

  const createRun = useCallback(
    async (input: NewRunInput) => {
      if (!user) throw new Error('Not signed in.')
      const id = await store.createRun(user.uid, input)
      setSelectedRunId(id)
      return id
    },
    [user],
  )

  const archiveRun = useCallback(
    async (runId: string) => {
      if (!user) throw new Error('Not signed in.')
      await store.archiveRun(user.uid, runId)
    },
    [user],
  )

  const nextTopic = useMemo(
    () => studyTopics.find((topic) => topic.status === 'todo') ?? null,
    [studyTopics],
  )

  const saveStudyTopic = useCallback(
    async (topic: StudyTopic) => {
      if (!user) throw new Error('Not signed in.')
      await store.saveStudyTopic(user.uid, topic)
    },
    [user],
  )

  const deleteStudyTopic = useCallback(
    async (topicId: string) => {
      if (!user) throw new Error('Not signed in.')
      await store.deleteStudyTopic(user.uid, topicId)
    },
    [user],
  )

  const saveProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) throw new Error('Not signed in.')
      await store.saveProfile(user.uid, patch)
    },
    [user],
  )

  const value: AppContextValue = {
    user,
    profile,
    authReady,
    runs,
    activeRun,
    selectedRun,
    selectRun: setSelectedRunId,
    logs,
    stats,
    studyTopics,
    nextTopic,
    saveStudyTopic,
    deleteStudyTopic,
    timezone,
    today,
    loadingRun,
    saveLog,
    createRun,
    archiveRun,
    saveProfile,
    signOut: () => store.signOut(),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
