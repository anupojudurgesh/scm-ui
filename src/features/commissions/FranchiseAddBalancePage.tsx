import * as React from 'react'
import { Link } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/tables/DataTable'
import { SearchToolbar } from '@/components/tables/SearchToolbar'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { PermissionGuard } from '@/components/PermissionGuard'
import { Button } from '@/components/ui/button'
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
  useFranchiseTransactionsQuery,
  useApproveFranchiseBalanceMutation,
  useRejectFranchiseBalanceMutation,
  type FranchiseAddBalanceTransaction,
} from '@/api/commission.api'
import { useAllCirclesQuery } from '@/api/masterdata.api'
import {
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export function FranchiseAddBalancePage() {
  const currentUser = useAuthStore((state) => state.user)

  // Filters & State
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCircleId, setSelectedCircleId] = React.useState<string>('all')

  // Queries
  const { data: circles = [], isLoading: isLoadingCircles } = useAllCirclesQuery()
  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useFranchiseTransactionsQuery(selectedCircleId !== 'all' ? selectedCircleId : undefined)

  // Mutations
  const approveMutation = useApproveFranchiseBalanceMutation()
  const rejectMutation = useRejectFranchiseBalanceMutation()

  // Selected Transaction for OTP Action
  const [activeTransaction, setActiveTransaction] = React.useState<FranchiseAddBalanceTransaction | null>(null)


  // OTP Modal State
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [otpTopic, setOtpTopic] = React.useState<string>('')
  const [otpActionName, setOtpActionName] = React.useState<string>('')
  const [pendingOtpAction, setPendingOtpAction] = React.useState<(() => Promise<void>) | null>(null)

  // Confirmation before rejecting (optional check before OTP)
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = React.useState(false)

  // Notification banners
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null)
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null)

  // Client-side search filtering
  const filteredTransactions = React.useMemo(() => {
    if (!searchQuery.trim()) return transactions
    const q = searchQuery.toLowerCase().trim()
    return transactions.filter((tx) => {
      const matchSeq = String(tx.fabSeq).toLowerCase().includes(q)
      const matchSrc = String(tx.srcMsisdn).toLowerCase().includes(q)
      const matchDest = String(tx.destMsisdn).toLowerCase().includes(q)
      const matchCircle = String(tx.circleName || tx.circle).toLowerCase().includes(q)
      const matchUser = String(tx.createdBy).toLowerCase().includes(q)
      const matchStatus = String(tx.status).toLowerCase().includes(q)
      return matchSeq || matchSrc || matchDest || matchCircle || matchUser || matchStatus
    })
  }, [transactions, searchQuery])

  // Trigger Approve OTP Flow
  const handleInitiateApprove = (tx: FranchiseAddBalanceTransaction) => {
    setActiveTransaction(tx)
    setErrorBanner(null)
    setSuccessBanner(null)


    // Topic MUST be FranchiseAddbalanceApprove
    setOtpTopic('FranchiseAddbalanceApprove')
    setOtpActionName(`Approve Balance Transfer ₹${tx.amount} (Seq #${tx.fabSeq})`)
    setPendingOtpAction(() => async () => {
      try {
        await approveMutation.mutateAsync({
          fabSeqList: [tx.fabSeq],
          actionUser: currentUser?.username || 'admin',
        })
        const msg = `Transaction #${tx.fabSeq} approved successfully.`
        setSuccessBanner(msg)
        try {
          toast.add?.({ title: 'Transaction Approved', description: msg, type: 'success' })
        } catch {
          // Toast fallback
        }
        refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to approve transaction.'
        setErrorBanner(msg)
        try {
          toast.add?.({ title: 'Approval Failed', description: msg, type: 'error' })
        } catch {
          // Toast fallback
        }
      }
    })

    setIsOtpOpen(true)
  }

  // Trigger Reject Action: First confirm, then OTP
  const handleInitiateReject = (tx: FranchiseAddBalanceTransaction) => {
    setActiveTransaction(tx)
    setErrorBanner(null)
    setSuccessBanner(null)
    setIsRejectConfirmOpen(true)
  }


  const handleConfirmReject = () => {
    setIsRejectConfirmOpen(false)
    if (!activeTransaction) return

    const tx = activeTransaction
    // Topic MUST be FranchiseAddbalanceReject
    setOtpTopic('FranchiseAddbalanceReject')
    setOtpActionName(`Reject Balance Transfer ₹${tx.amount} (Seq #${tx.fabSeq})`)
    setPendingOtpAction(() => async () => {
      try {
        await rejectMutation.mutateAsync({
          fabSeqList: [tx.fabSeq],
          actionUser: currentUser?.username || 'admin',
        })
        const msg = `Transaction #${tx.fabSeq} rejected.`
        setSuccessBanner(msg)
        try {
          toast.add?.({ title: 'Transaction Rejected', description: msg, type: 'success' })
        } catch {
          // Toast fallback
        }
        refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to reject transaction.'
        setErrorBanner(msg)
        try {
          toast.add?.({ title: 'Rejection Failed', description: msg, type: 'error' })
        } catch {
          // Toast fallback
        }
      }
    })

    setIsOtpOpen(true)
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCircleId('all')
  }

  // Table Columns
  const columns: DataTableColumn<FranchiseAddBalanceTransaction>[] = [
    {
      id: 'fabSeq',
      header: 'Seq #',
      cell: (tx) => (
        <span className="font-mono text-xs font-semibold text-slate-700" data-testid={`tx-seq-${tx.fabSeq}`}>
          #{tx.fabSeq}
        </span>
      ),
    },
    {
      id: 'msisdn',
      header: 'Source / Destination MSISDN',
      cell: (tx) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-900 font-mono">
            <span className="text-slate-400 font-sans text-[11px] mr-1">Src:</span>
            {tx.srcMsisdn}
          </div>
          <div className="text-slate-600 font-mono">
            <span className="text-slate-400 font-sans text-[11px] mr-1">Dest:</span>
            {tx.destMsisdn}
          </div>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: (tx) => (
        <span className="font-mono text-xs font-bold text-emerald-700">
          ₹{Number(tx.amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'circle',
      header: 'Circle',
      cell: (tx) => (
        <span className="text-xs text-slate-800 font-medium">
          {tx.circleName || `Circle ${tx.circle}`}
        </span>
      ),
    },
    {
      id: 'createdBy',
      header: 'Requested By',
      cell: (tx) => (
        <span className="text-xs text-slate-700">
          {tx.createdBy}
        </span>
      ),
    },
    {
      id: 'cdt',
      header: 'Created Date',
      cell: (tx) => (
        <span className="text-xs text-slate-500 font-mono">
          {tx.cdt}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (tx) => <StatusBadge status={tx.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (tx) => {
        const isPending = tx.status?.toUpperCase() === 'PENDING'

        if (!isPending) {
          return (
            <span className="text-xs text-slate-400 italic">
              Processed
            </span>
          )
        }

        return (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInitiateApprove(tx)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              data-testid={`approve-btn-${tx.fabSeq}`}
              aria-label={`Approve transaction ${tx.fabSeq}`}
            >
              <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
              Approve
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInitiateReject(tx)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              data-testid={`reject-btn-${tx.fabSeq}`}
              aria-label={`Reject transaction ${tx.fabSeq}`}
            >
              <XCircle className="h-3 w-3 mr-1 text-red-500" />
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <PermissionGuard
      permission="commissionPermissions"
      fallback={
        <div
          className="p-8 max-w-lg mx-auto mt-12 text-center rounded-lg border border-slate-200 bg-white space-y-3"
          data-testid="franchise-balance-permission-denied"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500">
            You do not possess authorization to access or approve Franchise Add Balance transactions.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="franchise-balance-page">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Franchise Add Balance Approvals
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                OTP Protected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review, approve, or reject pending franchise wallet balance replenishment requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/commissions/search">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-100"
                data-testid="back-to-commissions-search-link"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1 text-slate-500" />
                Commission Search
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-100"
              data-testid="refresh-transactions-btn"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Feedback Banners */}
        {successBanner && (
          <div
            className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-800"
            data-testid="franchise-balance-success-banner"
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
            data-testid="franchise-balance-error-banner"
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

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
          <SearchToolbar
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search by seq, MSISDN, circle, user..."
            onReset={handleResetFilters}
            showResetButton={Boolean(searchQuery || selectedCircleId !== 'all')}
            data-testid="franchise-balance-toolbar"
          >
            <div className="w-44 sm:w-52">
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
          </SearchToolbar>
        </div>

        {/* Transactions DataTable */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredTransactions}
            loading={isLoading || isLoadingCircles}
            emptyMessage="No pending franchise add balance transactions found."
            data-testid="franchise-transactions-table"
          />
        </div>

        {/* Reject Confirmation Dialog */}
        <ConfirmationDialog
          open={isRejectConfirmOpen}
          onOpenChange={setIsRejectConfirmOpen}
          title="Reject Transaction Request"
          description={
            activeTransaction ? (
              <span>
                Are you sure you want to reject balance addition of{' '}
                <strong className="text-slate-900 font-semibold">
                  ₹{Number(activeTransaction.amount).toLocaleString('en-IN')}
                </strong>{' '}
                for destination MSISDN{' '}
                <strong className="text-slate-900 font-mono">
                  {activeTransaction.destMsisdn}
                </strong>{' '}
                (Seq #{activeTransaction.fabSeq})? This will proceed to OTP authorization.
              </span>
            ) : (
              'Are you sure you want to reject this request?'
            )
          }
          destructive={true}
          confirmText="Proceed to Reject"
          cancelText="Cancel"
          onConfirm={handleConfirmReject}
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
