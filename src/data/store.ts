import type { ActivityConfig, ActivityMap, DayLog, Profile, Run } from '@/types'

export interface SessionUser {
  uid: string
  email: string
}

export interface NewRunInput {
  name: string
  startDate: string
  endDate: string
  activities: ActivityMap<ActivityConfig>
}

export type Unsubscribe = () => void

export interface HabitStore {
  /** "firebase" when real credentials are configured, "local" for the offline demo store. */
  readonly kind: 'firebase' | 'local'
  watchAuth(callback: (user: SessionUser | null) => void): Unsubscribe
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  signOut(): Promise<void>

  watchProfile(uid: string, callback: (profile: Profile | null) => void): Unsubscribe
  saveProfile(uid: string, patch: Partial<Profile>): Promise<void>

  watchRuns(uid: string, callback: (runs: Run[]) => void): Unsubscribe
  createRun(uid: string, input: NewRunInput): Promise<string>
  archiveRun(uid: string, runId: string): Promise<void>

  watchLogs(uid: string, runId: string, callback: (logs: Record<string, DayLog>) => void): Unsubscribe
  saveLog(uid: string, runId: string, log: DayLog): Promise<void>
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.'
    case 'auth/email-already-in-use':
      return 'An account already exists for that email.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a few minutes.'
    default:
      return error instanceof Error ? error.message : 'Something went wrong. Try again.'
  }
}
