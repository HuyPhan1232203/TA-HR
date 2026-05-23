import type { LucideIcon } from 'lucide-react'
import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyProps {
  icon?: LucideIcon
  title?: string
  desc?: string
  action?: ReactNode
}

export function Empty({
  icon: IconCmp = Search,
  title = 'Không có dữ liệu',
  desc,
  action,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid place-items-center size-14 rounded-full bg-muted text-muted-foreground mb-4">
        <IconCmp className="size-6" />
      </div>
      <div className="font-medium">{title}</div>
      {desc && (
        <div className="text-sm text-muted-foreground mt-1 max-w-xs">{desc}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
