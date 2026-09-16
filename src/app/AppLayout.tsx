import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useAuthStore } from '@/stores/authStore'
import { useOtpStore } from '@/stores/otpStore'
import { dashboardApi } from '@/api/dashboard.api'
import {
  LayoutDashboard,
  Users,
  Network,
  Layers,
  PhoneCall,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemConfig {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: string;
  testId: string;
}

interface NavGroup {
  title: string;
  items: NavItemConfig[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Operations',
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        testId: 'nav-dashboard',
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        label: 'Users',
        to: '/users',
        icon: Users,
        permission: 'userPermissions',
        testId: 'nav-users',
      },
      {
        label: 'Dealers',
        to: '/dealers',
        icon: Network,
        permission: 'dealerPermissions',
        testId: 'nav-dealers',
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      {
        label: 'Commissions',
        to: '/commissions',
        icon: Layers,
        permission: 'commissionPermissions',
        testId: 'nav-commissions',
      },
      {
        label: 'Plans & Numbers',
        to: '/plans',
        icon: PhoneCall,
        permission: 'plansNumberpermissions',
        testId: 'nav-plans',
      },
    ],
  },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const roleName = useAuthStore((state) => state.roleName)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  // Operational telemetry: live pending actions count
  const { data: kpis } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardApi.getKpis,
    staleTime: 1000 * 60 * 2,
  })

  // Dynamic OTP state: only display when an active OTP session is running
  const otpStatus = useOtpStore((state) => state.status)
  const otpContext = useOtpStore((state) => state.context)
  const isOtpActive = otpStatus !== 'idle'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      {/* Top Navbar: Near-black #0F1115 with console identity and consolidated status */}
      <header className="sticky top-0 z-40 border-b border-[#1E232B] bg-[#0F1115]">
        <div className="flex h-12 items-center justify-between px-3 sm:px-5 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-150 ease-out"
              aria-label="Toggle navigation menu"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* Console Identity: Clean wordmark without false navigation text */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-100 tracking-tight font-heading">
                SCM Portal
              </span>
            </div>
          </div>

          {/* Right Header: Single Consolidated Telemetry Status & Operator Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Consolidated System Status: Connection + Cluster Node */}
            <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-white/[0.04] px-2.5 py-1 rounded border border-[#1E232B]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>API Connected</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">scm-db-primary</span>
            </div>

            {/* Operator Profile */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2.5 border-l border-[#1E232B] text-xs">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-950/80 text-cyan-300 text-[11px] font-semibold border border-cyan-800/50">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-200 leading-tight text-xs">{user.username}</p>
                  <p className="text-[10px] text-slate-400 leading-none">{roleName || 'Operator'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Layout with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation: Near-black #0F1115 (Desktop: w-52) */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-52 border-r border-[#1E232B] bg-[#0F1115] transition-transform duration-200 ease-in-out md:static md:translate-x-0 pt-12 md:pt-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          data-testid="sidebar-navigation"
        >
          {/* Natural content flow without artificial full-height stretch gap */}
          <div className="h-full flex flex-col py-3 px-2.5 overflow-y-auto space-y-4">
            <nav className="space-y-3.5 pt-1" aria-label="Main Navigation">
              {NAV_GROUPS.map((group) => {
                // Check if any items in the group are visible to avoid dangling headers
                const visibleItems = group.items.filter(
                  (item) => !item.permission || hasPermission(item.permission)
                )
                if (visibleItems.length === 0) {
                  return null
                }

                return (
                  <div key={group.title} className="space-y-1">
                    <p className="px-2 text-[10px] font-semibold text-slate-400 tracking-normal">
                      {group.title}
                    </p>

                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const linkElement = (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            data-testid={item.testId}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors duration-150 ease-out',
                                isActive
                                  ? 'bg-white/[0.08] text-white font-medium border-l-2 border-cyan-500 pl-2'
                                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                              )
                            }
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-200" />
                            <span>{item.label}</span>
                          </NavLink>
                        )

                        if (item.permission) {
                          return (
                            <PermissionGuard key={item.to} permission={item.permission}>
                              {linkElement}
                            </PermissionGuard>
                          )
                        }

                        return linkElement
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* Operational System Status Panel */}
            <div className="pt-3 border-t border-[#1E232B] space-y-2">
              <p className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                System Status
              </p>

              <div className="space-y-1.5 px-2">
                {/* Live pending actions count */}
                <NavLink
                  to="/dashboard"
                  className="flex items-center justify-between text-slate-400 hover:text-slate-200 text-xs transition-colors duration-150 ease-out py-0.5"
                >
                  <span className="text-[11px]">Pending actions</span>
                  <span className="rounded bg-amber-950/60 text-amber-400 border border-amber-800/50 px-1.5 py-0.5 text-[10px] font-semibold font-sans">
                    {kpis ? kpis.pendingActions : '—'}
                  </span>
                </NavLink>

                {/* Dynamic OTP Flow Session - ONLY rendered when an active OTP session is running */}
                {isOtpActive && (
                  <div className="rounded border border-cyan-800/60 bg-cyan-950/40 p-2 text-xs space-y-1 mt-1.5">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-medium text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>OTP In Progress</span>
                    </div>
                    <p className="text-[10px] text-slate-300 truncate">
                      {otpContext?.actionName || 'Verification'}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      Status: {otpStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Footer without static badges */}
            <div className="px-2 pt-1 text-[10px] text-slate-600">
              v0.0.0
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Routed Page Content: Light canvas */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
