import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ToastKind = 'success' | 'warn' | 'error'

export interface ToastInput {
  title: string
  desc?: string
  kind?: ToastKind
}

interface ToastItem extends ToastInput {
  id: string
}

type PushToast = (t: ToastInput) => void

const ToastCtx = createContext<PushToast | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback<PushToast>((t) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((ts) => [...ts, { id, ...t }])
    setTimeout(() => {
      setToasts((ts) => ts.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[340px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-lg border bg-background shadow-lg p-3 pop-in"
          >
            <div
              className={cn(
                'mt-0.5',
                t.kind === 'error'
                  ? 'text-destructive'
                  : t.kind === 'warn'
                    ? 'text-[oklch(0.65_0.16_70)]'
                    : 'text-[oklch(0.55_0.18_145)]',
              )}
            >
              {t.kind === 'error' || t.kind === 'warn' ? (
                <AlertTriangle className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{t.title}</div>
              {t.desc && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t.desc}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): PushToast {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
