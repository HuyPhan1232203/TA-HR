import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ForbiddenScreen() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4 max-w-sm">
        <div className="inline-grid place-items-center size-14 rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">403 — Không có quyền</h1>
        <p className="text-sm text-muted-foreground">
          Bạn không có quyền truy cập tài nguyên này. Liên hệ quản trị viên nếu
          cần cấp quyền.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Về bảng điều khiển</Button>
      </div>
    </div>
  )
}
