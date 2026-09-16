import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/components/feedback/ApiError'
import { dashboardApi, type ActivityItem } from '@/api/dashboard.api'
import { AlertTriangle, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const {
    data: kpis,
    isLoading: isKpisLoading,
    error: kpisError,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardApi.getKpis,
  })

  const {
    data: activities,
    isLoading: isActivitiesLoading,
  } = useQuery({
    queryKey: ['dashboard', 'recentActivities'],
    queryFn: dashboardApi.getRecentActivities,
  })

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" data-testid="dashboard-page">
      {/* Page Header: High-contrast Manrope heading with single global telemetry status */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-heading">
            SCM Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live telemetry from master network database • Synced just now
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="h-2 w-2 rounded-full bg-cyan-600" />
          <span>Cluster node: scm-db-primary</span>
        </div>
      </div>

      {/* Query Error State */}
      {kpisError && (
        <ApiError
          error={kpisError}
          onRetry={() => refetchKpis()}
          title="Failed to load dashboard metrics"
        />
      )}

      {/* Operational Metrics: Purposeful structural variation */}
      <div className="space-y-4">
        {/* Row 1: Priority Operational Callout + Unified Telemetry Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Primary Focal Hero: Pending Actions with amber urgent border */}
          <div
            className="lg:col-span-4 rounded-xl border border-amber-300/80 bg-amber-50/50 p-5 relative overflow-hidden shadow-2xs flex flex-col justify-between"
            data-testid="kpi-card-pendingActions"
          >
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <span
                    className="text-xs font-bold text-amber-950 font-heading"
                    data-testid="kpi-label-pendingActions"
                  >
                    Pending actions
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                  Action required
                </span>
              </div>

              <div className="mt-3">
                {isKpisLoading ? (
                  <Skeleton
                    className="h-10 w-28 rounded-md bg-amber-200/60"
                    data-testid="kpi-skeleton-pendingActions"
                  />
                ) : (
                  <div
                    className="text-3xl sm:text-4xl font-extrabold text-amber-950 tracking-tight font-sans"
                    data-testid="kpi-value-pendingActions"
                  >
                    {kpis ? kpis.pendingActions.toLocaleString() : '—'}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-amber-900/80 mt-2 leading-relaxed">
              Transactions, MPIN resets, and balance requests awaiting clearance.
            </p>
          </div>

          {/* Core Network Telemetry: Unified inline stat strip with hairline divider */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* User Telemetry Half */}
              <div className="sm:pr-6 pb-4 sm:pb-0" data-testid="kpi-card-totalUsers">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold text-slate-500"
                    data-testid="kpi-label-totalUsers"
                  >
                    Total users
                  </span>
                  <div className="flex items-center gap-1.5" data-testid="kpi-card-activeUsers">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span
                      className="text-[11px] font-medium text-slate-500"
                      data-testid="kpi-label-activeUsers"
                    >
                      Active users:
                    </span>
                    {isKpisLoading ? (
                      <Skeleton className="h-4 w-10 rounded-xs" data-testid="kpi-skeleton-activeUsers" />
                    ) : (
                      <span
                        className="text-xs font-semibold text-slate-800 font-sans"
                        data-testid="kpi-value-activeUsers"
                      >
                        {kpis?.activeUsers.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  {isKpisLoading ? (
                    <Skeleton className="h-8 w-24 rounded-md" data-testid="kpi-skeleton-totalUsers" />
                  ) : (
                    <div
                      className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans"
                      data-testid="kpi-value-totalUsers"
                    >
                      {kpis?.totalUsers.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Authorized HRMS accounts</span>
                  <span className="text-cyan-700 font-medium">
                    {kpis ? `${Math.round((kpis.activeUsers / kpis.totalUsers) * 100)}% active` : ''}
                  </span>
                </div>
              </div>

              {/* Dealer Telemetry Half */}
              <div className="sm:pl-6 pt-4 sm:pt-0" data-testid="kpi-card-totalDealers">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold text-slate-500"
                    data-testid="kpi-label-totalDealers"
                  >
                    Total dealers
                  </span>
                  <div className="flex items-center gap-1.5" data-testid="kpi-card-activeDealers">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span
                      className="text-[11px] font-medium text-slate-500"
                      data-testid="kpi-label-activeDealers"
                    >
                      Active dealers:
                    </span>
                    {isKpisLoading ? (
                      <Skeleton className="h-4 w-10 rounded-xs" data-testid="kpi-skeleton-activeDealers" />
                    ) : (
                      <span
                        className="text-xs font-semibold text-slate-800 font-sans"
                        data-testid="kpi-value-activeDealers"
                      >
                        {kpis?.activeDealers.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  {isKpisLoading ? (
                    <Skeleton className="h-8 w-24 rounded-md" data-testid="kpi-skeleton-totalDealers" />
                  ) : (
                    <div
                      className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans"
                      data-testid="kpi-value-totalDealers"
                    >
                      {kpis?.totalDealers.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Franchise & Retailer nodes</span>
                  <span className="text-cyan-700 font-medium">
                    {kpis ? `${Math.round((kpis.activeDealers / kpis.totalDealers) * 100)}% active` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Configuration Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="kpi-grid">
          {/* Commission Configurations */}
          <div
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between"
            data-testid="kpi-card-commissionConfigurations"
          >
            <div>
              <p
                className="text-xs font-semibold text-slate-600"
                data-testid="kpi-label-commissionConfigurations"
              >
                Commission configurations
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Active FRC, OTF, postpaid & landline rule matrices
              </p>
            </div>

            {isKpisLoading ? (
              <Skeleton className="h-7 w-12 rounded-md" data-testid="kpi-skeleton-commissionConfigurations" />
            ) : (
              <span
                className="text-2xl font-bold text-slate-900 font-sans"
                data-testid="kpi-value-commissionConfigurations"
              >
                {kpis?.commissionConfigurations}
              </span>
            )}
          </div>

          {/* Plans */}
          <div
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between"
            data-testid="kpi-card-plans"
          >
            <div>
              <p
                className="text-xs font-semibold text-slate-600 font-heading"
                data-testid="kpi-label-plans"
              >
                Plans
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Product offerings, zone denominations & series
              </p>
            </div>

            {isKpisLoading ? (
              <Skeleton className="h-7 w-12 rounded-md" data-testid="kpi-skeleton-plans" />
            ) : (
              <span
                className="text-2xl font-bold text-slate-900 font-sans"
                data-testid="kpi-value-plans"
              >
                {kpis?.plans}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Section: NOC-style event log with plain inline limitation text */}
      <div className="space-y-3 pt-2" data-testid="recent-activities-section">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
              <Activity className="h-4 w-4 text-cyan-700" />
              Recent activities
            </h2>
            <p className="text-xs text-slate-500">
              Audit stream of administrative actions and mutations across modules.
            </p>
          </div>

          {/* Plain inline limitation text — no badge chrome */}
          <span
            className="text-xs text-slate-400 font-normal"
            data-testid="limitation-note"
          >
            Static feed — dedicated activity log API endpoint pending backend integration
          </span>
        </div>

        {/* Activity List: Monoline hairline rows */}
        <div className="rounded-lg border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {isActivitiesLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3.5">
                  <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : activities && activities.length > 0 ? (
              activities.map((item: ActivityItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                  data-testid="activity-item"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        item.status === 'success' ? 'bg-emerald-600' : 'bg-amber-500'
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {item.action}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Operator: <span className="text-slate-600 font-medium">{item.actor}</span>
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-[11px] text-slate-400 whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No recent activity records available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
