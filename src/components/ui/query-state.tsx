import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface QueryStateProps {
  isLoading: boolean
  error: Error | null
  children: ReactNode
}

export function QueryState({ isLoading, error, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" /> Đang tải dữ liệu…
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="size-8 text-destructive mb-3" />
        <div className="font-medium">Lỗi tải dữ liệu</div>
        <div className="text-sm text-muted-foreground mt-1">{error.message}</div>
      </div>
    )
  }
  return <>{children}</>
}
