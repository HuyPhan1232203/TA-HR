import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  width?: number
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 560,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')}>
      <div
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute right-0 top-0 h-full bg-background border-l shadow-2xl transition-transform duration-200 flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width }}
      >
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Đóng"
            className="rounded-md p-1.5 hover:bg-accent"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">{children}</div>
        {footer && (
          <div className="p-4 border-t bg-muted/30 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
