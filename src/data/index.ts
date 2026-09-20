import { createFirebaseStore, isFirebaseConfigured } from './firebaseStore'
import { createLocalStore } from './localStore'
import type { HabitStore } from './store'

export const store: HabitStore = isFirebaseConfigured() ? createFirebaseStore() : createLocalStore()

export const isLocalMode = store.kind === 'local'

export * from './store'
