import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, CircleDashed, PartyPopper, Plus, XCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarGrid } from '@/components/CalendarGrid'
import { StreakCounter } from '@/components/StreakCounter'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { DEFAULT_ACTIVITIES, PILLARS } from '@/lib/activities'
import { addDays, formatLong, hourInZone, isChallengeDay } from '@/lib/dates'
import { dayStatus } from '@/lib/stats'
import { cn, formatDuration } from '@/lib/utils'
import { ACTIVITY_IDS, type ActivityEntry } from '@/types'

function TodayActivityRow({
  id,
  label,
  icon,
  target,
  entry: record,
}: {
  id: string
  label: string
  icon: string
  target: string
  entry: ActivityEntry | undefined
}) {
  const completed = record?.completed === true
  const logged = record !== undefined

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 bg-elevated/30 p-3">
      <span aria-hidden className="text-lg">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-heading">{label}</p>
        <p className="text-xs text-muted">
          {PILLARS[id as keyof typeof PILLARS]} · target {target}
          {record?.timeSpent ? ` · ${formatDuration(record.timeSpent)} logged` : ''}
        </p>
      </div>
      {record?.grade ? (
        <span className="num rounded-md bg-elevated px-2 py-1 text-xs font-semibold text-body">
          {record.grade}
        </span>
      ) : null}
      {completed ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Complete" />
      ) : logged ? (
        <XCircle className="h-5 w-5 shrink-0 text-danger" aria-label="Not done" />
      ) : (
        <CircleDashed className="h-5 w-5 shrink-0 text-muted" aria-label="Not logged" />
      )}
    </li>
  )
}

export function Dashboard() {
  const { selectedRun, logs, stats, today, timezone, loadingRun, archiveRun } = useApp()
  const navigate = useNavigate()

  if (loadingRun) {
    return <p className="py-16 text-center text-sm text-muted">Loading your challenge…</p>
  }

  if (!selectedRun) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center">
        <h1 className="text-lg font-semibold text-heading">No challenge yet</h1>
        <p className="mt-2 text-sm text-body">
          Start a two-week run to begin tracking your three non-negotiables.
        </p>
        <Button className="mt-5" onClick={() => navigate('/runs/new')}>
          <Plus className="h-4 w-4" aria-hidden />
          Start a challenge
        </Button>
      </Card>
    )
  }

  const activities = selectedRun.activities ?? DEFAULT_ACTIVITIES
  const todayLog = logs[today]
  const isRunDay = isChallengeDay(today) && today >= selectedRun.startDate && today <= selectedRun.endDate
  const todayLogged = Boolean(todayLog)
  const finished = today > selectedRun.endDate
  const isEvening = hourInZone(timezone) >= 17
  const yesterday = addDays(today, -1)
  const yesterdayStatus = dayStatus(yesterday, logs[yesterday], today)

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="stat-label">{selectedRun.name}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-heading sm:text-2xl">
            {formatLong(today)}
          </h1>
        </div>
        {selectedRun.status === 'active' && isRunDay ? (
          <Button
            size="lg"
            variant={todayLogged ? 'outline' : isEvening ? 'success' : 'primary'}
            onClick={() => navigate('/log')}
          >
            {todayLogged ? 'Edit today’s log' : 'Log today'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </header>

      {finished && selectedRun.status === 'active' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel flex flex-wrap items-center justify-between gap-3 border-success/40 bg-success/10 p-4"
        >
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 text-success" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-heading">Challenge complete</p>
              <p className="text-xs text-body">
                {stats?.perfectDays ?? 0} of {stats?.totalDays ?? 0} perfect days ·{' '}
                {stats?.completionPercent ?? 0}% completion
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
              Review analytics
            </Button>
            <Button size="sm" onClick={() => void archiveRun(selectedRun.id)}>
              Archive run
            </Button>
          </div>
        </motion.div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <StreakCounter
          streak={stats?.currentStreak ?? 0}
          longest={stats?.longestStreak ?? 0}
          atRisk={isRunDay && !todayLogged}
        />

        <Card delay={0.05}>
          <CardHeader
            title="Today"
            subtitle={isRunDay ? 'All three required for the streak' : 'Rest day — nothing required'}
          />
          <ul className="space-y-2">
            {ACTIVITY_IDS.map((id) => (
              <TodayActivityRow
                key={id}
                id={id}
                label={activities[id]?.label ?? DEFAULT_ACTIVITIES[id].label}
                icon={activities[id]?.icon ?? DEFAULT_ACTIVITIES[id].icon}
                target={activities[id]?.target ?? DEFAULT_ACTIVITIES[id].target}
                entry={todayLog?.[id]}
              />
            ))}
          </ul>
          <p className="mt-4 border-t border-border/70 pt-3 text-xs text-muted">
            Yesterday ({yesterday.slice(5)}):{' '}
            <span
              className={cn(
                'font-medium',
                yesterdayStatus === 'complete' && 'text-success',
                yesterdayStatus === 'partial' && 'text-warn',
                yesterdayStatus === 'missed' && 'text-danger',
              )}
            >
              {yesterdayStatus === 'complete'
                ? 'all three complete'
                : yesterdayStatus === 'partial'
                  ? 'partially complete'
                  : yesterdayStatus === 'missed'
                    ? 'missed'
                    : 'rest day'}
            </span>
          </p>
        </Card>
      </div>

      <Card delay={0.1}>
        <CardHeader
          title="Challenge calendar"
          subtitle={`${selectedRun.startDate} → ${selectedRun.endDate} · weekdays only`}
          action={
            <Link to="/analytics" className="text-xs text-accent transition-opacity hover:opacity-80">
              Analytics →
            </Link>
          }
        />
        <CalendarGrid
          startDate={selectedRun.startDate}
          endDate={selectedRun.endDate}
          logs={logs}
          today={today}
        />
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Completion', value: `${stats?.completionPercent ?? 0}%` },
          { label: 'Perfect days', value: `${stats?.perfectDays ?? 0}/${stats?.elapsedDays ?? 0}` },
          {
            label: 'Avg mood',
            value: stats?.averageMood === null || stats?.averageMood === undefined ? '—' : stats.averageMood.toFixed(1),
          },
        ].map((stat, index) => (
          <Card key={stat.label} delay={0.15 + index * 0.05} className="p-4">
            <p className="stat-label">{stat.label}</p>
            <p className="num mt-1.5 text-2xl font-semibold text-heading">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
