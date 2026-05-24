import { Facehash } from 'facehash'
import { cn } from '../../lib/utils'

export interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 32, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Facehash
        name={name}
        size={size}
        // intensity3d="subtle"
        // showInitial={false}
        enableBlink
      />
    </span>
  )
}
