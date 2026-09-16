import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DataTable, type DataTableColumn } from '@/components/tables/DataTable'
import { SearchToolbar } from '@/components/tables/SearchToolbar'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useAllCirclesQuery } from '@/api/masterdata.api'
import {
  useNumberSeriesListQuery,
  useAddNumberSeriesMutation,
  useEditNumberSeriesMutation,
  usePurgeNumberSeriesMutation,
  type NumberSeries,
} from '@/api/plan.api'
import { numberSeriesSchema, type NumberSeriesFormValues } from '@/schemas/plan.schema'
import { Hash, Plus, Edit2, Trash2, Shield } from 'lucide-react'

import { PlansNavigation } from './PlansNavigation'

export function NumberSeriesPage() {
  const currentUser = useAuthStore((state) => state.user)
  const targetMsisdn = (currentUser as { mobileNumber?: string })?.mobileNumber || '9876543210'

  // Queries
  const { data: numberSeriesList = [], isLoading, error, refetch } = useNumberSeriesListQuery()
  const { data: circles = [] } = useAllCirclesQuery()

  const addSeriesMutation = useAddNumberSeriesMutation()
  const editSeriesMutation = useEditNumberSeriesMutation()
  const purgeSeriesMutation = usePurgeNumberSeriesMutation()

  // Filter States
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCircleId, setSelectedCircleId] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  // Modal / Action States
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingSeries, setEditingSeries] = React.useState<NumberSeries | null>(null)
  const [purgingSeries, setPurgingSeries] = React.useState<NumberSeries | null>(null)

  // OTP States
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [activeTopic, setActiveTopic] = React.useState<
    'AddnumberSeries' | 'ModfifynumberSeries' | 'DeleteNumberseries'
  >('AddnumberSeries')
  const [activeActionName, setActiveActionName] = React.useState('Add Number Series')
  const [pendingPayload, setPendingPayload] = React.useState<NumberSeriesFormValues | NumberSeries | null>(null)

  // Form
  const form = useForm<NumberSeriesFormValues>({
    resolver: zodResolver(numberSeriesSchema),
    defaultValues: {
      numberSeries: '',
      circleId: '',
      inId: '101',
      numberSeriesId: '',
      username: currentUser?.username || 'admin_user',
    },
  })

  // Filtering
  const filteredSeries = React.useMemo(() => {
    return numberSeriesList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesSeries = item.numberSeries.includes(q)
        const matchesId = String(item.numberSeriesId).toLowerCase().includes(q)
        if (!matchesSeries && !matchesId) return false
      }

      if (selectedCircleId !== 'all') {
        if (String(item.circleId) !== selectedCircleId) return false
      }

      return true
    })
  }, [numberSeriesList, searchQuery, selectedCircleId])

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredSeries.slice(start, start + pageSize)
  }, [filteredSeries, page, pageSize])

  // Handlers
  const handleOpenAdd = () => {
    form.reset({
      numberSeries: '',
      circleId: '',
      inId: '101',
      numberSeriesId: `SER-${Date.now().toString().slice(-4)}`,
      username: currentUser?.username || 'admin_user',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (series: NumberSeries) => {
    setEditingSeries(series)
    form.reset({
      numberSeries: series.numberSeries,
      circleId: series.circleId,
      inId: String(series.inId),
      numberSeriesId: String(series.numberSeriesId || ''),
      username: currentUser?.username || 'admin_user',
    })
  }

  const handleFormSubmit = form.handleSubmit((values) => {
    if (editingSeries) {
      setActiveTopic('ModfifynumberSeries')
      setActiveActionName(`Edit Number Series (${values.numberSeries})`)
    } else {
      setActiveTopic('AddnumberSeries')
      setActiveActionName('Add Number Series')
    }
    setPendingPayload(values)
    setIsOtpOpen(true)
  })

  const handlePurgeClick = (series: NumberSeries) => {
    setPurgingSeries(series)
  }

  const handleConfirmPurgePrompt = () => {
    if (!purgingSeries) return
    setActiveTopic('DeleteNumberseries')
    setActiveActionName(`Purge Number Series (${purgingSeries.numberSeries})`)
    setPendingPayload(purgingSeries)
    setIsOtpOpen(true)
  }

  const handleOtpVerified = async () => {
    if (!pendingPayload) return

    try {
      if (activeTopic === 'AddnumberSeries') {
        const p = pendingPayload as NumberSeriesFormValues
        await addSeriesMutation.mutateAsync({
          payload: {
            circleId: Number(p.circleId),
            numberSeries: p.numberSeries,
            numberSeriesId: p.numberSeriesId || p.numberSeries,
            inId: Number(p.inId),
            username: currentUser?.username || 'admin_user',
          },
          username: currentUser?.username,
        })
        toast.add?.({
          title: 'Series Added',
          description: 'Number series added successfully',
          type: 'success',
        })
        setIsAddOpen(false)
      } else if (activeTopic === 'ModfifynumberSeries') {
        const p = pendingPayload as NumberSeriesFormValues
        await editSeriesMutation.mutateAsync({
          payload: {
            circleId: Number(p.circleId),
            numberSeries: p.numberSeries,
            numberSeriesId: p.numberSeriesId || p.numberSeries,
            inId: Number(p.inId),
            username: currentUser?.username || 'admin_user',
          },
          username: currentUser?.username,
        })
        toast.add?.({
          title: 'Series Updated',
          description: 'Number series updated successfully',
          type: 'success',
        })
        setEditingSeries(null)
      } else if (activeTopic === 'DeleteNumberseries') {
        const target = pendingPayload as NumberSeries
        await purgeSeriesMutation.mutateAsync({
          series: target.numberSeries,
          username: currentUser?.username,
        })
        toast.add?.({
          title: 'Series Purged',
          description: 'Number series purged successfully',
          type: 'success',
        })
        setPurgingSeries(null)
      }

      setIsOtpOpen(false)
      setPendingPayload(null)
      form.reset()
      refetch()
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Operation failed'
      toast.add?.({
        title: 'Operation Failed',
        description: msg,
        type: 'error',
      })
    }
  }

  // Table Columns
  const columns: DataTableColumn<NumberSeries>[] = [
    {
      id: 'numberSeries',
      header: 'Series Prefix',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
            {item.numberSeries}
          </span>
          <span className="text-[10px] text-slate-500">ID: {item.numberSeriesId}</span>
        </div>
      ),
    },
    {
      id: 'circle',
      header: 'Circle Allocation',
      cell: (item) => (
        <span className="text-xs text-slate-700">
          {item.circleName || `Circle ${item.circleId}`}
        </span>
      ),
    },
    {
      id: 'inId',
      header: 'IN Platform Node',
      cell: (item) => (
        <span className="text-xs font-semibold text-blue-700">IN-{item.inId}</span>
      ),
    },
    {
      id: 'seqNo',
      header: 'Sequence',
      cell: (item) => (
        <span className="text-xs text-slate-500">#{item.seqNo || '1'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status || 'Allocated'} />,
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
            onClick={() => handleOpenEdit(item)}
            data-testid={`btn-edit-series-${item.numberSeries}`}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700"
            onClick={() => handlePurgeClick(item)}
            data-testid={`btn-purge-series-${item.numberSeries}`}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Purge
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
            You do not possess the required <code className="text-slate-700">plansNumberpermissions</code> grant to manage number series.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="number-series-page">
        {/* Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Number Series Management
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                IN Routing
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Allocate and manage Intelligent Network (IN) subscriber number series ranges across circles.
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 shadow-xs"
            data-testid="add-series-btn"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Number Series
          </Button>
        </div>

        {/* Navigation Tabs */}
        <PlansNavigation activeTab="number-series" />

        {/* Search & Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
          <SearchToolbar
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val)
              setPage(1)
            }}
            placeholder="Search by series prefix or series ID..."
            onReset={() => {
              setSearchQuery('')
              setSelectedCircleId('all')
              setPage(1)
            }}
            showResetButton={Boolean(searchQuery || selectedCircleId !== 'all')}
            data-testid="series-search-toolbar"
          >
            <div className="w-44">
              <Select
                value={selectedCircleId}
                onValueChange={(val) => {
                  setSelectedCircleId(val ?? 'all')
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
                      <SelectItem value="1">AP (Andhra Pradesh)</SelectItem>
                      <SelectItem value="2">TS (Telangana)</SelectItem>
                      <SelectItem value="3">TN (Tamil Nadu)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </SearchToolbar>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedData}
          totalCount={filteredSeries.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyMessage="No number series records found."
          data-testid="series-data-table"
        />

        {/* Add Series Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-amber-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Add Telecom Number Series
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Allocate a subscriber numbering range. Action is OTP-protected with topic <code className="text-slate-700">AddnumberSeries</code>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-3" data-testid="series-add-form">
              <div className="space-y-1">
                <Label htmlFor="numberSeries" className="text-xs font-medium">
                  Series Prefix (3-10 Digits) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="numberSeries"
                  placeholder="e.g. 94400"
                  {...form.register('numberSeries')}
                  className="h-8 text-xs font-mono"
                  data-testid="input-series-prefix"
                />
                {form.formState.errors.numberSeries && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.numberSeries.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="circleId" className="text-xs font-medium">
                  Circle <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="circleId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="circleId"
                        className="h-8 text-xs bg-white"
                        data-testid="select-circle-trigger"
                      >
                        <SelectValue placeholder="Select Circle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {circles.map((c) => (
                          <SelectItem key={c.circleId} value={String(c.circleId)}>
                            {c.circleName}
                          </SelectItem>
                        ))}
                        {circles.length === 0 && (
                          <>
                            <SelectItem value="1">Andhra Pradesh (AP)</SelectItem>
                            <SelectItem value="2">Telangana (TS)</SelectItem>
                            <SelectItem value="3">Tamil Nadu (TN)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.circleId && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.circleId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="inId" className="text-xs font-medium">
                  IN Platform Node ID <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="inId"
                  placeholder="e.g. 101"
                  {...form.register('inId')}
                  className="h-8 text-xs"
                  data-testid="input-series-inid"
                />
                {form.formState.errors.inId && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.inId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="numberSeriesId" className="text-xs font-medium">
                  Series Identifier (Optional)
                </Label>
                <Input
                  id="numberSeriesId"
                  placeholder="e.g. SER-94400"
                  {...form.register('numberSeriesId')}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 shadow-xs"
                  data-testid="submit-series-btn"
                >
                  Add Series (OTP)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Series Dialog */}
        <Dialog open={Boolean(editingSeries)} onOpenChange={(open) => !open && setEditingSeries(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-amber-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Edit Number Series — {editingSeries?.numberSeries}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Update series routing parameters. Action is OTP-protected with topic <code className="text-slate-700">ModfifynumberSeries</code>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-3" data-testid="series-edit-form">
              <div className="space-y-1">
                <Label htmlFor="edit-numberSeries" className="text-xs font-medium">
                  Series Prefix <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-numberSeries"
                  {...form.register('numberSeries')}
                  className="h-8 text-xs font-mono"
                  data-testid="input-edit-series-prefix"
                />
                {form.formState.errors.numberSeries && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.numberSeries.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-circleId" className="text-xs font-medium">
                  Circle <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="circleId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="edit-circleId"
                        className="h-8 text-xs bg-white"
                        data-testid="select-edit-circle-trigger"
                      >
                        <SelectValue placeholder="Select Circle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {circles.map((c) => (
                          <SelectItem key={c.circleId} value={String(c.circleId)}>
                            {c.circleName}
                          </SelectItem>
                        ))}
                        {circles.length === 0 && (
                          <>
                            <SelectItem value="1">Andhra Pradesh (AP)</SelectItem>
                            <SelectItem value="2">Telangana (TS)</SelectItem>
                            <SelectItem value="3">Tamil Nadu (TN)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-inId" className="text-xs font-medium">
                  IN Platform Node ID <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-inId"
                  {...form.register('inId')}
                  className="h-8 text-xs"
                  data-testid="input-edit-series-inid"
                />
                {form.formState.errors.inId && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.inId.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSeries(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 shadow-xs"
                  data-testid="submit-edit-series-btn"
                >
                  Update Series (OTP)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Purge Confirmation Dialog */}
        <ConfirmationDialog
          open={Boolean(purgingSeries)}
          onOpenChange={(open) => !open && setPurgingSeries(null)}
          onConfirm={handleConfirmPurgePrompt}
          title="Purge Number Series Allocation?"
          description={
            <span>
              Are you sure you want to permanently purge series prefix "{purgingSeries?.numberSeries}"? Action is irreversible and requires OTP validation under topic "DeleteNumberseries".
            </span>
          }
          confirmText="Proceed to OTP"
          destructive={true}
        />

        {/* OTP Verification Modal */}
        <OTPVerificationModal
          open={isOtpOpen}
          onOpenChange={(open) => {
            setIsOtpOpen(open)
            if (!open) setPendingPayload(null)
          }}
          onVerified={handleOtpVerified}
          topic={activeTopic}
          msisdn={targetMsisdn}
          actionName={activeActionName}
        />
      </div>
    </PermissionGuard>
  )
}
