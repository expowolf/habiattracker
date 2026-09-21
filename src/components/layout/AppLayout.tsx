import { motion } from 'framer-motion'
import {
  BarChart3,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogOut,
  Settings,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { isLocalMode } from '@/data'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/study', label: 'Study', icon: GraduationCap, end: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/runs', label: 'Runs', icon: Layers, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

function NavItems({ orientation }: { orientation: 'sidebar' | 'bottom' }) {
  const isBottom = orientation === 'bottom'
  return (
    <>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
              isBottom ? 'flex-1 flex-col gap-1 py-2 text-[11px]' : 'px-3 py-2.5',
              isActive ? 'text-heading' : 'text-muted hover:text-body',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <motion.span
                  layoutId={`nav-${orientation}`}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className={cn(
                    'absolute inset-0 rounded-lg bg-elevated/80',
                    isBottom && 'rounded-xl',
                  )}
                />
              ) : null}
              <Icon className={cn('relative shrink-0', isBottom ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden />
              <span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  )
}

export function AppLayout() {
  const { user, selectedRun, signOut } = useApp()
  const location = useLocation()

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/70 bg-surface/50 p-4 backdrop-blur-sm lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-heading">Habitat</p>
            <p className="text-[11px] text-muted">Non-negotiables</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Primary">
          <NavItems orientation="sidebar" />
        </nav>

        <div className="mt-auto space-y-3 px-2 pt-6">
          {selectedRun ? (
            <div className="rounded-lg border border-border/70 bg-elevated/40 p-3">
              <p className="stat-label">Current run</p>
              <p className="mt-1 truncate text-xs text-body">{selectedRun.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">
                {selectedRun.status}
              </p>
            </div>
          ) : null}
          <p className="truncate text-[11px] text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-bg/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-heading">Habitat</span>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sign out"
            className="text-muted transition-colors hover:text-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {isLocalMode ? (
          <p className="border-b border-warn/25 bg-warn/10 px-4 py-2 text-center text-[11px] text-warn">
            Local demo mode — Firebase is not configured, so data stays in this browser.
          </p>
        ) : null}

        <main key={location.pathname} className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>

        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-20 flex gap-1 border-t border-border/70 bg-bg/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md lg:hidden"
        >
          <NavItems orientation="bottom" />
        </nav>
      </div>
    </div>
  )
}
