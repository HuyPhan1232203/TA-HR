import { cn } from '../../lib/utils'

export interface AvatarProps {
  name: string
  size?: number
  className?: string
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase()
}

function hueOf(name: string): number {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (sum * 47) % 360
}

export function Avatar({ name, size = 32, className }: AvatarProps) {
  const initials = initialsOf(name) || '?'
  const hue = hueOf(name)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium text-[12px] shrink-0',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `oklch(0.94 0.05 ${hue})`,
        color: `oklch(0.4 0.12 ${hue})`,
      }}
    >
      {initials}
    </span>
  )
}
