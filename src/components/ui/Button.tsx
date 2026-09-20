import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-slate-950 shadow-[0_8px_24px_-12px_rgba(56,189,248,0.9)] hover:bg-sky-300',
        success:
          'bg-success text-slate-950 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.9)] hover:bg-emerald-400',
        outline: 'border border-border bg-elevated/40 text-heading hover:border-accent/60 hover:bg-elevated',
        ghost: 'text-body hover:bg-elevated/70 hover:text-heading',
        danger: 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
