import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useAuthStore } from '@/stores/authStore'
import { useOtpStore } from '@/stores/otpStore'
import {
  LayoutDashboard,
  Users,
  Network,
  Layers,
  PhoneCall,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavSingleItem {
  type: 'link';
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: string;
  testId: string;
}

interface NavSubItem {
  label: string;
  to: string;
  testId: string;
}

interface NavExpandableItem {
  type: 'expandable';
  label: string;
  basePath: string;
  icon: typeof Layers;
  permission?: string;
  testId: string;
  children: NavSubItem[];
}

type NavItemConfig = NavSingleItem | NavExpandableItem;

interface NavGroup {
  title: string;
  items: NavItemConfig[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Operations',
    items: [
      {
        type: 'link',
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
        type: 'link',
        label: 'Users',
        to: '/users',
        icon: Users,
        permission: 'userPermissions',
        testId: 'nav-users',
      },
      {
        type: 'link',
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
        type: 'expandable',
        label: 'Commissions',
        basePath: '/commissions',
        icon: Layers,
        permission: 'commissionPermissions',
        testId: 'nav-commissions',
        children: [
          {
            label: 'Configuration',
            to: '/commissions',
            testId: 'nav-commissions-config',
          },
          {
            label: 'Search & Modify',
            to: '/commissions/search',
            testId: 'nav-commissions-search',
          },
          {
            label: 'Franchise Balance',
            to: '/commissions/franchise-balance',
            testId: 'nav-franchise-balance',
          },
        ],
      },
      {
        type: 'expandable',
        label: 'Plans & Numbers',
        basePath: '/plans',
        icon: PhoneCall,
        permission: 'plansNumberpermissions',
        testId: 'nav-plans',
        children: [
          {
            label: 'Product Plans',
            to: '/plans',
            testId: 'nav-plans-list',
          },
          {
            label: 'Denominations',
            to: '/plans/denominations',
            testId: 'nav-plans-denominations',
          },
          {
            label: 'MNP Routing',
            to: '/plans/mnp',
            testId: 'nav-plans-mnp',
          },
          {
            label: 'Number Series',
            to: '/plans/number-series',
            testId: 'nav-plans-number-series',
          },
        ],
      },
    ],
  },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const user = useAuthStore((state) => state.user)
  const roleName = useAuthStore((state) => state.roleName)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  // Expandable sub-menu states, auto-expanded when active route matches
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/commissions': location.pathname.startsWith('/commissions'),
    '/plans': location.pathname.startsWith('/plans'),
  })

  useEffect(() => {
    if (location.pathname.startsWith('/commissions')) {
      setExpandedMenus((prev) => ({ ...prev, '/commissions': true }))
    }
    if (location.pathname.startsWith('/plans')) {
      setExpandedMenus((prev) => ({ ...prev, '/plans': true }))
    }
  }, [location.pathname])

  const toggleMenu = (basePath: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [basePath]: !prev[basePath],
    }))
  }

  const handleSignOut = () => {
    clearAuth()
    navigate('/login')
  }

  // Dynamic OTP state: only display when an active OTP session is running
  const otpStatus = useOtpStore((state) => state.status)
  const otpContext = useOtpStore((state) => state.context)
  const isOtpActive = otpStatus !== 'idle'

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0F172A] overflow-hidden antialiased select-none font-sans">
      {/* Top Navbar: Deep Navy #0F172A with minimal, quiet inline telemetry */}
      <header className="h-12 shrink-0 border-b border-[#1E293B] bg-[#0F172A] z-40">
        <div className="flex h-full items-center justify-between px-3 sm:px-5 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
              aria-label="Toggle navigation menu"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* Console Identity Wordmark */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white shadow-xs">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-extrabold text-slate-100 tracking-tight font-heading">
                SCM Portal
              </span>
            </div>
          </div>

          {/* Right Header: Plain quiet inline status & Operator Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quiet inline telemetry without pill border chrome */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>API Connected</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">scm-db-primary</span>
            </div>

            {/* Operator Profile / Sign Out */}
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-[#1E293B]">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-950/80 text-blue-300 text-[11px] font-semibold border border-blue-800/50">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-slate-200 leading-tight text-xs">{user.username}</p>
                  <p className="text-[10px] text-slate-400 leading-none">{roleName || 'Operator'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  data-testid="sign-out-btn"
                  title="Sign out of console"
                  aria-label="Sign out of console"
                  className="ml-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors duration-150 focus:outline-none"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Layout: Fixed Sidebar + Independently Scrollable Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Navigation: Deep Navy #0F172A with fixed height and pinned footer */}
        <aside
          className={cn(
            'w-60 shrink-0 h-full border-r border-[#1E293B] bg-[#0F172A] flex flex-col justify-between z-30 transition-transform duration-200 ease-in-out md:static md:translate-x-0',
            mobileOpen
              ? 'fixed inset-y-0 left-0 pt-12 z-50 translate-x-0'
              : 'hidden md:flex'
          )}
          data-testid="sidebar-navigation"
        >
          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
            <nav className="space-y-4 pt-1" aria-label="Main Navigation">
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
                    <p className="px-2.5 text-[11px] font-semibold text-slate-400 tracking-normal">
                      {group.title}
                    </p>

                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon

                        // Case 1: Simple single nav link
                        if (item.type === 'link') {
                          const linkElement = (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              onClick={() => setMobileOpen(false)}
                              data-testid={item.testId}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium transition-colors duration-150',
                                  isActive
                                    ? 'bg-slate-800/90 text-white border-l-2 border-blue-500 pl-2'
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                )
                              }
                            >
                              <Icon className="h-4 w-4 shrink-0 text-slate-400" />
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
                        }

                        // Case 2: Expandable hierarchical item with nested sub-routes
                        const isExpanded = !!expandedMenus[item.basePath]
                        const isParentActive = location.pathname.startsWith(item.basePath)

                        const expandableElement = (
                          <div key={item.basePath} className="space-y-0.5">
                            {/* Parent Collapsible Trigger */}
                            <button
                              type="button"
                              onClick={() => toggleMenu(item.basePath)}
                              data-testid={item.testId}
                              className={cn(
                                'w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[13px] font-medium transition-colors duration-150',
                                isParentActive
                                  ? 'text-white bg-slate-800/50'
                                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                                <span>{item.label}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </button>

                            {/* Nested Sub-Links */}
                            {isExpanded && (
                              <div className="ml-4 pl-3 border-l border-slate-800 space-y-0.5 pt-0.5 pb-1">
                                {item.children.map((child) => (
                                  <NavLink
                                    key={child.to}
                                    to={child.to}
                                    end={child.to === item.basePath}
                                    onClick={() => setMobileOpen(false)}
                                    data-testid={child.testId}
                                    className={({ isActive }) =>
                                      cn(
                                        'block px-2.5 py-1 rounded text-xs transition-colors duration-150',
                                        isActive
                                          ? 'bg-slate-800/90 text-blue-400 font-semibold'
                                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                      )
                                    }
                                  >
                                    {child.label}
                                  </NavLink>
                                ))}
                              </div>
                            )}
                          </div>
                        )

                        if (item.permission) {
                          return (
                            <PermissionGuard key={item.basePath} permission={item.permission}>
                              {expandableElement}
                            </PermissionGuard>
                          )
                        }

                        return expandableElement
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Pinned Footer Area: Stays at the bottom of the sidebar without scrolling */}
          <div className="shrink-0 mt-auto p-3 bg-[#0F172A]">
            {/* Dynamic OTP Flow Session - ONLY rendered when an active OTP session is running */}
            {isOtpActive && (
              <div className="rounded border border-blue-800/60 bg-blue-950/40 p-2.5 text-xs space-y-1 mb-2.5">
                <div className="flex items-center gap-1.5 text-blue-400 font-medium text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span>OTP In Progress</span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {otpContext?.actionName || 'Verification'}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">
                  Status: {otpStatus}
                </p>
              </div>
            )}

            {/* Permanent Pinned Version Footnote without separator line */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>SCM Console</span>
              <span>v0.1.0</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile navigation */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Routed Page Content: Warm off-white #F8F9FB canvas that scrolls independently */}
        <main className="flex-1 h-full overflow-y-auto bg-[#F8F9FB] focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
