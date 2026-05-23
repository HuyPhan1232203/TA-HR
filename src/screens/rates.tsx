import { useState } from 'react'
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
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
import { toast } from 'sonner'
import { PageHeader } from '../components/layout/page-header'
import { useOperations } from '@/hooks/useOperations'
import { useProducts } from '@/hooks/useProducts'
import { useProductRates } from '@/hooks/useRates'
import { fmtDate, fmtVND } from '../lib/format'
import { cn } from '../lib/utils'

export function RatesScreen() {
  const { data: products = [] } = useProducts()
  const { data: operations = [] } = useOperations()
  const [productCode, setProductCode] = useState('SP-A001')
  const product = products.find((p) => p.code === productCode)
  const { data: rates = [], isLoading, error } = useProductRates(productCode)
  const total = rates.reduce((s, r) => s + r.rate, 0)

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
                onClick={() => setProductCode(p.code)}
                className={cn(
                  'w-full text-left p-3 rounded-md transition-colors',
                  productCode === p.code
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
              <THead>
                <TR>
                  <TH>Công đoạn</TH>
                  <TH>Mô tả</TH>
                  <TH>Đơn vị</TH>
                  <TH className="text-right">Đơn giá</TH>
                  <TH>Hiệu lực từ</TH>
                  <TH className="w-[80px]" />
                </TR>
              </THead>
              <tbody>
                {rates.map((r) => {
                  const op = operations.find((o) => o.code === r.operation)
                  return (
                    <TR key={r.id}>
                      <TD>
                        <div className="font-medium text-sm">{op?.name}</div>
                        <code className="text-xs font-mono text-muted-foreground">
                          {op?.code}
                        </code>
                      </TD>
                      <TD className="text-xs text-muted-foreground">
                        {op?.category}
                      </TD>
                      <TD className="text-sm">{op?.unit}</TD>
                      <TD className="text-right">
                        <Input
                          className="num text-right h-8 w-[120px] ml-auto"
                          defaultValue={r.rate}
                          onBlur={() => toast.success('Đã cập nhật đơn giá')}
                        />
                      </TD>
                      <TD className="text-sm">{fmtDate(r.effectiveFrom)}</TD>
                      <TD>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="iconsm" aria-label="Lịch sử">
                            <History className="size-4" />
                          </Button>
                          <Button variant="ghost" size="iconsm" aria-label="Xóa">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
          </QueryState>
        </Card>
      </div>
    </div>
  )
}
