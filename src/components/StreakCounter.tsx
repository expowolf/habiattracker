import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useEffect } from 'react'

export function StreakCounter({
  streak,
  longest,
  atRisk,
}: {
  streak: number
  longest: number
  atRisk: boolean
}) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (value) => Math.round(value).toString())

  useEffect(() => {
    const controls = animate(count, streak, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [count, streak])

  const live = streak > 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="panel relative overflow-hidden p-6 sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="stat-label">Current streak</p>
          <div className="mt-2 flex items-end gap-3">
            <motion.span className="num text-6xl font-bold leading-none text-heading sm:text-7xl">
              {rounded}
            </motion.span>
            <span className="pb-1.5 text-sm text-muted">{streak === 1 ? 'day' : 'days'}</span>
          </div>
          <p className="mt-3 text-sm text-body">
            {live
              ? 'All three non-negotiables, every weekday. Keep it intact.'
              : 'Complete all three today to start the streak.'}
          </p>
        </div>

        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          {live ? (
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse-ring rounded-full border border-accent/40"
            />
          ) : null}
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              live ? 'bg-accent/15 text-accent' : 'bg-elevated text-muted'
            }`}
          >
            <Flame className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 gap-3 border-t border-border/70 pt-4 text-sm">
        <div>
          <dt className="stat-label">Longest streak</dt>
          <dd className="num mt-1 text-lg font-semibold text-heading">{longest}</dd>
        </div>
        <div>
          <dt className="stat-label">Status</dt>
          <dd className={`mt-1 text-sm font-semibold ${atRisk ? 'text-warn' : 'text-success'}`}>
            {atRisk ? 'Unlogged today' : 'On track'}
          </dd>
        </div>
      </dl>
    </motion.section>
  )
}
