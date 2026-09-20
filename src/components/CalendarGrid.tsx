import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { challengeDays, dayIndex, formatCompact, WEEKDAY_NAMES } from '@/lib/dates'
import { dayStatus, type DayStatus } from '@/lib/stats'
import { cn } from '@/lib/utils'
import { ACTIVITY_IDS, type DayLog } from '@/types'

const STATUS_STYLES: Record<DayStatus, string> = {
  complete: 'border-success/50 bg-success/15 text-success',
  partial: 'border-warn/50 bg-warn/12 text-warn',
  missed: 'border-danger/45 bg-danger/10 text-danger',
  pending: 'border-border bg-elevated/40 text-muted',
  rest: 'border-transparent bg-transparent text-muted',
}

const STATUS_LABEL: Record<DayStatus, string> = {
  complete: 'All three complete',
  partial: 'Partially complete',
  missed: 'Missed',
  pending: 'Not logged yet',
  rest: 'Rest day',
}

export function CalendarGrid({
  startDate,
  endDate,
  logs,
  today,
}: {
  startDate: string
  endDate: string
  logs: Record<string, DayLog>
  today: string
}) {
  const navigate = useNavigate()
  const days = challengeDays(startDate, endDate)

  return (
    <div>
      <div className="mb-2 grid grid-cols-5 gap-2">
        {WEEKDAY_NAMES.slice(1, 6).map((name) => (
          <p key={name} className="stat-label text-center">
            {name.slice(0, 3)}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {days.map((date, index) => {
          const status = dayStatus(date, logs[date], today)
          const log = logs[date]
          const done = log ? ACTIVITY_IDS.filter((id) => log[id]?.completed).length : 0
          const isToday = date === today
          // Keep each date under its own weekday column.
          const columnStart = index === 0 ? dayIndex(date) : undefined

          return (
            <motion.button
              key={date}
              type="button"
              onClick={() => navigate(`/day/${date}`)}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.02, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              style={columnStart ? { gridColumnStart: columnStart } : undefined}
              aria-label={`${formatCompact(date)}: ${STATUS_LABEL[status]}, ${done} of 3 complete`}
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-1 rounded-lg border transition-colors sm:h-20',
                STATUS_STYLES[status],
                isToday && 'ring-1 ring-accent/70 ring-offset-2 ring-offset-bg',
              )}
            >
              <span className="num text-xs font-semibold">{date.slice(8)}</span>
              <span className="num text-[10px] opacity-80">{done}/3</span>
            </motion.button>
          )
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted">
        {(['complete', 'partial', 'missed', 'pending'] as DayStatus[]).map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm border', STATUS_STYLES[status])} aria-hidden />
            {STATUS_LABEL[status]}
          </li>
        ))}
      </ul>
    </div>
  )
}
