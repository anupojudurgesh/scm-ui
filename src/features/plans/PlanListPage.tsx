import * as React from 'react'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DataTable, type DataTableColumn } from '@/components/tables/DataTable'
import { SearchToolbar } from '@/components/tables/SearchToolbar'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { useAuthStore } from '@/stores/authStore'
import {
  usePlansQuery,
  useDeletePlanMutation,
  type Plan,
} from '@/api/plan.api'
import { useAllCirclesQuery } from '@/api/masterdata.api'
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Clock,
  Calendar,
} from 'lucide-react'

import { PlansNavigation } from './PlansNavigation'
import { PlanForm } from './PlanForm'

export function PlanListPage() {
  // Query & Data
  const { data: plans = [], isLoading, error, refetch } = usePlansQuery()
  const { data: circles = [] } = useAllCirclesQuery()
  const deletePlanMutation = useDeletePlanMutation()

  // Filter States
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCircle, setSelectedCircle] = React.useState<string>('all')
  const [selectedType, setSelectedType] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  // Modal States
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null)
  const [deletingPlan, setDeletingPlan] = React.useState<Plan | null>(null)

  // Filter logic
  const filteredPlans = React.useMemo(() => {
    return plans.filter((plan) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesDesc = plan.description?.toLowerCase().includes(q)
        const matchesDenom = String(plan.denomination).toLowerCase().includes(q)
        const matchesOperator = plan.operator?.toLowerCase().includes(q)
        const matchesSno = String(plan.sno).toLowerCase().includes(q)
        if (!matchesDesc && !matchesDenom && !matchesOperator && !matchesSno) {
          return false
        }
      }

      // Circle filter
      if (selectedCircle !== 'all') {
        const matchCircle =
          String(plan.circle).toLowerCase() === selectedCircle.toLowerCase()
        if (!matchCircle) return false
      }

      // Type filter
      if (selectedType !== 'all') {
        const matchType =
          String(plan.type).toLowerCase() === selectedType.toLowerCase()
        if (!matchType) return false
      }

      return true
    })
  }, [plans, searchQuery, selectedCircle, selectedType])

  const paginatedPlans = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredPlans.slice(start, start + pageSize)
  }, [filteredPlans, page, pageSize])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCircle('all')
    setSelectedType('all')
    setPage(1)
  }

  const currentUser = useAuthStore((state) => state.user)

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingPlan) return

    try {
      await deletePlanMutation.mutateAsync({
        sno: deletingPlan.sno,
        username: currentUser?.username,
      })
      toast.add?.({
        title: 'Plan Deleted',
        description: `Plan ${deletingPlan.sno} deleted successfully`,
        type: 'success',
      })
      setDeletingPlan(null)
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to delete plan'
      toast.add?.({
        title: 'Delete Failed',
        description: msg,
        type: 'error',
      })
    }
  }

  // Table Columns
  const columns: DataTableColumn<Plan>[] = [
    {
      id: 'sno',
      header: 'Plan ID / S.No',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-900 font-heading">
            {item.sno}
          </span>
          <span className="text-[10px] text-slate-500">{item.tab_name}</span>
        </div>
      ),
    },
    {
      id: 'operator',
      header: 'Operator & Circle',
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[11px] font-semibold bg-slate-50 text-slate-700">
            {item.operator}
          </Badge>
          <Badge variant="outline" className="text-[11px] border-blue-200 bg-blue-50 text-blue-700 font-semibold">
            {item.circle}
          </Badge>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Plan Type',
      cell: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200/70">
          {item.type}
        </span>
      ),
    },
    {
      id: 'denomination',
      header: 'MRP / Talk Value',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900">₹{item.denomination}</span>
          <span className="text-[10px] text-slate-500">TV: ₹{item.talkvalue}</span>
        </div>
      ),
    },
    {
      id: 'validity',
      header: 'Validity',
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs text-slate-700">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{item.validity === '0' || item.validity === 0 ? 'NA / TopUp' : `${item.validity} Days`}</span>
        </div>
      ),
    },
    {
      id: 'dates',
      header: 'Effective Schedule',
      cell: (item) => (
        <div className="flex items-center gap-1 text-[11px] text-slate-600">
          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
          <span>{item.start_date} to {item.end_date}</span>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (item) => (
        <p className="text-xs text-slate-600 line-clamp-1 max-w-xs" title={item.description}>
          {item.description}
        </p>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status || 'Active'} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-slate-200 hover:bg-slate-100 text-slate-700"
            onClick={() => setEditingPlan(item)}
            data-testid={`btn-edit-plan-${item.sno}`}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700"
            onClick={() => setDeletingPlan(item)}
            data-testid={`btn-delete-plan-${item.sno}`}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PermissionGuard
      permission="plansNumberpermissions"
      fallback={
        <div className="p-8 text-center bg-white border border-slate-200 rounded-lg shadow-xs max-w-xl mx-auto mt-8">
          <Shield className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-slate-900 font-heading mb-1">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500">
            You do not possess the required <code className="text-slate-700">plansNumberpermissions</code> grant to manage product plans and number configurations.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="plans-page">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Plans & Number Configuration
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                Tariff Catalog
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Administer product plans, voucher denominations, MNP tables, and telecom series prefixes.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shadow-xs"
            data-testid="add-plan-btn"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Plan
          </Button>
        </div>

        {/* Navigation Tabs */}
        <PlansNavigation activeTab="plans" />

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
          <SearchToolbar
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val)
              setPage(1)
            }}
            placeholder="Search by plan ID, denomination, operator, description..."
            onReset={handleResetFilters}
            showResetButton={Boolean(
              searchQuery || selectedCircle !== 'all' || selectedType !== 'all'
            )}
            data-testid="plan-search-toolbar"
          >
            {/* Circle Filter */}
            <div className="w-40">
              <Select
                value={selectedCircle}
                onValueChange={(val) => {
                  setSelectedCircle(val ?? 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger
                  className="h-9 text-xs bg-white border-slate-200 text-slate-800"
                  data-testid="filter-circle-select"
                >
                  <SelectValue placeholder="All Circles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Circles</SelectItem>
                  {circles.map((c) => (
                    <SelectItem key={c.circleId} value={String(c.circleId)}>
                      {c.circleName}
                    </SelectItem>
                  ))}
                  {circles.length === 0 && (
                    <>
                      <SelectItem value="AP">AP</SelectItem>
                      <SelectItem value="TS">TS</SelectItem>
                      <SelectItem value="TN">TN</SelectItem>
                      <SelectItem value="DL">DL</SelectItem>
                      <SelectItem value="MH">MH</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="w-36">
              <Select
                value={selectedType}
                onValueChange={(val) => {
                  setSelectedType(val ?? 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger
                  className="h-9 text-xs bg-white border-slate-200 text-slate-800"
                  data-testid="filter-type-select"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="STV">STV</SelectItem>
                  <SelectItem value="Unlimited">Unlimited</SelectItem>
                  <SelectItem value="Prepaid">Prepaid</SelectItem>
                  <SelectItem value="TopUp">TopUp</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SearchToolbar>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedPlans}
          totalCount={filteredPlans.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyMessage="No product plans matched your search and filter criteria."
          data-testid="plans-data-table"
        />

        {/* Add Plan Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Add New Product Plan
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Define operator tariffs, pricing denominations, validity durations, and regional schedule bounds.
              </DialogDescription>
            </DialogHeader>

            <PlanForm
              onSuccess={() => {
                setIsAddOpen(false)
                refetch()
              }}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={Boolean(editingPlan)} onOpenChange={(open) => !open && setEditingPlan(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Edit Plan — {editingPlan?.sno}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Update parameters for this product plan. Modifying active plans requires OTP authorization.
              </DialogDescription>
            </DialogHeader>

            {editingPlan && (
              <PlanForm
                initialData={editingPlan}
                onSuccess={() => {
                  setEditingPlan(null)
                  refetch()
                }}
                onCancel={() => setEditingPlan(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={Boolean(deletingPlan)}
          onOpenChange={(open) => !open && setDeletingPlan(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Product Plan?"
          description={
            <span>
              Are you sure you want to permanently delete plan "{deletingPlan?.sno}" ({deletingPlan?.operator} ₹{deletingPlan?.denomination})? This will discontinue the recharge tariff.
            </span>
          }
          confirmText="Delete Plan"
          destructive={true}
          loading={deletePlanMutation.isPending}
        />
      </div>
    </PermissionGuard>
  )
}
