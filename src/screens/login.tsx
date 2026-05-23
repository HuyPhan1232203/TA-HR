import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '@/components/auth-context'
import { authApi } from '@/api/auth.api'
import { setToken } from '@/lib/auth-storage'
import { toast } from 'sonner'

interface FromState {
  from?: Location
}

export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [username, setUsername] = useState('huong.tt')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.')
      return
    }
    setLoading(true)
    try {
      const loginRes = await authApi.login({ username, password })
      const login = loginRes.data
      if (!login) throw new Error(loginRes.message || 'Đăng nhập thất bại')

      setToken(login.accessToken)

      const permRes = await authApi.myPermissions()
      const permissions = permRes.data?.permissions ?? []

      signIn({
        accountId: login.accountId,
        username: login.username,
        fullName: login.fullName,
        employeeId: login.employeeId,
        roles: login.roles,
        permissions,
      })
      toast.success('Đăng nhập thành công')
      const from = (location.state as FromState | null)?.from?.pathname ?? '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-12 text-primary-foreground relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, oklch(0.5635 0.2408 260.8178) 0%, oklch(0.45 0.22 280) 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 backdrop-blur grid place-items-center font-bold">
              TA
            </div>
            <div className="text-lg font-semibold tracking-tight">TA-HR</div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] opacity-70">
              Module backend
            </div>
            <h1 className="text-4xl font-semibold tracking-tight leading-tight mt-2">
              Quản trị nhân sự
              <br />
              và tính lương sản xuất.
            </h1>
            <p className="opacity-80 mt-3 text-[15px] leading-relaxed max-w-md">
              Phòng ban · Nhân viên · Chấm công · Kỳ lương · Bảng lương · Sản
              phẩm · Công đoạn · Báo cáo.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              'Departments',
              'Employees',
              'Attendances',
              'Payroll Periods',
              'Payroll Runs',
              'Reports',
            ].map((t) => (
              <div
                key={t}
                className="px-3 py-2 rounded-md bg-white/10 border border-white/15 text-xs font-medium backdrop-blur"
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs opacity-60">
          © 2026 TA-HR · API {import.meta.env.VITE_API_URL}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              TA
            </div>
            <div className="text-lg font-semibold">TA-HR</div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Đăng nhập</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Dùng tài khoản nội bộ được cấp bởi quản trị viên.
          </p>

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="u">Tên đăng nhập</Label>
              <Input
                id="u"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="p">Mật khẩu</Label>
                <a href="#" className="text-xs text-primary hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <Input
                id="p"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="size-4" /> {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>

            <div className="text-[11px] text-muted-foreground text-center pt-2">
              POST <code className="font-mono">/api/auth/login</code> → GET{' '}
              <code className="font-mono">/api/auth/my-permissions</code>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
