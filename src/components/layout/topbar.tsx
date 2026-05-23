import { Bell, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between gap-4 px-6">
      <div className="min-w-0">
        <h1 className="text-[15px] font-semibold tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="w-[260px] pl-8 h-9" placeholder="Tìm kiếm nhanh…" />
        </div>
        <Button variant="ghost" size="icon" className="relative" aria-label="Thông báo">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>
      </div>
    </header>
  )
}
