import { cn } from '../../lib/utils'

export interface TabItem<T extends string = string> {
  value: T
  label: string
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Tabs<T extends string = string>({
  tabs,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-muted p-1',
        className,
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            'px-3 h-7 rounded-md text-sm font-medium transition-colors',
            value === t.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
