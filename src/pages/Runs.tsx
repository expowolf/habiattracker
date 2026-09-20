import { Archive, Check, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { formatCompact } from '@/lib/dates'

export function Runs() {
  const { runs, selectedRun, selectRun, archiveRun, today } = useApp()
  const navigate = useNavigate()

  const hasActive = runs.some((run) => run.status === 'active')

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stat-label">Challenges</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-heading sm:text-2xl">Runs</h1>
        </div>
        <Button onClick={() => navigate('/runs/new')}>
          <Plus className="h-4 w-4" aria-hidden />
          New challenge
        </Button>
      </header>

      {hasActive ? null : (
        <p className="panel border-accent/30 bg-accent/10 p-3 text-xs text-accent">
          No active challenge. Start a new two-week run to resume tracking.
        </p>
      )}

      {runs.length === 0 ? (
        <Card>
          <p className="text-sm text-body">You have not created any challenges yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run, index) => {
            const isSelected = selectedRun?.id === run.id
            const finished = today > run.endDate
            return (
              <Card key={run.id} delay={index * 0.05} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-heading">{run.name}</h2>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          run.status === 'active'
                            ? 'bg-success/15 text-success'
                            : 'bg-elevated text-muted'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatCompact(run.startDate)} – {formatCompact(run.endDate)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isSelected ? 'ghost' : 'outline'}
                      onClick={() => {
                        selectRun(run.id)
                        navigate('/')
                      }}
                      disabled={isSelected}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Viewing
                        </>
                      ) : (
                        'View'
                      )}
                    </Button>
                    {run.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void archiveRun(run.id)}
                        title={finished ? 'Archive this finished run' : 'Archive early'}
                      >
                        <Archive className="h-3.5 w-3.5" aria-hidden />
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card delay={0.2}>
        <CardHeader title="How archiving works" />
        <ul className="space-y-1.5 text-xs text-body">
          <li>• Archiving locks a run: its logs become read-only.</li>
          <li>• Only one run is active at a time; start a new one after archiving.</li>
          <li>• Archived runs stay available here for comparison.</li>
        </ul>
      </Card>
    </div>
  )
}
