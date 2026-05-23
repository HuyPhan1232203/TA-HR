import { Edit, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { QueryState } from '../components/ui/query-state'
import {
  Table,
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
import { PageHeader } from '../components/layout/page-header'
import { useOperations } from '@/hooks/useOperations'

export function OperationsScreen() {
  const { data: list = [], isLoading, error } = useOperations()

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
        <Card>
          <Table>
            <THead>
              <TR>
                <TH className="w-[120px]">Mã</TH>
                <TH>Tên công đoạn</TH>
                <TH>Trạng thái</TH>
                <TH className="w-[80px]" />
              </TR>
            </THead>
            <tbody>
              {list.map((op) => (
                <TR key={op.id}>
                  <TD>
                    <code className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded">
                      {op.code}
                    </code>
                  </TD>
                  <TD className="font-medium">{op.name}</TD>
                  <TD>
                    <Badge variant={op.isActive ? 'success' : 'muted'}>
                      {op.isActive ? 'Đang dùng' : 'Ngừng'}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon-sm" aria-label="Sửa">
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Xóa">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </QueryState>
    </div>
  )
}
