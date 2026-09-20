import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { useApp } from '@/context/AppContext'
import { DEFAULT_ACTIVITIES, PILLARS } from '@/lib/activities'
import { challengeDays, defaultRunName, defaultRunWindow } from '@/lib/dates'
import { ACTIVITY_IDS, type ActivityMap, type ActivityConfig } from '@/types'

export function NewRun() {
  const { createRun, activeRun, timezone, archiveRun } = useApp()
  const navigate = useNavigate()
  const window = defaultRunWindow(timezone)

  const [startDate, setStartDate] = useState(window.startDate)
  const [endDate, setEndDate] = useState(window.endDate)
  const [name, setName] = useState(defaultRunName(window.startDate, window.endDate))
  const [activities, setActivities] = useState<ActivityMap<ActivityConfig>>({
    ...DEFAULT_ACTIVITIES,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const weekdayCount = endDate >= startDate ? challengeDays(startDate, endDate).length : 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (endDate < startDate) {
      setError('The end date must be on or after the start date.')
      return
    }
    setBusy(true)
    setError('')
    try {
      if (activeRun) await archiveRun(activeRun.id)
      await createRun({ name: name.trim() || defaultRunName(startDate, endDate), startDate, endDate, activities })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the challenge.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <header>
        <p className="stat-label">Setup</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-heading sm:text-2xl">
          New challenge
        </h1>
        <p className="mt-1 text-sm text-muted">
          {weekdayCount} weekdays in this window · weekends are rest days
        </p>
      </header>

      {activeRun ? (
        <p className="panel border-warn/30 bg-warn/10 p-3 text-xs text-warn">
          Starting a new challenge archives your current run “{activeRun.name}”.
        </p>
      ) : null}

      <Card>
        <CardHeader title="Window" subtitle="Two weeks is the default" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="start">
            <Input
              id="start"
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setName(defaultRunName(e.target.value, endDate))
              }}
            />
          </Field>
          <Field label="End date" htmlFor="end">
            <Input
              id="end"
              type="date"
              required
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setName(defaultRunName(startDate, e.target.value))
              }}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Challenge name" htmlFor="name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card delay={0.05}>
        <CardHeader title="Non-negotiables" subtitle="Adjust labels and targets for this run" />
        <div className="space-y-4">
          {ACTIVITY_IDS.map((id) => (
            <div key={id} className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
              <Field label={`${PILLARS[id]} — name`} htmlFor={`${id}-label`}>
                <Input
                  id={`${id}-label`}
                  value={activities[id].label}
                  onChange={(e) =>
                    setActivities((prev) => ({
                      ...prev,
                      [id]: { ...prev[id], label: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Target" htmlFor={`${id}-target`}>
                <Input
                  id={`${id}-target`}
                  value={activities[id].target}
                  onChange={(e) =>
                    setActivities((prev) => ({
                      ...prev,
                      [id]: { ...prev[id], target: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Minutes" htmlFor={`${id}-minutes`} hint="blank = session based">
                <Input
                  id={`${id}-minutes`}
                  type="number"
                  min={0}
                  value={activities[id].targetMinutes ?? ''}
                  onChange={(e) =>
                    setActivities((prev) => ({
                      ...prev,
                      [id]: {
                        ...prev[id],
                        targetMinutes: e.target.value === '' ? null : Number(e.target.value),
                      },
                    }))
                  }
                />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? 'Creating…' : 'Start challenge'}
        </Button>
        <Button type="button" size="lg" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
