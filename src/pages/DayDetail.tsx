import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { DEFAULT_ACTIVITIES, PILLARS } from '@/lib/activities'
import { formatLong } from '@/lib/dates'
import { formatDuration } from '@/lib/utils'
import { ACTIVITY_IDS } from '@/types'

export function DayDetail() {
  const { date = '' } = useParams()
  const { selectedRun, logs, today } = useApp()
  const navigate = useNavigate()

  const log = logs[date]
  const activities = selectedRun?.activities ?? DEFAULT_ACTIVITIES
  const editable = selectedRun?.status === 'active' && date <= today

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Button>
          <div>
            <p className="stat-label">Day detail</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-heading">
              {date ? formatLong(date) : 'Unknown day'}
            </h1>
          </div>
        </div>
        {editable ? (
          <Button onClick={() => navigate(`/log?date=${date}`)}>
            {log ? 'Edit entry' : 'Log this day'}
          </Button>
        ) : (
          <span className="rounded-md border border-border bg-elevated/40 px-2.5 py-1 text-xs text-muted">
            {selectedRun?.status === 'archived' ? 'Archived — read only' : 'Future day'}
          </span>
        )}
      </header>

      {!log ? (
        <Card>
          <p className="text-sm text-body">No entry recorded for this day.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {ACTIVITY_IDS.map((id, index) => {
            const config = activities[id] ?? DEFAULT_ACTIVITIES[id]
            const entry = log[id]
            return (
              <Card key={id} delay={index * 0.05}>
                <div className="flex items-start gap-3">
                  <span aria-hidden className="text-xl">
                    {config.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-heading">{config.label}</h2>
                      {entry?.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-success" aria-label="Complete" />
                      ) : (
                        <XCircle className="h-4 w-4 text-danger" aria-label="Not complete" />
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {PILLARS[id]} · target {config.target}
                    </p>

                    <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt className="stat-label">Grade</dt>
                        <dd className="num mt-0.5 font-semibold text-heading">
                          {entry?.grade ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="stat-label">Mood</dt>
                        <dd className="num mt-0.5 font-semibold text-heading">
                          {entry?.mood ? `${entry.mood}/5` : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="stat-label">Time</dt>
                        <dd className="num mt-0.5 font-semibold text-heading">
                          {formatDuration(entry?.timeSpent)}
                        </dd>
                      </div>
                    </dl>

                    {entry?.notes ? (
                      <p className="mt-3 rounded-lg border border-border/60 bg-elevated/30 p-3 text-sm text-body">
                        {entry.notes}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}

          <Card delay={0.2} className="flex items-center justify-between">
            <div>
              <p className="stat-label">Streak after this day</p>
              <p className="num mt-1 text-2xl font-semibold text-heading">{log.dailyStreak}</p>
            </div>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                log.allComplete ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
              }`}
            >
              {log.allComplete ? 'All three complete' : 'Incomplete day'}
            </span>
          </Card>
        </div>
      )}
    </div>
  )
}
