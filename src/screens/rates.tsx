import { useMemo, useState } from 'react'
import { Download, History, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardDesc,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { QueryState } from '../components/ui/query-state'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { PageHeader } from '../components/layout/page-header'
import { useOperations } from '@/hooks/useOperations'
import { useProducts } from '@/hooks/useProducts'
import { useRates } from '@/hooks/useRates'
import { fmtDate, fmtVND } from '../lib/format'
import { cn } from '../lib/utils'

export function RatesScreen() {
  const { data: products = [] } = useProducts()
  const { data: operations = [] } = useOperations()
  const { data: allRates = [], isLoading, error } = useRates()
  const [selectedId, setSelectedId] = useState('')

  // Default to the first product once loaded, until the user picks one.
  const productId =
    selectedId || (products.length > 0 ? products[0].id : '')

  const product = products.find((p) => p.id === productId)
  const rates = useMemo(
    () => allRates.filter((r) => r.productId === productId),
    [allRates, productId],
  )
  const total = rates.reduce((s, r) => s + r.unitPrice, 0)

  return (
    <div>
      <PageHeader
        title="Đơn giá công đoạn"
        description="Đơn giá theo sản phẩm × công đoạn. /api/product-operation-rates"
        actions={
          <Button>
            <Plus className="size-4" /> Thêm đơn giá
          </Button>
        }
      />

      <div className="grid grid-cols-[280px_1fr] gap-4">
        <Card>
          <div className="p-4 border-b">
            <div className="text-sm font-medium">Sản phẩm</div>
          </div>
          <div className="p-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  'w-full text-left p-3 rounded-none transition-colors',
                  productId === p.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted',
                )}
              >
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <code className="font-mono">{p.code}</code>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader className="border-b flex-row items-center justify-between">
            <div>
              <CardTitle>{product?.name ?? '—'}</CardTitle>
              <CardDesc>
                Có {rates.length} công đoạn được định giá. Tổng đơn giá:{' '}
                <strong className="text-foreground num">{fmtVND(total)}</strong>
              </CardDesc>
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Xuất CSV
            </Button>
          </CardHeader>
          <QueryState isLoading={isLoading} error={error}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Công đoạn</TableHead>
                  <TableHead>Loại giờ</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead>Hiệu lực từ</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => {
                  const op = operations.find((o) => o.id === r.operationId)
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{op?.name}</div>
                        <code className="text-xs font-mono text-muted-foreground">
                          {op?.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm">{r.workTimeType}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="num text-right h-8 w-[120px] ml-auto"
                          defaultValue={r.unitPrice}
                          onBlur={() => toast.success('Đã cập nhật đơn giá')}
                        />
                      </TableCell>
                      <TableCell className="text-sm">{fmtDate(r.effectiveFrom)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" aria-label="Lịch sử">
                            <History className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Xóa">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </QueryState>
        </Card>
      </div>
    </div>
  )
}
