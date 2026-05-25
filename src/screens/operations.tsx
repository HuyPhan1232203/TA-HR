import { Edit, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { QueryState } from '../components/ui/query-state'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import { PageHeader } from '../components/layout/page-header'
import { useOperations } from '@/hooks/useOperations'

export function OperationsScreen() {
  const { data: list = [], isLoading, error } = useOperations()

  return (
    <div>
      <PageHeader
        title="Công đoạn"
        description="Danh mục công đoạn sản xuất chuẩn."
        actions={
          <Button>
            <Plus className="size-4" /> Thêm công đoạn
          </Button>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Mã</TableHead>
                <TableHead>Tên công đoạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((op) => (
                <TableRow key={op.id}>
                  <TableCell>
                    <code className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded">
                      {op.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{op.name}</TableCell>
                  <TableCell>
                    <Badge variant={op.isActive ? 'success' : 'muted'}>
                      {op.isActive ? 'Đang dùng' : 'Ngừng'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon-sm" aria-label="Sửa">
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Xóa">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </QueryState>
    </div>
  )
}
