import { motion } from 'framer-motion'
import { AlertTriangle, Award, TrendingUp } from 'lucide-react'
import { TrendChart } from '@/components/charts/TrendChart'
import { Card, CardHeader } from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { DEFAULT_ACTIVITIES } from '@/lib/activities'
import { formatCompact } from '@/lib/dates'
import { gradeFromPoints } from '@/lib/stats'
import { ACTIVITY_IDS } from '@/types'

function StatTile({
  label,
  value,
  detail,
  delay,
}: {
  label: string
  value: string
  detail?: string
  delay: number
}) {
  return (
    <Card delay={delay} className="p-4">
      <p className="stat-label">{label}</p>
      <p className="num mt-1.5 text-2xl font-semibold text-heading">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </Card>
  )
}

export function Analytics() {
  const { selectedRun, stats } = useApp()

  if (!selectedRun || !stats) {
    return <p className="py-16 text-center text-sm text-muted">No challenge data to analyze yet.</p>
  }

  const activities = selectedRun.activities ?? DEFAULT_ACTIVITIES
  const hardest = stats.hardestActivity

  return (
    <div className="space-y-5">
      <header>
        <p className="stat-label">{selectedRun.name}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-heading sm:text-2xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted">
          {stats.elapsedDays} of {stats.totalDays} challenge days elapsed
        </p>
      </header>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Completion"
          value={`${stats.completionPercent}%`}
          detail={`${stats.loggedDays} days logged`}
          delay={0}
        />
        <StatTile
          label="Perfect days"
          value={`${stats.perfectDays}/${stats.elapsedDays}`}
          detail="All three complete"
          delay={0.05}
        />
        <StatTile
          label="Avg quality"
          value={stats.averageQuality === null ? '—' : gradeFromPoints(stats.averageQuality)}
          detail={stats.averageQuality === null ? undefined : `${stats.averageQuality.toFixed(2)} / 5.00`}
          delay={0.1}
        />
        <StatTile
          label="Avg mood"
          value={stats.averageMood === null ? '—' : stats.averageMood.toFixed(1)}
          detail="1–5 scale"
          delay={0.15}
        />
      </div>

      <Card delay={0.18}>
        <CardHeader title="Per-activity completion" subtitle="Share of elapsed weekdays completed" />
        <ul className="space-y-4">
          {ACTIVITY_IDS.map((id) => {
            const config = activities[id] ?? DEFAULT_ACTIVITIES[id]
            const record = stats.perActivity[id]
            const isHardest = hardest === id && record.percent < 100
            return (
              <li key={id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-body">
                    <span aria-hidden>{config.icon}</span>
                    {config.label}
                    {isHardest ? (
                      <span className="flex items-center gap-1 rounded-md bg-warn/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        Bottleneck
                      </span>
                    ) : null}
                  </span>
                  <span className="num text-heading">
                    {record.percent}%{' '}
                    <span className="text-muted">
                      ({record.completed}/{record.possible})
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${record.percent}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={isHardest ? 'h-full bg-warn' : 'h-full bg-accent'}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card delay={0.2}>
          <CardHeader title="Quality trend" subtitle="Daily average grade (F=1 → A=5)" />
          <TrendChart
            data={stats.qualityTrend}
            color="#38bdf8"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            formatTick={(value) => gradeFromPoints(value)}
            valueLabel="Avg grade"
            formatValue={(value) => `${gradeFromPoints(value)} (${value.toFixed(2)})`}
          />
        </Card>

        <Card delay={0.25}>
          <CardHeader title="Mood trajectory" subtitle="Daily average mood (1–5)" />
          <TrendChart
            data={stats.moodTrend}
            color="#10b981"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            formatTick={(value) => String(value)}
            valueLabel="Avg mood"
            formatValue={(value) => value.toFixed(2)}
          />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card delay={0.3}>
          <CardHeader title="Patterns" subtitle="Where you are strongest and weakest" />
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-elevated/30 p-3">
              <Award className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              <div>
                <p className="text-sm font-medium text-heading">Best day</p>
                <p className="text-xs text-muted">
                  {stats.bestDay
                    ? `${stats.bestDay.weekday}s: ${stats.bestDay.completed}/${stats.bestDay.possible} days perfect`
                    : 'Not enough data yet.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-elevated/30 p-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
              <div>
                <p className="text-sm font-medium text-heading">Hardest activity</p>
                <p className="text-xs text-muted">
                  {hardest
                    ? `${activities[hardest]?.label ?? DEFAULT_ACTIVITIES[hardest].label} at ${stats.perActivity[hardest].percent}% completion`
                    : 'Not enough data yet.'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card delay={0.35}>
          <CardHeader title="Weekly summary" subtitle="Completion per week of the challenge" />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="stat-label pb-2 font-medium">Week</th>
                <th className="stat-label pb-2 font-medium">Dates</th>
                <th className="stat-label pb-2 text-right font-medium">Perfect</th>
                <th className="stat-label pb-2 text-right font-medium">Complete</th>
              </tr>
            </thead>
            <tbody>
              {stats.weeks.map((week) => (
                <tr key={week.index} className="border-t border-border/60">
                  <td className="py-2.5 text-body">{week.label}</td>
                  <td className="py-2.5 text-xs text-muted">
                    {formatCompact(week.start)} – {formatCompact(week.end)}
                  </td>
                  <td className="num py-2.5 text-right text-heading">
                    {week.perfectDays}/{week.totalDays}
                  </td>
                  <td className="num py-2.5 text-right text-heading">{week.completionPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
