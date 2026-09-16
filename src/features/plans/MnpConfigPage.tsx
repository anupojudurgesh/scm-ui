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
  useMnpListQuery,
  useSaveMnpMutation,
  useModifyMnpMutation,
  useDeleteMnpMutation,
  type MnpRecord,
} from '@/api/plan.api'
import { mnpSchema, type MnpFormValues } from '@/schemas/plan.schema'
import { ArrowLeftRight, Plus, Edit2, Trash2, Shield, Phone } from 'lucide-react'

import { PlansNavigation } from './PlansNavigation'

export function MnpConfigPage() {
  const currentUser = useAuthStore((state) => state.user)
  const targetMsisdn = (currentUser as { mobileNumber?: string })?.mobileNumber || '9876543210'

  // Queries
  const { data: mnpRecords = [], isLoading, error, refetch } = useMnpListQuery()
  const { data: circles = [] } = useAllCirclesQuery()

  const saveMnpMutation = useSaveMnpMutation()
  const modifyMnpMutation = useModifyMnpMutation()
  const deleteMnpMutation = useDeleteMnpMutation()

  // Filter States
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCircleId, setSelectedCircleId] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  // Modal / Action States
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingRecord, setEditingRecord] = React.useState<MnpRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = React.useState<MnpRecord | null>(null)

  // OTP States
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [activeTopic, setActiveTopic] = React.useState<'ADD MNP' | 'ModifyMnp' | 'DeleteMnp'>('ADD MNP')
  const [activeActionName, setActiveActionName] = React.useState('Add MNP Entry')
  const [pendingPayload, setPendingPayload] = React.useState<MnpFormValues | MnpRecord | null>(null)

  // Form
  const form = useForm<MnpFormValues>({
    resolver: zodResolver(mnpSchema),
    defaultValues: {
      msisdn: '',
      recipientNo: '',
      circleId: '',
      username: currentUser?.username || 'admin_user',
    },
  })

  // Filtering
  const filteredRecords = React.useMemo(() => {
    return mnpRecords.filter((rec) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesMsisdn = rec.msisdn.includes(q)
        const matchesRecipient = rec.recipientNo.includes(q)
        if (!matchesMsisdn && !matchesRecipient) return false
      }

      if (selectedCircleId !== 'all') {
        if (String(rec.circleId) !== selectedCircleId) return false
      }

      return true
    })
  }, [mnpRecords, searchQuery, selectedCircleId])

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, page, pageSize])

  // Handlers
  const handleOpenAdd = () => {
    form.reset({
      msisdn: '',
      recipientNo: '',
      circleId: '',
      username: currentUser?.username || 'admin_user',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (rec: MnpRecord) => {
    setEditingRecord(rec)
    form.reset({
      msisdn: rec.msisdn,
      recipientNo: rec.recipientNo,
      circleId: rec.circleId,
      username: currentUser?.username || 'admin_user',
    })
  }

  const handleFormSubmit = form.handleSubmit((values) => {
    if (editingRecord) {
      setActiveTopic('ModifyMnp')
      setActiveActionName(`Modify MNP Entry (${values.msisdn})`)
    } else {
      setActiveTopic('ADD MNP')
      setActiveActionName('Add MNP Entry')
    }
    setPendingPayload(values)
    setIsOtpOpen(true)
  })

  const handleDeleteClick = (rec: MnpRecord) => {
    setDeletingRecord(rec)
  }

  const handleConfirmDeletePrompt = () => {
    if (!deletingRecord) return
    setActiveTopic('DeleteMnp')
    setActiveActionName(`Delete MNP Entry (${deletingRecord.msisdn})`)
    setPendingPayload(deletingRecord)
    setIsOtpOpen(true)
  }

  const handleOtpVerified = async () => {
    if (!pendingPayload) return

    try {
      if (activeTopic === 'ADD MNP') {
        await saveMnpMutation.mutateAsync({
          msisdn: (pendingPayload as MnpFormValues).msisdn,
          recipientNo: (pendingPayload as MnpFormValues).recipientNo,
          circleId: Number((pendingPayload as MnpFormValues).circleId),
          username: currentUser?.username || 'admin_user',
        })
        toast.add?.({
          title: 'MNP Saved',
          description: 'MNP entry saved successfully',
          type: 'success',
        })
        setIsAddOpen(false)
      } else if (activeTopic === 'ModifyMnp') {
        await modifyMnpMutation.mutateAsync({
          msisdn: (pendingPayload as MnpFormValues).msisdn,
          recipientNo: (pendingPayload as MnpFormValues).recipientNo,
          circleId: Number((pendingPayload as MnpFormValues).circleId),
          username: currentUser?.username || 'admin_user',
        })
        toast.add?.({
          title: 'MNP Modified',
          description: 'MNP entry modified successfully',
          type: 'success',
        })
        setEditingRecord(null)
      } else if (activeTopic === 'DeleteMnp') {
        const target = pendingPayload as MnpRecord
        await deleteMnpMutation.mutateAsync({
          msisdn: target.msisdn,
          recipientNo: target.recipientNo,
          circleId: Number(target.circleId),
          username: currentUser?.username || 'admin_user',
        })
        toast.add?.({
          title: 'MNP Deleted',
          description: 'MNP entry deleted successfully',
          type: 'success',
        })
        setDeletingRecord(null)
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
  const columns: DataTableColumn<MnpRecord>[] = [
    {
      id: 'msisdn',
      header: 'Target MSISDN',
      cell: (item) => (
        <div className="flex items-center gap-1.5 font-medium text-xs text-slate-900">
          <Phone className="h-3 w-3 text-slate-400" />
          <span>{item.msisdn}</span>
        </div>
      ),
    },
    {
      id: 'recipientNo',
      header: 'Recipient Routing No',
      cell: (item) => (
        <span className="font-semibold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {item.recipientNo}
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
      id: 'username',
      header: 'Configured By',
      cell: (item) => (
        <span className="text-xs text-slate-500">{item.username || 'System'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status || 'Ported In'} />,
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
            data-testid={`btn-edit-mnp-${item.msisdn}`}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700"
            onClick={() => handleDeleteClick(item)}
            data-testid={`btn-delete-mnp-${item.msisdn}`}
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
            You do not possess the required <code className="text-slate-700">plansNumberpermissions</code> grant to manage MNP routing.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="mnp-page">
        {/* Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Mobile Number Portability (MNP)
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                Porting Gateway
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Administer recipient routing codes and circle mapping for ported mobile subscribers.
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 shadow-xs"
            data-testid="add-mnp-btn"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add MNP Entry
          </Button>
        </div>

        {/* Navigation Tabs */}
        <PlansNavigation activeTab="mnp" />

        {/* Search & Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
          <SearchToolbar
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val)
              setPage(1)
            }}
            placeholder="Search by 10-digit MSISDN or recipient routing code..."
            onReset={() => {
              setSearchQuery('')
              setSelectedCircleId('all')
              setPage(1)
            }}
            showResetButton={Boolean(searchQuery || selectedCircleId !== 'all')}
            data-testid="mnp-search-toolbar"
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
          totalCount={filteredRecords.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyMessage="No MNP routing records found."
          data-testid="mnp-data-table"
        />

        {/* Add MNP Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-purple-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Add MNP Routing Entry
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Register a mobile subscriber porting record. Action is OTP-protected with topic <code className="text-slate-700">ADD MNP</code>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-3" data-testid="mnp-add-form">
              <div className="space-y-1">
                <Label htmlFor="msisdn" className="text-xs font-medium">
                  Subscriber MSISDN (10 Digits) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="msisdn"
                  placeholder="9440012345"
                  maxLength={10}
                  {...form.register('msisdn')}
                  className="h-8 text-xs"
                  data-testid="input-mnp-msisdn"
                />
                {form.formState.errors.msisdn && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.msisdn.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="recipientNo" className="text-xs font-medium">
                  Recipient Routing Code <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="recipientNo"
                  placeholder="e.g. 40401"
                  {...form.register('recipientNo')}
                  className="h-8 text-xs"
                  data-testid="input-mnp-recipient"
                />
                {form.formState.errors.recipientNo && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.recipientNo.message}
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
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 shadow-xs"
                  data-testid="submit-mnp-btn"
                >
                  Add MNP (OTP)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit MNP Dialog */}
        <Dialog open={Boolean(editingRecord)} onOpenChange={(open) => !open && setEditingRecord(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-purple-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Modify MNP Entry — {editingRecord?.msisdn}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Update recipient routing parameters. Action is OTP-protected with topic <code className="text-slate-700">ModifyMnp</code>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-3" data-testid="mnp-edit-form">
              <div className="space-y-1">
                <Label htmlFor="edit-msisdn" className="text-xs font-medium">
                  Subscriber MSISDN
                </Label>
                <Input
                  id="edit-msisdn"
                  readOnly
                  disabled
                  value={editingRecord?.msisdn || ''}
                  className="h-8 text-xs bg-slate-100"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-recipientNo" className="text-xs font-medium">
                  Recipient Routing Code <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-recipientNo"
                  placeholder="e.g. 40401"
                  {...form.register('recipientNo')}
                  className="h-8 text-xs"
                  data-testid="input-edit-mnp-recipient"
                />
                {form.formState.errors.recipientNo && (
                  <p className="text-[11px] text-rose-600">
                    {form.formState.errors.recipientNo.message}
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRecord(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 shadow-xs"
                  data-testid="submit-edit-mnp-btn"
                >
                  Update MNP (OTP)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={Boolean(deletingRecord)}
          onOpenChange={(open) => !open && setDeletingRecord(null)}
          onConfirm={handleConfirmDeletePrompt}
          title="Delete MNP Routing Rule?"
          description={
            <span>
              Are you sure you want to delete the MNP routing record for subscriber "{deletingRecord?.msisdn}"? You will be prompted for OTP validation under topic "DeleteMnp".
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
