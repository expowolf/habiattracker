import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type Auth,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import type { DayLog, Profile, Run, StudyTopic } from '@/types'
import type { HabitStore, NewRunInput } from './store'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain)
}

export function createFirebaseStore(): HabitStore {
  const app: FirebaseApp = initializeApp(firebaseConfig)
  const auth: Auth = getAuth(app)
  const db: Firestore = getFirestore(app)

  const runsRef = (uid: string) => collection(db, 'users', uid, 'runs')
  const logsRef = (uid: string, runId: string) => collection(db, 'users', uid, 'runs', runId, 'logs')
  const topicsRef = (uid: string) => collection(db, 'users', uid, 'studyTopics')

  return {
    kind: 'firebase',

    watchAuth(callback) {
      return onAuthStateChanged(auth, (user) => {
        callback(user ? { uid: user.uid, email: user.email ?? '' } : null)
      })
    },

    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
    },

    async signUp(email, password) {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(
        doc(db, 'users', credential.user.uid),
        {
          email,
          discordWebhookUrl: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
          createdAt: serverTimestamp(),
        },
        { merge: true },
      )
    },

    async signOut() {
      await fbSignOut(auth)
    },

    watchProfile(uid, callback) {
      return onSnapshot(doc(db, 'users', uid), (snap) => {
        callback(snap.exists() ? (snap.data() as Profile) : null)
      })
    },

    async saveProfile(uid, patch) {
      await setDoc(doc(db, 'users', uid), patch, { merge: true })
    },

    watchRuns(uid, callback) {
      return onSnapshot(query(runsRef(uid), orderBy('startDate', 'desc')), (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Run, 'id'>) })))
      })
    },

    async createRun(uid, input: NewRunInput) {
      const ref = doc(runsRef(uid))
      await setDoc(ref, {
        ...input,
        status: 'active',
        createdAt: Date.now(),
        archivedAt: null,
      })
      return ref.id
    },

    async archiveRun(uid, runId) {
      await updateDoc(doc(db, 'users', uid, 'runs', runId), {
        status: 'archived',
        archivedAt: Date.now(),
      })
    },

    watchLogs(uid, runId, callback) {
      return onSnapshot(logsRef(uid, runId), (snap) => {
        const logs: Record<string, DayLog> = {}
        snap.docs.forEach((d) => {
          logs[d.id] = { ...(d.data() as DayLog), date: d.id }
        })
        callback(logs)
      })
    },

    async saveLog(uid, runId, log) {
      await setDoc(doc(db, 'users', uid, 'runs', runId, 'logs', log.date), log, { merge: true })
    },

    watchStudyTopics(uid, callback) {
      return onSnapshot(query(topicsRef(uid), orderBy('order')), (snap) => {
        callback(snap.docs.map((d) => ({ ...(d.data() as StudyTopic), id: d.id })))
      })
    },

    async saveStudyTopic(uid, topic) {
      await setDoc(doc(db, 'users', uid, 'studyTopics', topic.id), topic, { merge: true })
    },

    async deleteStudyTopic(uid, topicId) {
      await deleteDoc(doc(db, 'users', uid, 'studyTopics', topicId))
    },
  }
}
