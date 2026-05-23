import { CalendarIcon } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  className,
}: DatePickerProps) {
  const selected =
    value && isValid(parse(value, 'yyyy-MM-dd', new Date()))
      ? parse(value, 'yyyy-MM-dd', new Date())
      : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={vi}
          selected={selected}
          onSelect={(d) => {
            if (d) onChange(format(d, 'yyyy-MM-dd'))
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
