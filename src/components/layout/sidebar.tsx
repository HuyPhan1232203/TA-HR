import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Avatar } from '../ui/avatar'
import { useAuth } from '../auth-context'
import { canAccess } from '../../lib/permissions'
import { NAV_GROUPS, ROUTE_ACCESS } from './nav'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const { session, signOut } = useAuth()
  const displayName = session?.fullName ?? session?.username ?? 'Khách'
  const subtitle = session?.roles?.[0] ?? 'Tài khoản nội bộ'

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => canAccess(session, ROUTE_ACCESS[item.to])),
  })).filter((g) => g.items.length > 0)

  return (
    <aside className="w-[244px] shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <img
          src="/logos/LogoTA.svg"
          alt="TA-CONSULTANT"
          className="h-8 w-auto shrink-0"
        />
        <div>
          <div className="text-[13.5px] font-semibold tracking-tight leading-none">
            TA CONSULTANT
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Nhân sự & tính lương
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-3">
        {groups.map((g) => (
          <div key={g.label} className="mt-3 first:mt-1">
            <div className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              {g.label}
            </div>
            {g.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'w-full flex items-center gap-2.5 px-2.5 h-8 rounded-none text-[13.5px] transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-primary font-medium border-l-2 border-primary'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <Icon className="size-[16px] shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 p-2 rounded-none hover:bg-sidebar-accent">
          <Avatar name={displayName} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{displayName}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {subtitle}
            </div>
          </div>
          <button
            type="button"
            className="rounded-none p-1 hover:bg-background"
            onClick={signOut}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
