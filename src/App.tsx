import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppProvider, useApp } from '@/context/AppContext'
import { Analytics } from '@/pages/Analytics'
import { Dashboard } from '@/pages/Dashboard'
import { DayDetail } from '@/pages/DayDetail'
import { LogEntry } from '@/pages/LogEntry'
import { Login } from '@/pages/Login'
import { NewRun } from '@/pages/NewRun'
import { Runs } from '@/pages/Runs'
import { Settings } from '@/pages/Settings'
import { StudyPlan } from '@/pages/StudyPlan'

function Gate() {
  const { user, authReady } = useApp()

  if (!authReady) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="study" element={<StudyPlan />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="log" element={<LogEntry />} />
        <Route path="day/:date" element={<DayDetail />} />
        <Route path="runs" element={<Runs />} />
        <Route path="runs/new" element={<NewRun />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Gate />
      </AppProvider>
    </BrowserRouter>
  )
}
