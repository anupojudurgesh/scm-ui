import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DataTable, type DataTableColumn } from '@/components/tables/DataTable'
import { SearchToolbar } from '@/components/tables/SearchToolbar'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  useDenominationsQuery,
  useSaveDenominationMutation,
  type Denomination,
  type SaveDenominationPayload,
} from '@/api/plan.api'
import {
  denominationSchema,
  type DenominationFormValues,
} from '@/schemas/plan.schema'
import { Coins, Plus, Shield, Loader2, Clock } from 'lucide-react'

import { PlansNavigation } from './PlansNavigation'

export function DenominationConfigPage() {
  const currentUser = useAuthStore((state) => state.user)
  const targetMsisdn = (currentUser as { mobileNumber?: string })?.mobileNumber || '9876543210'

  // Queries
  const { data: denominations = [], isLoading, error, refetch } = useDenominationsQuery()
  const { data: circles = [] } = useAllCirclesQuery()
  const saveDenomMutation = useSaveDenominationMutation()

  // Filter States
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCircleId, setSelectedCircleId] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  // Modal & OTP States
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [pendingPayload, setPendingPayload] = React.useState<DenominationFormValues | null>(null)

  // React Hook Form
  const form = useForm<DenominationFormValues>({
    resolver: zodResolver(denominationSchema),
    defaultValues: {
      rechargePlanName: '',
      planType: 'STV',
      price: '',
      createdBy: currentUser?.username || 'admin_user',
      validity: '28',
      description: '',
      bundleName: 'Unlimited',
      bucketId: '1',
      faceValue: '',
      netValue: '',
      cardGroup: '1',
      varepDenom: '0',
      circleId: '',
      vasDenom: '0',
      varepGroup: 'General',
    },
  })

  // Filtering
  const filteredDenominations = React.useMemo(() => {
    return denominations.filter((d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = d.rechargePlanName?.toLowerCase().includes(q)
        const matchesType = d.planType?.toLowerCase().includes(q)
        const matchesPrice = String(d.price).includes(q)
        if (!matchesName && !matchesType && !matchesPrice) return false
      }

      if (selectedCircleId !== 'all') {
        if (String(d.circleId) !== selectedCircleId) return false
      }

      return true
    })
  }, [denominations, searchQuery, selectedCircleId])

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredDenominations.slice(start, start + pageSize)
  }, [filteredDenominations, page, pageSize])

  const handleFormSubmit = form.handleSubmit((values) => {
    setPendingPayload(values)
    setIsOtpOpen(true)
  })

  const handleOtpVerified = async () => {
    if (!pendingPayload) return

    try {
      await saveDenomMutation.mutateAsync({
        ...pendingPayload,
        price: Number(pendingPayload.price),
        validity: Number(pendingPayload.validity),
        faceValue: Number(pendingPayload.faceValue),
        netValue: Number(pendingPayload.netValue),
        bucketId: Number(pendingPayload.bucketId),
        cardGroup: Number(pendingPayload.cardGroup),
        varepDenom: Number(pendingPayload.varepDenom),
        circleId: Number(pendingPayload.circleId),
        vasDenom: Number(pendingPayload.vasDenom),
      } as SaveDenominationPayload)

      toast.add?.({
        title: 'Denomination Saved',
        description: 'Denomination voucher configured successfully',
        type: 'success',
      })
      setIsOtpOpen(false)
      setIsModalOpen(false)
      setPendingPayload(null)
      form.reset()
      refetch()
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to save denomination'
      toast.add?.({
        title: 'Configuration Failed',
        description: msg,
        type: 'error',
      })
    }
  }

  // Table Columns
  const columns: DataTableColumn<Denomination>[] = [
    {
      id: 'rechargePlanName',
      header: 'Voucher / Plan Name',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-900 font-heading">
            {item.rechargePlanName}
          </span>
          <span className="text-[10px] text-slate-500">ID: {item.id}</span>
        </div>
      ),
    },
    {
      id: 'planType',
      header: 'Plan Type',
      cell: (item) => (
        <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-700">
          {item.planType}
        </Badge>
      ),
    },
    {
      id: 'price',
      header: 'Price (₹)',
      cell: (item) => (
        <span className="text-xs font-bold text-slate-900">₹{item.price}</span>
      ),
    },
    {
      id: 'validity',
      header: 'Validity',
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs text-slate-700">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{item.validity === '0' || item.validity === 0 ? 'Unlimited/NA' : `${item.validity} Days`}</span>
        </div>
      ),
    },
    {
      id: 'values',
      header: 'Face / Net Value',
      cell: (item) => (
        <span className="text-xs text-slate-700">
          ₹{item.faceValue} / ₹{item.netValue}
        </span>
      ),
    },
    {
      id: 'circle',
      header: 'Circle',
      cell: (item) => (
        <span className="text-xs text-slate-700">
          {item.circleName || `Circle ${item.circleId}`}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status || 'Active'} />,
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
            You do not possess the required <code className="text-slate-700">plansNumberpermissions</code> grant to configure denominations.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="denominations-page">
        {/* Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Denomination Configuration
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Recharge Matrix
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Define recharge vouchers, price denominations, bucket groups, and VAS values.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              form.reset()
              setIsModalOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-xs"
            data-testid="add-denom-btn"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Denomination
          </Button>
        </div>

        {/* Navigation Tabs */}
        <PlansNavigation activeTab="denominations" />

        {/* Search & Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
          <SearchToolbar
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val)
              setPage(1)
            }}
            placeholder="Search by voucher name, plan type, price..."
            onReset={() => {
              setSearchQuery('')
              setSelectedCircleId('all')
              setPage(1)
            }}
            showResetButton={Boolean(searchQuery || selectedCircleId !== 'all')}
            data-testid="denom-search-toolbar"
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
          totalCount={filteredDenominations.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyMessage="No denomination slabs found."
          data-testid="denominations-data-table"
        />

        {/* Add Denomination Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Configure Recharge Denomination
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Register a new voucher denomination slab. Submitting requires OTP verification under topic <code className="text-slate-700">Denominationconfiguration</code>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-4" data-testid="denomination-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rechargePlanName" className="text-xs font-medium">
                    Plan / Voucher Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="rechargePlanName"
                    placeholder="e.g. STV 199 Unlimited"
                    {...form.register('rechargePlanName')}
                    className="h-8 text-xs"
                    data-testid="input-denom-name"
                  />
                  {form.formState.errors.rechargePlanName && (
                    <p className="text-[11px] text-rose-600">
                      {form.formState.errors.rechargePlanName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="planType" className="text-xs font-medium">
                    Plan Type <span className="text-rose-500">*</span>
                  </Label>
                  <Controller
                    name="planType"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denom-type">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STV">STV</SelectItem>
                          <SelectItem value="Data">Data</SelectItem>
                          <SelectItem value="TopUp">TopUp</SelectItem>
                          <SelectItem value="Unlimited">Unlimited</SelectItem>
                          <SelectItem value="Combo">Combo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="price" className="text-xs font-medium">
                    Price (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="any"
                    placeholder="199"
                    {...form.register('price')}
                    className="h-8 text-xs"
                    data-testid="input-denom-price"
                  />
                  {form.formState.errors.price && (
                    <p className="text-[11px] text-rose-600">
                      {form.formState.errors.price.message}
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
                  <Label htmlFor="validity" className="text-xs font-medium">
                    Validity (Days) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="validity"
                    type="number"
                    placeholder="28"
                    {...form.register('validity')}
                    className="h-8 text-xs"
                    data-testid="input-denom-validity"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bundleName" className="text-xs font-medium">
                    Bundle Group <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="bundleName"
                    placeholder="e.g. Unlimited"
                    {...form.register('bundleName')}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="faceValue" className="text-xs font-medium">
                    Face Value (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="faceValue"
                    type="number"
                    step="any"
                    placeholder="199"
                    {...form.register('faceValue')}
                    className="h-8 text-xs"
                    data-testid="input-denom-facevalue"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="netValue" className="text-xs font-medium">
                    Net Value (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="netValue"
                    type="number"
                    step="any"
                    placeholder="199"
                    {...form.register('netValue')}
                    className="h-8 text-xs"
                    data-testid="input-denom-netvalue"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs font-medium">
                  Description <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={2}
                  placeholder="Details on data allocation, talktime quotas, and benefits..."
                  {...form.register('description')}
                  className="text-xs"
                  data-testid="input-denom-desc"
                />
                {form.formState.errors.description && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saveDenomMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-xs"
                  data-testid="submit-denom-btn"
                >
                  {saveDenomMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Save Denomination (OTP)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* OTP Verification Modal */}
        <OTPVerificationModal
          open={isOtpOpen}
          onOpenChange={(open) => {
            setIsOtpOpen(open)
            if (!open) setPendingPayload(null)
          }}
          onVerified={handleOtpVerified}
          topic="Denominationconfiguration"
          msisdn={targetMsisdn}
          actionName="Save Denomination"
        />
      </div>
    </PermissionGuard>
  )
}
