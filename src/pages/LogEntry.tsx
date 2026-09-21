import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useApp } from '@/context/AppContext'
import { DEFAULT_ACTIVITIES, EMPTY_ENTRY, PILLARS } from '@/lib/activities'
import { challengeDays, formatLong, isChallengeDay } from '@/lib/dates'
import { computeStreaks } from '@/lib/stats'
import { cn } from '@/lib/utils'
import { ACTIVITY_IDS, GRADES, type ActivityEntry, type ActivityId, type DayLog, type Grade, type Mood } from '@/types'

const GRADE_OPTIONS = GRADES.map((grade) => ({ value: grade, label: grade }))
const MOOD_OPTIONS = ([1, 2, 3, 4, 5] as Mood[]).map((mood) => ({
  value: mood,
  label: String(mood),
  hint: `Mood ${mood} of 5`,
}))

function blankDraft(): Record<ActivityId, ActivityEntry> {
  return {
    trading_study: { ...EMPTY_ENTRY },
    meditation: { ...EMPTY_ENTRY },
    hunting: { ...EMPTY_ENTRY },
  }
}

export function LogEntry() {
  const { selectedRun, logs, today, saveLog, studyTopics, nextTopic, saveStudyTopic } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const date = params.get('date') ?? today

  const existing = logs[date]
  const [draft, setDraft] = useState<Record<ActivityId, ActivityEntry>>(() => {
    if (!existing) return blankDraft()
    return {
      trading_study: { ...EMPTY_ENTRY, ...existing.trading_study },
      meditation: { ...EMPTY_ENTRY, ...existing.meditation },
      hunting: { ...EMPTY_ENTRY, ...existing.hunting },
    }
  })
  const [studyTopicId, setStudyTopicId] = useState<string>(() => existing?.studyTopicId ?? '')
  const [topicTouched, setTopicTouched] = useState(false)
  const [markTopicCovered, setMarkTopicCovered] = useState(false)

  // The backlog loads a tick after this form mounts, so seed the picker with the
  // next topic once it arrives — unless the day already has one or the user chose.
  useEffect(() => {
    if (topicTouched || studyTopicId || existing?.studyTopicId) return
    if (nextTopic) setStudyTopicId(nextTopic.id)
  }, [nextTopic, topicTouched, studyTopicId, existing])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Topics already covered stay selectable only if this day is the one that covered them.
  const topicOptions = useMemo(
    () => studyTopics.filter((t) => t.status === 'todo' || t.id === existing?.studyTopicId),
    [studyTopics, existing],
  )

  const activities = selectedRun?.activities ?? DEFAULT_ACTIVITIES
  const completedCount = ACTIVITY_IDS.filter((id) => draft[id].completed).length

  const projectedStreak = useMemo(() => {
    if (!selectedRun) return 0
    const merged: Record<string, DayLog> = {
      ...logs,
      [date]: {
        date,
        ...draft,
        studyTopicId: studyTopicId || null,
        allComplete: completedCount === ACTIVITY_IDS.length,
        dailyStreak: 0,
        loggedAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
    return computeStreaks(challengeDays(selectedRun.startDate, selectedRun.endDate), merged, today)
      .current
  }, [selectedRun, logs, date, draft, completedCount, today])

  function update(id: ActivityId, patch: Partial<ActivityEntry>) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedRun) return
    setBusy(true)
    setError('')
    try {
      const log: DayLog = {
        date,
        ...draft,
        studyTopicId: studyTopicId || null,
        allComplete: completedCount === ACTIVITY_IDS.length,
        dailyStreak: projectedStreak,
        loggedAt: existing?.loggedAt ?? Date.now(),
        updatedAt: Date.now(),
      }
      await saveLog(log)

      const covered = studyTopics.find((t) => t.id === studyTopicId)
      if (markTopicCovered && covered && covered.status === 'todo') {
        await saveStudyTopic({
          ...covered,
          status: 'done',
          completedAt: Date.now(),
          completedInRunId: selectedRun.id,
        })
      }
      navigate(`/day/${date}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the log.')
      setBusy(false)
    }
  }

  if (!selectedRun) {
    return <p className="py-16 text-center text-sm text-muted">Start a challenge before logging.</p>
  }

  const outOfRange = date < selectedRun.startDate || date > selectedRun.endDate
  const restDay = !isChallengeDay(date)

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-4">
      <header>
        <p className="stat-label">Daily check-in</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-heading sm:text-2xl">
          {formatLong(date)}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {completedCount}/3 complete · streak after saving:{' '}
          <span className="num font-semibold text-accent">{projectedStreak}</span>
        </p>
      </header>

      {outOfRange || restDay ? (
        <p className="panel border-warn/30 bg-warn/10 p-3 text-xs text-warn">
          {outOfRange
            ? 'This date is outside the current challenge window.'
            : 'Weekends are rest days — logging is optional and does not affect the streak.'}
        </p>
      ) : null}

      {ACTIVITY_IDS.map((id, index) => {
        const config = activities[id] ?? DEFAULT_ACTIVITIES[id]
        const entry = draft[id]
        return (
          <Card key={id} delay={index * 0.06}>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden className="text-xl">
                {config.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-heading">{config.label}</h2>
                <p className="text-xs text-muted">
                  {PILLARS[id]} · target {config.target}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { done: true, label: 'Done', icon: Check },
                { done: false, label: 'Not done', icon: X },
              ].map(({ done, label, icon: Icon }) => {
                const active = entry.completed === done
                return (
                  <motion.button
                    key={label}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => update(id, { completed: done })}
                    aria-pressed={active}
                    className={cn(
                      'flex min-h-[52px] items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors',
                      active && done && 'border-success/60 bg-success/15 text-success',
                      active && !done && 'border-danger/60 bg-danger/15 text-danger',
                      !active && 'border-border bg-elevated/40 text-muted hover:text-body',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </motion.button>
                )
              })}
            </div>

            {id === 'trading_study' ? (
              <div className="mt-4 rounded-lg border border-border/60 bg-elevated/30 p-3">
                <Field label="Topic studied" htmlFor="study-topic">
                  {topicOptions.length === 0 ? (
                    <p className="text-xs text-muted">
                      No topics queued.{' '}
                      <Link to="/study" className="text-accent hover:opacity-80">
                        Build your study plan →
                      </Link>
                    </p>
                  ) : (
                    <Select
                      id="study-topic"
                      value={studyTopicId}
                      onChange={(e) => {
                        setTopicTouched(true)
                        setStudyTopicId(e.target.value)
                      }}
                    >
                      <option value="">— not tracked —</option>
                      {topicOptions.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.title}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                {studyTopicId ? (
                  <label className="mt-2.5 flex items-center gap-2 text-xs text-body">
                    <input
                      type="checkbox"
                      checked={markTopicCovered}
                      onChange={(e) => setMarkTopicCovered(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-elevated accent-sky-400"
                    />
                    Finished it — remove from the queue
                  </label>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Quality grade">
                <SegmentedControl
                  ariaLabel={`${config.label} grade`}
                  options={GRADE_OPTIONS}
                  value={entry.grade}
                  onChange={(grade) => update(id, { grade: grade as Grade })}
                />
              </Field>
              <Field label="Mood (1–5)">
                <SegmentedControl
                  ariaLabel={`${config.label} mood`}
                  tone="success"
                  options={MOOD_OPTIONS}
                  value={entry.mood}
                  onChange={(mood) => update(id, { mood: mood as Mood })}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              <Field label="Time (minutes)" htmlFor={`${id}-time`}>
                <Input
                  id={`${id}-time`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1440}
                  placeholder="optional"
                  value={entry.timeSpent ?? ''}
                  onChange={(e) =>
                    update(id, { timeSpent: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Notes" htmlFor={`${id}-notes`}>
                <Textarea
                  id={`${id}-notes`}
                  rows={2}
                  placeholder="What worked, what didn't…"
                  value={entry.notes}
                  onChange={(e) => update(id, { notes: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        )
      })}

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-20 z-10 flex gap-2 lg:bottom-4">
        <Button
          type="submit"
          size="lg"
          variant={completedCount === 3 ? 'success' : 'primary'}
          className="flex-1 shadow-xl"
          disabled={busy}
        >
          {busy ? 'Saving…' : existing ? 'Update log' : 'Submit log'}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
