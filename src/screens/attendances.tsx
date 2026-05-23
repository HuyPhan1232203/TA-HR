import { useState } from 'react'
import { Plus, Search, Upload } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Avatar } from '../components/ui/avatar'
import { Modal } from '../components/ui/modal'
import { Tabs } from '../components/ui/tabs'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import { toast } from 'sonner'
import { useAttendances } from '@/hooks/useAttendances'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import { cn } from '../lib/utils'

type ViewMode = 'grid' | 'list'

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-3 rounded-sm', color)} />
      {label}
    </span>
  )
}

export function AttendancesScreen() {
  const [month, setMonth] = useState('2026-05')
  const [view, setView] = useState<ViewMode>('grid')
  const [open, setOpen] = useState(false)
  const { data: rows = [], isLoading, error } = useAttendances(month)
  const { data: departments = [] } = useDepartments()
  const { data: employees = [] } = useEmployees()
  const days = 22

  return (
    <div>
      <PageHeader
        title="Chấm công"
        description="Nhập, theo dõi giờ công và OT theo ngày. /api/attendances"
        actions={
          <>
            <Button variant="outline">
              <Upload className="size-4" /> Import từ máy chấm công
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Nhập công
            </Button>
          </>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-[160px]"
          />
          <Select className="w-[200px]" defaultValue="PROD">
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.name}
              </option>
            ))}
          </Select>
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm nhân viên…" className="pl-8 w-[220px]" />
          </div>
          <div className="flex-1" />
          <Tabs<ViewMode>
            tabs={[
              { value: 'grid', label: 'Lưới' },
              { value: 'list', label: 'Danh sách' },
            ]}
            value={view}
            onChange={setView}
          />
        </div>

        <QueryState isLoading={isLoading} error={error}>
          <div className="p-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
              <Legend color="bg-primary" label="Đi làm 8h" />
              <Legend color="bg-[oklch(0.62_0.16_145)]" label="OT > 8h" />
              <Legend color="bg-[oklch(0.78_0.16_80)]" label="Nghỉ phép" />
              <Legend color="bg-muted" label="Nghỉ tuần" />
              <span className="ml-auto">
                Tổng nhân viên: {rows.length} · Ngày làm việc: {days}
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-background z-10 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-[200px] border-b">
                      Nhân viên
                    </th>
                    {Array.from({ length: days }, (_, i) => (
                      <th
                        key={i}
                        className="text-center text-[11px] text-muted-foreground font-medium px-1 py-2 border-b w-9"
                      >
                        {i + 1}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-xs text-right text-muted-foreground font-medium border-b w-[80px]">
                      Tổng giờ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const total = r.cells.reduce(
                      (s, c) => s + (c.hours ?? 0),
                      0,
                    )
                    return (
                      <tr key={r.employee.id} className="hover:bg-muted/30">
                        <td className="sticky left-0 bg-background z-10 px-3 py-2 border-b">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.employee.name} size={28} />
                            <div>
                              <div className="font-medium text-[13px]">
                                {r.employee.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {r.employee.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        {r.cells.map((c) => (
                          <td
                            key={c.d}
                            className="px-0.5 py-1.5 border-b text-center"
                          >
                            <div
                              title={
                                c.kind === 'work'
                                  ? '8h'
                                  : c.kind === 'ot'
                                    ? `OT ${c.hours}h`
                                    : c.kind === 'leave'
                                      ? 'Nghỉ phép'
                                      : 'Nghỉ tuần'
                              }
                              className={cn(
                                'mx-auto size-7 rounded-md grid place-items-center text-[10px] font-medium',
                                c.kind === 'work' && 'bg-primary/15 text-primary',
                                c.kind === 'ot' &&
                                  'bg-[oklch(0.92_0.08_145)] text-[oklch(0.42_0.13_145)]',
                                c.kind === 'leave' &&
                                  'bg-[oklch(0.95_0.07_80)] text-[oklch(0.45_0.12_70)]',
                                c.kind === 'off' &&
                                  'bg-muted text-muted-foreground',
                              )}
                            >
                              {c.kind === 'work'
                                ? '8'
                                : c.kind === 'ot'
                                  ? c.hours
                                  : c.kind === 'leave'
                                    ? 'P'
                                    : '—'}
                            </div>
                          </td>
                        ))}
                        <td className="px-3 py-2 border-b text-right num font-medium">
                          {total}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </QueryState>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nhập chấm công"
        description="Ghi nhận giờ vào / giờ ra cho 1 ngày làm việc"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                toast.success('Đã lưu chấm công')
                setOpen(false)
              }}
            >
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nhân viên *</Label>
            <Select>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Ngày *</Label>
              <Input type="date" defaultValue="2026-05-22" />
            </div>
            <div className="space-y-1.5">
              <Label>Giờ vào</Label>
              <Input type="time" defaultValue="08:00" />
            </div>
            <div className="space-y-1.5">
              <Label>Giờ ra</Label>
              <Input type="time" defaultValue="17:00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Giờ công</Label>
              <Input type="number" defaultValue="8" className="num" />
            </div>
            <div className="space-y-1.5">
              <Label>OT (giờ)</Label>
              <Input type="number" defaultValue="0" className="num" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea placeholder="Lý do chỉnh / ghi chú…" />
          </div>
          <div className="rounded-md bg-muted/40 border p-3 text-xs text-muted-foreground font-mono">
            POST /api/attendances
            <br />
            {'{ employeeId, date: "YYYY-MM-DD", checkIn: "...Z", checkOut: "...Z" }'}
          </div>
        </div>
      </Modal>
    </div>
  )
}
