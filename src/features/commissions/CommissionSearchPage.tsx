import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { DataTable, type DataTableColumn } from '@/components/tables/DataTable'
import { SearchToolbar } from '@/components/tables/SearchToolbar'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { PermissionGuard } from '@/components/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  useCategoriesQuery,
  useCommissionsQuery,
  useUpdateCommissionMutation,
  useUpdatePostpaidMutation,
  useUpdateLandlineMutation,
  useDeleteCommissionMutation,
  type CommissionItem,
  type CommissionTypeKey,
} from '@/api/commission.api'
import { useAllCirclesQuery } from '@/api/masterdata.api'
import {
  Edit2,
  Trash2,
  Plus,
  Shield,
  Layers,
  PhoneCall,
  Radio,
  Percent,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react'


export function CommissionSearchPage() {
  const currentUser = useAuthStore((state) => state.user)

  // Active Commission Type Tab
  const [activeType, setActiveType] = React.useState<CommissionTypeKey>('prepaid-frc')

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCircleId, setSelectedCircleId] = React.useState<string>('all')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>('all')
  const [denominationFilter, setDenominationFilter] = React.useState<string>('')

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useCategoriesQuery()
  const { data: circles = [], isLoading: isLoadingCircles } = useAllCirclesQuery()

  const resolvedFilters = React.useMemo(() => ({
    circleId: selectedCircleId !== 'all' ? selectedCircleId : undefined,
    categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
    denomination: denominationFilter.trim() ? denominationFilter.trim() : undefined,
  }), [selectedCircleId, selectedCategoryId, denominationFilter])

  const {
    data: commissions = [],
    isLoading,
    refetch,
  } = useCommissionsQuery(activeType, resolvedFilters)


  // Mutations
  const updateFrcMutation = useUpdateCommissionMutation()
  const updatePostpaidMutation = useUpdatePostpaidMutation()
  const updateLandlineMutation = useUpdateLandlineMutation()
  const deleteMutation = useDeleteCommissionMutation()

  // Row Action Modals State
  const [editingItem, setEditingItem] = React.useState<CommissionItem | null>(null)
  const [editFormData, setEditFormData] = React.useState<Record<string, string>>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  // Delete Action Modal State
  const [deletingItem, setDeletingItem] = React.useState<CommissionItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  // OTP Verification Modal State
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [otpTopic, setOtpTopic] = React.useState<string>('')
  const [otpActionName, setOtpActionName] = React.useState<string>('')
  const [pendingOtpAction, setPendingOtpAction] = React.useState<(() => Promise<void>) | null>(null)

  // Notification banners
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null)
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null)

  // Filter client-side search query
  const filteredCommissions = React.useMemo(() => {
    if (!searchQuery.trim()) return commissions
    const q = searchQuery.toLowerCase().trim()
    return commissions.filter((item) => {
      const matchCircle = String(item.circleName || item.circleId || '').toLowerCase().includes(q)
      const matchCategory = String(item.categoryName || item.categoryId || '').toLowerCase().includes(q)
      const matchDenom = String(item.denomination || '').toLowerCase().includes(q)
      const matchId = String(item.commissionId || '').toLowerCase().includes(q)
      const matchSeller = String(item.sellerCommission || item.actualCommission || '').toLowerCase().includes(q)
      return matchCircle || matchCategory || matchDenom || matchId || matchSeller
    })
  }, [commissions, searchQuery])

  // Open Edit Modal
  const handleOpenEdit = (item: CommissionItem) => {
    setEditingItem(item)
    setErrorBanner(null)
    setSuccessBanner(null)

    if (activeType === 'prepaid-frc' || activeType === 'prepaid-otf') {
      setEditFormData({
        circleId: String(item.circleId ?? ''),
        categoryId: String(item.categoryId ?? ''),
        denomination: String(item.denomination ?? ''),
        sellerCommission: String(item.sellerCommission ?? ''),
        fraCommission: String(item.fraCommission ?? ''),
        subCommission: String(item.subCommission ?? '0'),
        tds: String(item.tds ?? '5'),
      })
    } else if (activeType === 'postpaid') {
      setEditFormData({
        circleId: String(item.circleId ?? ''),
        categoryId: String(item.categoryId ?? ''),
        sellerLevel: String(item.sellerLevel ?? '1'),
        actualCommission: String(item.actualCommission ?? ''),
        tdsAmount: String(item.tdsAmount ?? ''),
        cap_limit: String(item.cap_limit ?? ''),
        fraCommission: String(item.fraCommission ?? ''),
      })
    } else if (activeType === 'landline') {
      setEditFormData({
        circleId: String(item.circleId ?? ''),
        categoryId: String(item.categoryId ?? ''),
        fromAmount: String(item.fromAmount ?? ''),
        toAmount: String(item.toAmount ?? ''),
        commissionAmount: String(item.commissionAmount ?? ''),
        tdsAmount: String(item.tdsAmount ?? ''),
        sellerLevel: String(item.sellerLevel ?? '1'),
      })
    }

    setIsEditDialogOpen(true)
  }

  // Handle Edit Form Submission -> Triggers OTP
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    // Determine exact OTP Topic based on activeType
    let topic = 'Modify_PrepaidFRC'
    let action = 'Modify Prepaid FRC Commission'

    if (activeType === 'prepaid-otf') {
      topic = 'Modify_PrepaidOTF'
      action = 'Modify Prepaid OTF Commission'
    } else if (activeType === 'postpaid') {
      topic = 'Modify_Postpaid'
      action = 'Modify Postpaid Commission'
    } else if (activeType === 'landline') {
      topic = 'Modify_Landline'
      action = 'Modify Landline Commission'
    }

    setOtpTopic(topic)
    setOtpActionName(action)
    setPendingOtpAction(() => async () => {
      try {
        if (activeType === 'prepaid-frc' || activeType === 'prepaid-otf') {
          await updateFrcMutation.mutateAsync({
            commissionId: editingItem.commissionId,
            circleId: editFormData.circleId || editingItem.circleId,
            categoryId: editFormData.categoryId || editingItem.categoryId,
            denomination: editFormData.denomination || editingItem.denomination,
            sellerCommission: editFormData.sellerCommission,
            fraCommission: editFormData.fraCommission,
            subCommission: editFormData.subCommission || '0',
            tds: editFormData.tds || '5',
            createdGuiUser: currentUser?.username || 'admin',
          })
        } else if (activeType === 'postpaid') {
          await updatePostpaidMutation.mutateAsync({
            commissionId: editingItem.commissionId,
            circleId: editFormData.circleId || editingItem.circleId,
            categoryId: editFormData.categoryId || editingItem.categoryId,
            sellerLevel: editFormData.sellerLevel || '1',
            actualCommission: editFormData.actualCommission,
            tdsAmount: editFormData.tdsAmount,
            cap_limit: editFormData.cap_limit,
            fraCommission: editFormData.fraCommission,
            createdGuiUser: currentUser?.username || 'admin',
          })
        } else if (activeType === 'landline') {
          await updateLandlineMutation.mutateAsync({
            commissionId: editingItem.commissionId,
            circleId: editFormData.circleId || editingItem.circleId,
            categoryId: editFormData.categoryId || editingItem.categoryId,
            fromAmount: editFormData.fromAmount,
            toAmount: editFormData.toAmount,
            commissionAmount: editFormData.commissionAmount,
            tdsAmount: editFormData.tdsAmount,
            sellerLevel: editFormData.sellerLevel || '1',
            createdGuiUser: currentUser?.username || 'admin',
          })
        }

        setIsEditDialogOpen(false)
        const msg = `Commission #${editingItem.commissionId} updated successfully.`
        setSuccessBanner(msg)
        try {
          toast.add?.({ title: 'Commission Updated', description: msg, type: 'success' })
        } catch {
          // Toast fallback
        }
        refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update commission configuration.'
        setErrorBanner(msg)
        try {
          toast.add?.({ title: 'Update Failed', description: msg, type: 'error' })
        } catch {
          // Toast fallback
        }
      }
    })

    setIsOtpOpen(true)
  }

  // Open Delete Confirmation Dialog
  const handleOpenDelete = (item: CommissionItem) => {
    setDeletingItem(item)
    setIsDeleteDialogOpen(true)
  }

  // Execute Deletion
  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    try {
      await deleteMutation.mutateAsync({
        type: activeType,
        commissionId: deletingItem.commissionId,
      })
      const msg = `Commission #${deletingItem.commissionId} has been deleted.`
      setSuccessBanner(msg)
      try {
        toast.add?.({ title: 'Commission Deleted', description: msg, type: 'success' })
      } catch {
        // Toast fallback
      }
      setIsDeleteDialogOpen(false)
      setDeletingItem(null)
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete commission.'
      setErrorBanner(msg)
      try {
        toast.add?.({ title: 'Delete Failed', description: msg, type: 'error' })
      } catch {
        // Toast fallback
      }
    }
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCircleId('all')
    setSelectedCategoryId('all')
    setDenominationFilter('')
  }

  // Define Columns dynamically per active commission type
  const columns: DataTableColumn<CommissionItem>[] = React.useMemo(() => {
    const commonCols: DataTableColumn<CommissionItem>[] = [
      {
        id: 'commissionId',
        header: 'ID',
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700 font-semibold" data-testid={`commission-id-${row.commissionId}`}>
            #{row.commissionId}
          </span>
        ),
      },
      {
        id: 'circle',
        header: 'Circle',
        cell: (row) => (
          <span className="text-xs font-medium text-slate-900">
            {row.circleName || `Circle ${row.circleId}`}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        cell: (row) => (
          <span className="text-xs text-slate-700">
            {row.categoryName || `Category ${row.categoryId}`}
          </span>
        ),
      },
    ]

    let specificCols: DataTableColumn<CommissionItem>[] = []

    if (activeType === 'prepaid-frc' || activeType === 'prepaid-otf') {
      specificCols = [
        {
          id: 'denomination',
          header: 'Denomination',
          cell: (row) => (
            <Badge variant="outline" className="font-mono text-xs bg-slate-50 text-slate-900 border-slate-200">
              ₹{row.denomination}
            </Badge>
          ),
        },
        {
          id: 'sellerCommission',
          header: 'Seller Comm.',
          cell: (row) => (
            <span className="text-xs font-semibold text-emerald-700">
              ₹{row.sellerCommission}
            </span>
          ),
        },
        {
          id: 'fraCommission',
          header: 'FRA Comm.',
          cell: (row) => (
            <span className="text-xs font-medium text-slate-700">
              ₹{row.fraCommission}
            </span>
          ),
        },
        {
          id: 'subCommission',
          header: 'Sub Comm.',
          cell: (row) => (
            <span className="text-xs text-slate-600">
              ₹{row.subCommission ?? '0'}
            </span>
          ),
        },
        {
          id: 'tds',
          header: 'TDS',
          cell: (row) => (
            <span className="text-xs text-slate-600">
              {row.tds}%
            </span>
          ),
        },
      ]
    } else if (activeType === 'postpaid') {
      specificCols = [
        {
          id: 'sellerLevel',
          header: 'Seller Level',
          cell: (row) => (
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-800">
              Level {row.sellerLevel}
            </Badge>
          ),
        },
        {
          id: 'actualCommission',
          header: 'Actual Comm.',
          cell: (row) => (
            <span className="text-xs font-semibold text-emerald-700">
              ₹{row.actualCommission}
            </span>
          ),
        },
        {
          id: 'tdsAmount',
          header: 'TDS Amount',
          cell: (row) => (
            <span className="text-xs text-slate-600">
              ₹{row.tdsAmount}
            </span>
          ),
        },
        {
          id: 'cap_limit',
          header: 'Cap Limit',
          cell: (row) => (
            <span className="text-xs text-slate-700">
              ₹{row.cap_limit}
            </span>
          ),
        },
      ]
    } else if (activeType === 'landline') {
      specificCols = [
        {
          id: 'range',
          header: 'Amount Range',
          cell: (row) => (
            <span className="text-xs font-mono font-medium text-slate-900">
              ₹{row.fromAmount} - ₹{row.toAmount}
            </span>
          ),
        },
        {
          id: 'commissionAmount',
          header: 'Comm. Amount',
          cell: (row) => (
            <span className="text-xs font-semibold text-emerald-700">
              ₹{row.commissionAmount}
            </span>
          ),
        },
        {
          id: 'tdsAmount',
          header: 'TDS',
          cell: (row) => (
            <span className="text-xs text-slate-600">
              ₹{row.tdsAmount ?? '0'}
            </span>
          ),
        },
        {
          id: 'sellerLevel',
          header: 'Seller Level',
          cell: (row) => (
            <span className="text-xs text-slate-700">
              Level {row.sellerLevel || '1'}
            </span>
          ),
        },
      ]
    }

    const actionCol: DataTableColumn<CommissionItem> = {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="h-7 px-2 text-xs text-cyan-700 border-slate-200 hover:bg-cyan-50 hover:border-cyan-300"
            data-testid={`edit-commission-btn-${row.commissionId}`}
            aria-label={`Edit commission ${row.commissionId}`}
          >
            <Edit2 className="h-3 w-3 mr-1 text-cyan-600" />
            Edit
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenDelete(row)}
            className="h-7 px-2 text-xs text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-300"
            data-testid={`delete-commission-btn-${row.commissionId}`}
            aria-label={`Delete commission ${row.commissionId}`}
          >
            <Trash2 className="h-3 w-3 mr-1 text-red-500" />
            Delete
          </Button>
        </div>
      ),
    }

    return [...commonCols, ...specificCols, actionCol]
  }, [activeType])

  return (
    <PermissionGuard
      permission="commissionPermissions"
      fallback={
        <div
          className="p-8 max-w-lg mx-auto mt-12 text-center rounded-lg border border-slate-200 bg-white space-y-3"
          data-testid="commission-search-permission-denied"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500">
            You do not possess the required <code className="text-slate-700">commissionPermissions</code> grant to search or manage commission slabs.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="commission-search-page">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Commission Search & Management
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                Live Directory
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Filter, inspect, modify configurations, and remove commission slabs across services.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/commissions">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-100"
                data-testid="configure-new-commission-link"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-slate-500" />
                Configure New
              </Button>
            </Link>

            <Link to="/commissions/franchise-balance">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-100"
                data-testid="franchise-balance-link"
              >
                <Building2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
                Franchise Add Balance
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback Banners */}
        {successBanner && (
          <div
            className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-800"
            data-testid="commission-search-success-banner"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {errorBanner && (
          <div
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-800"
            data-testid="commission-search-error-banner"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Service Type Switcher (Modern Line-Bar Tabs) */}
        <div className="border-b border-slate-200">
          <Tabs
            value={activeType}
            onValueChange={(val) => {
              if (val) {
                setActiveType(val as CommissionTypeKey)
                setSearchQuery('')
              }
            }}
            className="w-full"
            data-testid="commission-search-tabs"
          >
            <TabsList variant="line" className="gap-6 bg-transparent p-0">
              <TabsTrigger
                value="prepaid-frc"
                data-testid="tab-prepaid-frc"
                className="gap-2 px-1 text-xs sm:text-sm font-medium"
              >
                <Percent className="h-3.5 w-3.5" />
                Prepaid FRC
              </TabsTrigger>

              <TabsTrigger
                value="prepaid-otf"
                data-testid="tab-prepaid-otf"
                className="gap-2 px-1 text-xs sm:text-sm font-medium"
              >
                <Radio className="h-3.5 w-3.5" />
                Prepaid OTF
              </TabsTrigger>

              <TabsTrigger
                value="postpaid"
                data-testid="tab-postpaid"
                className="gap-2 px-1 text-xs sm:text-sm font-medium"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Postpaid
              </TabsTrigger>

              <TabsTrigger
                value="landline"
                data-testid="tab-landline"
                className="gap-2 px-1 text-xs sm:text-sm font-medium"
              >
                <Layers className="h-3.5 w-3.5" />
                Landline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
          <SearchToolbar
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search by circle, category, amount..."
            onReset={handleResetFilters}
            showResetButton={Boolean(searchQuery || selectedCircleId !== 'all' || selectedCategoryId !== 'all' || denominationFilter)}
            data-testid="commission-search-toolbar"
          >
            {/* Circle Filter Dropdown */}
            <div className="w-40 sm:w-44">
              <Select
                value={selectedCircleId}
                onValueChange={(val) => setSelectedCircleId(val ?? 'all')}
              >
                <SelectTrigger
                  className="h-9 text-xs bg-white border-slate-200 text-slate-800"
                  data-testid="filter-circle-select"
                >
                  <SelectValue placeholder="All Circles" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">All Circles</SelectItem>
                  {circles.map((c) => (
                    <SelectItem key={c.circleId} value={String(c.circleId)}>
                      {c.circleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter Dropdown */}
            <div className="w-40 sm:w-44">
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => setSelectedCategoryId(val ?? 'all')}
              >
                <SelectTrigger
                  className="h-9 text-xs bg-white border-slate-200 text-slate-800"
                  data-testid="filter-category-select"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* Denomination / Amount Input */}
            {(activeType === 'prepaid-frc' || activeType === 'prepaid-otf') && (
              <div className="w-32">
                <Input
                  type="number"
                  placeholder="Denom (₹)"
                  value={denominationFilter}
                  onChange={(e) => setDenominationFilter(e.target.value)}
                  className="h-9 text-xs bg-white border-slate-200"
                  data-testid="filter-denomination-input"
                />
              </div>
            )}
          </SearchToolbar>
        </div>

        {/* Commissions DataTable */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredCommissions}
            loading={isLoading || isLoadingCategories || isLoadingCircles}
            emptyMessage={`No ${activeType} commission configurations found.`}
            data-testid="commissions-data-table"
          />
        </div>

        {/* Edit Commission Modal */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md" data-testid="edit-commission-dialog">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Edit Commission Configuration
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Update slab parameters for ID #{editingItem?.commissionId} ({activeType.toUpperCase()})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-3 py-1">
              {/* Prepaid FRC / OTF Edit Fields */}
              {(activeType === 'prepaid-frc' || activeType === 'prepaid-otf') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-denomination" className="text-xs text-slate-700">
                        Denomination (₹)
                      </Label>
                      <Input
                        id="edit-denomination"
                        type="number"
                        value={editFormData.denomination || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, denomination: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-denomination-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit-seller-comm" className="text-xs text-slate-700">
                        Seller Commission (₹)
                      </Label>
                      <Input
                        id="edit-seller-comm"
                        type="number"
                        step="0.01"
                        value={editFormData.sellerCommission || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, sellerCommission: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-seller-comm-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-fra-comm" className="text-xs text-slate-700">
                        FRA Commission (₹)
                      </Label>
                      <Input
                        id="edit-fra-comm"
                        type="number"
                        step="0.01"
                        value={editFormData.fraCommission || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fraCommission: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-fra-comm-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit-sub-comm" className="text-xs text-slate-700">
                        Sub Commission (₹)
                      </Label>
                      <Input
                        id="edit-sub-comm"
                        type="number"
                        step="0.01"
                        value={editFormData.subCommission || '0'}
                        onChange={(e) => setEditFormData({ ...editFormData, subCommission: e.target.value })}
                        className="h-8.5 text-xs"
                        data-testid="edit-sub-comm-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-tds" className="text-xs text-slate-700">
                      TDS Percentage (%)
                    </Label>
                    <Input
                      id="edit-tds"
                      type="number"
                      step="0.01"
                      value={editFormData.tds || '5'}
                      onChange={(e) => setEditFormData({ ...editFormData, tds: e.target.value })}
                      required
                      className="h-8.5 text-xs"
                      data-testid="edit-tds-input"
                    />
                  </div>
                </>
              )}

              {/* Postpaid Edit Fields */}
              {activeType === 'postpaid' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-actual-comm" className="text-xs text-slate-700">
                        Actual Commission (₹)
                      </Label>
                      <Input
                        id="edit-actual-comm"
                        type="number"
                        step="0.01"
                        value={editFormData.actualCommission || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, actualCommission: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-actual-comm-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit-tds-amount" className="text-xs text-slate-700">
                        TDS Amount (₹)
                      </Label>
                      <Input
                        id="edit-tds-amount"
                        type="number"
                        step="0.01"
                        value={editFormData.tdsAmount || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, tdsAmount: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-tds-amount-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-cap-limit" className="text-xs text-slate-700">
                        Cap Limit (₹)
                      </Label>
                      <Input
                        id="edit-cap-limit"
                        type="number"
                        step="0.01"
                        value={editFormData.cap_limit || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, cap_limit: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-cap-limit-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit-seller-level" className="text-xs text-slate-700">
                        Seller Level
                      </Label>
                      <Input
                        id="edit-seller-level"
                        type="text"
                        value={editFormData.sellerLevel || '1'}
                        onChange={(e) => setEditFormData({ ...editFormData, sellerLevel: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-seller-level-input"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Landline Edit Fields */}
              {activeType === 'landline' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-from-amount" className="text-xs text-slate-700">
                        From Amount (₹)
                      </Label>
                      <Input
                        id="edit-from-amount"
                        type="number"
                        value={editFormData.fromAmount || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fromAmount: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-from-amount-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit-to-amount" className="text-xs text-slate-700">
                        To Amount (₹)
                      </Label>
                      <Input
                        id="edit-to-amount"
                        type="number"
                        value={editFormData.toAmount || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, toAmount: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-to-amount-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-comm-amount" className="text-xs text-slate-700">
                        Commission Amount (₹)
                      </Label>
                      <Input
                        id="edit-comm-amount"
                        type="number"
                        step="0.01"
                        value={editFormData.commissionAmount || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, commissionAmount: e.target.value })}
                        required
                        className="h-8.5 text-xs"
                        data-testid="edit-comm-amount-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit-tds-amount-ll" className="text-xs text-slate-700">
                        TDS Amount (₹)
                      </Label>
                      <Input
                        id="edit-tds-amount-ll"
                        type="number"
                        step="0.01"
                        value={editFormData.tdsAmount || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, tdsAmount: e.target.value })}
                        className="h-8.5 text-xs"
                        data-testid="edit-tds-amount-ll-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="edit-dialog-cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700"
                  data-testid="edit-dialog-submit-btn"
                >
                  Proceed to OTP Verification
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Commission Configuration"
          description={
            deletingItem ? (
              <span>
                Are you sure you want to permanently delete commission slab{' '}
                <strong className="text-slate-800">#{deletingItem.commissionId}</strong>?
                This action cannot be undone.
              </span>
            ) : (
              'Are you sure you want to delete this commission?'
            )
          }
          destructive={true}
          confirmText="Delete Configuration"
          cancelText="Cancel"
          loading={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
        />

        {/* OTP Verification Modal */}
        {isOtpOpen && (
          <OTPVerificationModal
            open={isOtpOpen}
            onOpenChange={setIsOtpOpen}
            topic={otpTopic}
            actionName={otpActionName}
            msisdn={currentUser?.mobileNumber || '9876543210'}
            onVerified={async () => {
              if (pendingOtpAction) {
                await pendingOtpAction()
              }
            }}
          />
        )}
      </div>
    </PermissionGuard>
  )
}
