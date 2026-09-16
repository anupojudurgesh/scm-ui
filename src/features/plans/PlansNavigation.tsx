import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Radio, Coins, ArrowLeftRight, Hash } from 'lucide-react'

export type PlansTabKey = 'plans' | 'denominations' | 'mnp' | 'number-series'

interface PlansNavigationProps {
  activeTab: PlansTabKey;
  className?: string;
}

const TABS: Array<{
  id: PlansTabKey;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: 'plans',
    label: 'Product Plans',
    path: '/plans',
    icon: Radio,
    description: 'Tariff packs, STVs, talk values & validity',
  },
  {
    id: 'denominations',
    label: 'Denomination Matrix',
    path: '/plans/denominations',
    icon: Coins,
    description: 'Recharge voucher values & bucket parameters',
  },
  {
    id: 'mnp',
    label: 'MNP Routing',
    path: '/plans/mnp',
    icon: ArrowLeftRight,
    description: 'Mobile number portability recipient tables',
  },
  {
    id: 'number-series',
    label: 'Number Series',
    path: '/plans/number-series',
    icon: Hash,
    description: 'IN platform allocation & series ranges',
  },
]

export function PlansNavigation({ activeTab, className }: PlansNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className={cn('border-b border-slate-200 bg-white px-2 sm:px-4', className)}>
      <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Plans navigation tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id || location.pathname === tab.path
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={cn(
                'group relative inline-flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-medium transition-all whitespace-nowrap outline-none',
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
              data-testid={`tab-nav-${tab.id}`}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span>{tab.label}</span>
              {isActive && (
                <span
                  className="absolute -bottom-px left-0 right-0 h-[2.5px] bg-blue-600 rounded-t-sm z-10 pointer-events-none"
                  data-testid="active-tab-indicator"
                />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
