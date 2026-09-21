import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Check, GraduationCap, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import type { StudyTopic } from '@/types'

function TopicRow({
  topic,
  position,
  isNext,
  canMoveUp,
  canMoveDown,
  onMove,
  onToggle,
  onDelete,
}: {
  topic: StudyTopic
  position: number
  isNext: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onMove: (direction: -1 | 1) => void
  onToggle: () => void
  onDelete: () => void
}) {
  const done = topic.status === 'done'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        isNext ? 'border-accent/50 bg-accent/10' : 'border-border/60 bg-elevated/30',
      )}
    >
      <span
        className={cn(
          'num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
          done ? 'bg-elevated text-muted' : isNext ? 'bg-accent/20 text-accent' : 'bg-elevated text-body',
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : position}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            done ? 'text-muted line-through' : 'text-heading',
          )}
        >
          {topic.title}
        </p>
        {topic.notes ? <p className="mt-0.5 text-xs text-muted">{topic.notes}</p> : null}
        {isNext ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-accent">Next up</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {!done ? (
          <>
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={!canMoveUp}
              aria-label={`Move ${topic.title} up`}
              className="rounded-md p-1.5 text-muted transition-colors hover:text-heading disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={!canMoveDown}
              aria-label={`Move ${topic.title} down`}
              className="rounded-md p-1.5 text-muted transition-colors hover:text-heading disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          aria-label={done ? `Reopen ${topic.title}` : `Mark ${topic.title} covered`}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            done ? 'text-muted hover:text-accent' : 'text-muted hover:text-success',
          )}
        >
          {done ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${topic.title}`}
          className="rounded-md p-1.5 text-muted transition-colors hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </motion.li>
  )
}

export function StudyPlan() {
  const { studyTopics, nextTopic, saveStudyTopic, deleteStudyTopic, selectedRun } = useApp()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  const todo = useMemo(() => studyTopics.filter((t) => t.status === 'todo'), [studyTopics])
  const done = useMemo(() => studyTopics.filter((t) => t.status === 'done'), [studyTopics])

  async function addTopic(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const highest = studyTopics.reduce((max, t) => Math.max(max, t.order), 0)
    await saveStudyTopic({
      id: `topic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimmed,
      notes: notes.trim(),
      status: 'todo',
      order: highest + 1,
      createdAt: Date.now(),
      completedAt: null,
      completedInRunId: null,
    })
    setTitle('')
    setNotes('')
  }

  async function move(topic: StudyTopic, direction: -1 | 1) {
    const index = todo.findIndex((t) => t.id === topic.id)
    const swapWith = todo[index + direction]
    if (!swapWith) return
    await saveStudyTopic({ ...topic, order: swapWith.order })
    await saveStudyTopic({ ...swapWith, order: topic.order })
  }

  async function toggle(topic: StudyTopic) {
    const done = topic.status === 'todo'
    await saveStudyTopic({
      ...topic,
      status: done ? 'done' : 'todo',
      completedAt: done ? Date.now() : null,
      completedInRunId: done ? (selectedRun?.id ?? null) : null,
    })
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="stat-label">Trading</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-heading sm:text-2xl">
          Study plan
        </h1>
        <p className="mt-1 text-sm text-muted">
          {todo.length} queued · {done.length} covered · the backlog carries across challenges
        </p>
      </header>

      <Card>
        <CardHeader title="Add a topic" subtitle="Newest goes to the bottom of the queue" />
        <form onSubmit={addTopic} className="space-y-3">
          <Field label="Topic" htmlFor="topic-title">
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Liquidity sweeps at session open"
              maxLength={120}
            />
          </Field>
          <Field label="Notes" htmlFor="topic-notes" hint="Optional — source, chapter, what to focus on">
            <Textarea
              id="topic-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chapter 4, plus replay two NY opens"
            />
          </Field>
          <Button type="submit" disabled={!title.trim()}>
            <Plus className="h-4 w-4" aria-hidden />
            Add to backlog
          </Button>
        </form>
      </Card>

      <Card delay={0.05}>
        <CardHeader title="Queue" subtitle="Worked top to bottom" />
        {todo.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <GraduationCap className="h-6 w-6 text-muted" aria-hidden />
            <p className="text-sm text-body">Nothing queued.</p>
            <p className="text-xs text-muted">
              Add a few topics so the morning check-in has a concrete answer.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {todo.map((topic, index) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  position={index + 1}
                  isNext={nextTopic?.id === topic.id}
                  canMoveUp={index > 0}
                  canMoveDown={index < todo.length - 1}
                  onMove={(direction) => void move(topic, direction)}
                  onToggle={() => void toggle(topic)}
                  onDelete={() => void deleteStudyTopic(topic.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>

      {done.length > 0 ? (
        <Card delay={0.1}>
          <CardHeader title="Covered" subtitle={`${done.length} topics completed`} />
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {done.map((topic, index) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  position={index + 1}
                  isNext={false}
                  canMoveUp={false}
                  canMoveDown={false}
                  onMove={() => {}}
                  onToggle={() => void toggle(topic)}
                  onDelete={() => void deleteStudyTopic(topic.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
