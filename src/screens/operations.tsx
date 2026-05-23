import { useMemo } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardDesc,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { QueryState } from '../components/ui/query-state'
import {
  Table,
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
import { PageHeader } from '../components/layout/page-header'
import { useOperations } from '../api/resources'
import type { Operation } from '../types/domain'
import { fmtVND } from '../lib/format'

export function OperationsScreen() {
  const { data: list = [], isLoading, error } = useOperations()

  const groups = useMemo(() => {
    const m = new Map<string, Operation[]>()
    list.forEach((o) => {
      const arr = m.get(o.category) ?? []
      arr.push(o)
      m.set(o.category, arr)
    })
    return Array.from(m.entries())
  }, [list])

  return (
    <div>
      <PageHeader
        title="Công đoạn"
        description="Danh mục công đoạn sản xuất chuẩn. /api/operations"
        actions={
          <Button>
            <Plus className="size-4" /> Thêm công đoạn
          </Button>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <div className="space-y-4">
          {groups.map(([cat, ops]) => (
            <Card key={cat}>
              <CardHeader className="flex-row items-center justify-between border-b">
                <div>
                  <CardTitle>{cat}</CardTitle>
                  <CardDesc>{ops.length} công đoạn</CardDesc>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="size-4" /> Thêm vào nhóm
                </Button>
              </CardHeader>
              <Table>
                <THead>
                  <TR>
                    <TH className="w-[120px]">Mã</TH>
                    <TH>Tên công đoạn</TH>
                    <TH>Đơn vị</TH>
                    <TH className="text-right">Sản phẩm áp dụng</TH>
                    <TH className="text-right">Đơn giá TB</TH>
                    <TH className="w-[80px]" />
                  </TR>
                </THead>
                <tbody>
                  {ops.map((op, i) => (
                    <TR key={op.id}>
                      <TD>
                        <code className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded">
                          {op.code}
                        </code>
                      </TD>
                      <TD className="font-medium">{op.name}</TD>
                      <TD className="text-sm text-muted-foreground">{op.unit}</TD>
                      <TD className="text-right num">{(i % 4) + 2}</TD>
                      <TD className="text-right num">
                        {fmtVND(1500 + ((i * 313) % 25) * 100)}
                      </TD>
                      <TD>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="iconsm" aria-label="Sửa">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="iconsm" aria-label="Xóa">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))}
        </div>
      </QueryState>
    </div>
  )
}
