import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string | number> {
  value: T
  label: string
  hint?: string
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  tone = 'accent',
}: {
  options: SegmentOption<T>[]
  value: T | null
  onChange: (value: T) => void
  ariaLabel: string
  tone?: 'accent' | 'success'
}) {
  const groupId = useId()
  const activeClasses = tone === 'success' ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full gap-1 rounded-lg border border-border bg-elevated/40 p-1"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.hint ?? option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex-1 rounded-md px-1 py-2 text-sm font-semibold transition-colors duration-200 min-h-[40px]',
              selected ? 'text-heading' : 'text-muted hover:text-body',
            )}
          >
            {selected ? (
              <motion.span
                layoutId={`segment-${groupId}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={cn('absolute inset-0 rounded-md', activeClasses)}
              />
            ) : null}
            <span className="relative num">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
