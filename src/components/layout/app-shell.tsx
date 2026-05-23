import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { SCREEN_META } from './nav'
import { cn } from '../../lib/utils'

export function AppShell() {
  const { pathname } = useLocation()
  const meta = SCREEN_META[pathname] ?? { title: 'TA-HR', subtitle: '' }
  const fullBleed = pathname === '/payroll-runs'

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <div
          key={pathname}
          className={cn(
            'flex-1',
            fullBleed ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin',
          )}
        >
          <div
            className={cn(
              fullBleed ? 'h-full' : 'p-6 fade-in max-w-[1600px] mx-auto',
            )}
          >
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
