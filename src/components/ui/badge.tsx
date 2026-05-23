import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        outline: 'text-foreground border',
        success:
          'bg-[oklch(0.95_0.05_145)] text-[oklch(0.42_0.13_145)] border-[oklch(0.85_0.08_145)]',
        warning:
          'bg-[oklch(0.96_0.07_80)] text-[oklch(0.45_0.13_70)] border-[oklch(0.85_0.1_80)]',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        muted: 'bg-muted text-muted-foreground border-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
