import { useMemo, useState } from 'react'
import { Check, Edit, Eye, Package, Play, Plus, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import { StatCard } from './dashboard'
import { useProducts } from '@/hooks/useProducts'
import { fmtDate } from '../lib/format'

export function ProductsScreen() {
  const { data: list = [], isLoading, error } = useProducts()
  const [q, setQ] = useState('')

  const filtered = useMemo(
    () =>
      list.filter(
        (p) =>
          !q ||
          p.code.toLowerCase().includes(q.toLowerCase()) ||
          p.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [list, q],
  )

  const activeCount = list.filter((p) => p.status === 'Active').length
  const avgOps =
    list.length === 0
      ? 0
      : Math.round(list.reduce((s, p) => s + p.operations, 0) / list.length)

  return (
    <div>
      <PageHeader
        title="Sản phẩm"
        description="Danh mục sản phẩm dùng cho lương sản phẩm. /api/products"
        actions={
          <Button>
            <Plus className="size-4" /> Thêm sản phẩm
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Tổng sản phẩm" value={String(list.length)} icon={Package} />
        <StatCard label="Đang sản xuất" value={String(activeCount)} icon={Check} />
        <StatCard label="Trung bình công đoạn" value={String(avgOps)} icon={Play} />
      </div>

      <Card>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm sản phẩm…"
              className="pl-8 w-[280px]"
            />
          </div>
        </div>
        <QueryState isLoading={isLoading} error={error}>
          <div className="grid grid-cols-3 gap-4 p-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow group"
              >
                <div
                  className="aspect-[4/3] rounded-md bg-muted mb-3 grid place-items-center text-muted-foreground"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, oklch(0.95 0 0) 0 8px, oklch(0.92 0 0) 8px 16px)',
                  }}
                >
                  <div className="font-mono text-xs px-2 py-1 bg-background/80 rounded border">
                    {p.code}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Cập nhật {fmtDate(p.lastUpdated)}
                    </div>
                  </div>
                  <Badge variant={p.status === 'Active' ? 'success' : 'muted'}>
                    {p.status === 'Active' ? 'Đang SX' : 'Tạm dừng'}
                  </Badge>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    <span className="num font-medium text-foreground">
                      {p.operations}
                    </span>{' '}
                    công đoạn
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="iconsm" aria-label="Xem">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="iconsm" aria-label="Sửa">
                      <Edit className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </QueryState>
      </Card>
    </div>
  )
}
