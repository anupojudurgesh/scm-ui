import * as React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PermissionGuard } from '@/components/PermissionGuard'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { useAuthStore } from '@/stores/authStore'
import {
  useDealerDetailQuery,
  useUpdateDealerMutation,
  useDealerStatusChangeMutation,
  useResetMpinMutation,
  useChangeDealerHierarchyMutation,
} from '@/api/dealer.api'
import {
  ArrowLeft,
  Shield,
  Edit2,
  KeyRound,
  UserCheck,
  UserX,
  Network,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Store,
} from 'lucide-react'


export function DealerDetailPage() {
  const { msisdn = '' } = useParams<{ msisdn: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)

  // Fetch dealer profile
  const { data: dealer, isLoading, isError, refetch } = useDealerDetailQuery(msisdn)

  // Mutations
  const updateDealerMutation = useUpdateDealerMutation()
  const statusChangeMutation = useDealerStatusChangeMutation()
  const resetMpinMutation = useResetMpinMutation()
  const changeHierarchyMutation = useChangeDealerHierarchyMutation()

  // -------------------------------------------------------------
  // Modals & Flows State
  // -------------------------------------------------------------

  // 1. Edit Details Modal State
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editFirstName, setEditFirstName] = React.useState('')
  const [editLastName, setEditLastName] = React.useState('')
  const [editAddress, setEditAddress] = React.useState('')
  const [editDob, setEditDob] = React.useState('')

  // 2. Status Change Confirmation & State
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = React.useState(false)
  const [targetStatus, setTargetStatus] = React.useState<string>('')

  // 3. MPIN Reset Confirmation State
  const [isMpinConfirmOpen, setIsMpinConfirmOpen] = React.useState(false)

  // 4. Hierarchy Reassignment State
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = React.useState(false)
  const [newParentMsisdn, setNewParentMsisdn] = React.useState('')
  const [transferType, setTransferType] = React.useState('Franchise')

  // Global OTP Modal State
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [otpTopic, setOtpTopic] = React.useState<string>('')
  const [otpActionName, setOtpActionName] = React.useState<string>('')
  const [pendingOtpCallback, setPendingOtpCallback] = React.useState<(() => Promise<void>) | null>(null)

  // Status message banners
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null)
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null)

  // Initialize edit form when dealer loads
  React.useEffect(() => {
    if (dealer) {
      setEditFirstName(dealer.firstName || '')
      setEditLastName(dealer.lastName || '')
      setEditAddress(dealer.address || '')
      setEditDob(dealer.dob || '')
    }
  }, [dealer])

  // -------------------------------------------------------------
  // Flow 1: Edit Details (Topic: 'Modifydealer')
  // -------------------------------------------------------------
  const handleOpenEdit = () => {
    if (!dealer) return
    setEditFirstName(dealer.firstName || '')
    setEditLastName(dealer.lastName || '')
    setEditAddress(dealer.address || '')
    setEditDob(dealer.dob || '')
    setErrorBanner(null)
    setSuccessBanner(null)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealer) return

    setOtpTopic('Modifydealer')
    setOtpActionName(`Update Profile for ${dealer.dealerCode}`)
    setPendingOtpCallback(() => async () => {
      try {
        await updateDealerMutation.mutateAsync({
          dealerId: dealer.dealerId,
          dealerCode: dealer.dealerCode,
          scmMsisdn: dealer.scmMsisdn || dealer.mobile,
          firstName: editFirstName,
          lastName: editLastName,
          address: editAddress,
          dob: editDob,
        })
        const msg = `Dealer profile ${dealer.dealerCode} updated successfully.`
        setSuccessBanner(msg)
        setIsEditDialogOpen(false)
        refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update dealer profile.'
        setErrorBanner(msg)
      }
    })

    setIsOtpOpen(true)
  }

  // -------------------------------------------------------------
  // Flow 2: Status Change (Topic: 'DealerStatus')
  // -------------------------------------------------------------
  const handleInitiateStatusChange = () => {
    if (!dealer) return
    const next = dealer.status?.toLowerCase() === 'active' ? 'Inactive' : 'Active'
    setTargetStatus(next)
    setErrorBanner(null)
    setSuccessBanner(null)
    setIsStatusConfirmOpen(true)
  }

  const handleConfirmStatusChange = () => {
    setIsStatusConfirmOpen(false)
    if (!dealer) return

    setOtpTopic('DealerStatus')
    setOtpActionName(`Change Dealer Status to ${targetStatus}`)
    setPendingOtpCallback(() => async () => {
      try {
        await statusChangeMutation.mutateAsync({
          msisdn: dealer.mobile || dealer.scmMsisdn,
          username: currentUser?.username || 'admin',
          status: targetStatus,
        })
        const msg = `Dealer status successfully changed to ${targetStatus}.`
        setSuccessBanner(msg)
        refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to change dealer status.'
        setErrorBanner(msg)
      }
    })

    setIsOtpOpen(true)
  }

  // -------------------------------------------------------------
  // Flow 3: Reset MPIN (Topic: 'DealerMpinreset')
  // -------------------------------------------------------------
  const handleInitiateMpinReset = () => {
    setErrorBanner(null)
    setSuccessBanner(null)
    setIsMpinConfirmOpen(true)
  }

  const handleConfirmMpinReset = () => {
    setIsMpinConfirmOpen(false)
    if (!dealer) return

    setOtpTopic('DealerMpinreset')
    setOtpActionName(`Reset MPIN for ${dealer.dealerCode}`)
    setPendingOtpCallback(() => async () => {
      try {
        await resetMpinMutation.mutateAsync({
          msisdn: dealer.mobile || dealer.scmMsisdn,
          username: currentUser?.username || 'admin',
        })
        const msg = `MPIN for MSISDN ${dealer.mobile} has been reset. Temporary credentials dispatched via SMS.`
        setSuccessBanner(msg)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to reset MPIN.'
        setErrorBanner(msg)
      }
    })

    setIsOtpOpen(true)
  }

  // -------------------------------------------------------------
  // Flow 4: Change Dealer Hierarchy (Topic: 'DealerHierarchyChange')
  // -------------------------------------------------------------
  const handleOpenHierarchyModal = () => {
    setNewParentMsisdn('')
    setTransferType('Franchise')
    setErrorBanner(null)
    setSuccessBanner(null)
    setIsHierarchyModalOpen(true)
  }

  const handleHierarchySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealer || !newParentMsisdn.trim()) return

    setOtpTopic('DealerHierarchyChange')
    setOtpActionName(`Transfer Hierarchy to Parent ${newParentMsisdn}`)
    setPendingOtpCallback(() => async () => {
      try {
        await changeHierarchyMutation.mutateAsync({
          srcMsisdn: dealer.mobile || dealer.scmMsisdn,
          parentMsisdn: newParentMsisdn.trim(),
          guiUsername: currentUser?.username || 'admin',
          type: transferType,
        })
        const msg = `Dealer ${dealer.dealerCode} successfully reassigned to parent ${newParentMsisdn}.`
        setSuccessBanner(msg)
        setIsHierarchyModalOpen(false)
        refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update hierarchy.'
        setErrorBanner(msg)
      }
    })

    setIsOtpOpen(true)
  }

  if (isLoading) {
    return <LoadingState message="Loading dealer entity profile..." />
  }

  if (isError || !dealer) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 text-center rounded-lg border border-slate-200 bg-white space-y-3">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Dealer Not Found</h2>
        <p className="text-xs text-slate-500">
          No dealer found matching MSISDN: <span className="font-mono">{msisdn}</span>
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate('/dealers')}>
          Back to Dealer Directory
        </Button>
      </div>
    )
  }

  return (
    <PermissionGuard
      permission="dealerPermissions"
      fallback={
        <div
          className="p-8 max-w-lg mx-auto mt-12 text-center rounded-lg border border-slate-200 bg-white space-y-3"
          data-testid="dealer-detail-permission-denied"
        >
          <Shield className="h-10 w-10 text-amber-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You do not have permissions to manage dealer operations.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5" data-testid="dealer-detail-page">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            to="/dealers"
            className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
            data-testid="back-to-dealers-link"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dealer Directory
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-mono font-semibold">{dealer.dealerCode}</span>
        </div>

        {/* Header Profile Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 font-heading" data-testid="dealer-title-name">
                  {dealer.firstName} {dealer.lastName}
                </h1>
                <Badge variant="outline" className="font-mono text-xs bg-slate-50 text-slate-800 border-slate-200">
                  {dealer.dealerCode}
                </Badge>
                <StatusBadge status={dealer.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="font-mono text-slate-700">MSISDN: {dealer.mobile || dealer.scmMsisdn}</span>
                <span>•</span>
                <span>Tier: <strong>{dealer.dealerTypeName || `Type ${dealer.dealerType}`}</strong></span>
                <span>•</span>
                <span>Circle: <strong>{dealer.circleName || `Circle ${dealer.circleId}`}</strong></span>
              </p>
            </div>
          </div>

          {/* Protected Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
              data-testid="edit-dealer-btn"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Edit Info
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleInitiateStatusChange}
              className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
              data-testid="change-status-btn"
            >
              {dealer.status?.toLowerCase() === 'active' ? (
                <>
                  <UserX className="h-3.5 w-3.5 mr-1 text-amber-600" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Activate
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleInitiateMpinReset}
              className="text-xs h-8 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              data-testid="reset-mpin-btn"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1 text-red-500" />
              Reset MPIN
            </Button>
          </div>
        </div>

        {/* Feedback Banners */}
        {successBanner && (
          <div
            className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
            data-testid="dealer-detail-success-banner"
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
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
            data-testid="dealer-detail-error-banner"
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

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Identity & Physical Details */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading border-b border-slate-100 pb-2">
              Personal & Contact
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Principal Name</span>
                <span className="font-semibold text-slate-800">{dealer.firstName} {dealer.lastName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary MSISDN</span>
                <span className="font-mono text-slate-800">{dealer.mobile || dealer.scmMsisdn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                <span className="text-slate-800">{dealer.dob || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Operational Address</span>
                <span className="text-slate-800 leading-relaxed block">{dealer.address || 'Not registered'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">KYC Certificate Document</span>
                {dealer.certificateFileName ? (
                  <div className="flex items-center gap-1.5 text-blue-600 font-medium mt-0.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{dealer.certificateFileName}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No KYC document on record</span>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Regional Jurisdiction & Classification */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading border-b border-slate-100 pb-2">
              Jurisdiction & Tier
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Dealer Tier</span>
                <span className="font-semibold text-slate-800">{dealer.dealerTypeName || `Type ${dealer.dealerType}`}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Category</span>
                <span className="text-slate-800">{dealer.categoryName || `Category ${dealer.category || '1'}`}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Circle</span>
                <span className="text-slate-800">{dealer.circleName || `Circle ${dealer.circleId}`}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">SSA (Secondary Switching Area)</span>
                <span className="text-slate-800">{dealer.ssaName || `SSA ${dealer.ssaId}`}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Onboarding Timestamp</span>
                <span className="font-mono text-slate-600">{dealer.cdt || '2026-01-01 00:00:00'}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Tax Credentials & Compliance */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading border-b border-slate-100 pb-2">
              Tax & Compliance Proofs
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">PAN Number</span>
                <span className="font-mono font-semibold text-slate-800 uppercase">
                  {dealer.panId || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Aadhaar Identification</span>
                <span className="font-mono text-slate-800">
                  {dealer.aadhaarId ? `XXXXXXXX${dealer.aadhaarId.slice(-4)}` : 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">GSTIN Registration</span>
                <span className="font-mono text-slate-800 uppercase">
                  {dealer.gstNumber || 'Unregistered'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy Management Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4" data-testid="dealer-hierarchy-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Network className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-heading">
                  Distribution Hierarchy
                </h2>
                <p className="text-[11px] text-slate-500">
                  Parent-child network traversal and upstream distributor assignment.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenHierarchyModal}
              className="text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              data-testid="change-hierarchy-btn"
            >
              Reassign Parent Distributor
            </Button>
          </div>

          {/* Visual Hierarchy Flow */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 px-2 bg-slate-50 rounded-lg border border-slate-100">
            {/* Parent Node */}
            <div className="w-full sm:w-64 bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Upstream Parent Distributor
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1" data-testid="parent-dealer-name">
                {dealer.parentName || 'Telecom BSNL Direct'}
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5" data-testid="parent-msisdn-display">
                MSISDN: {dealer.parentMsisdn || '0'}
              </p>
            </div>

            {/* Connecting Arrow */}
            <div className="flex items-center justify-center text-indigo-600 rotate-90 sm:rotate-0">
              <ArrowRight className="h-6 w-6" />
            </div>

            {/* Child Node (Current Dealer) */}
            <div className="w-full sm:w-64 bg-white border-2 border-indigo-200 rounded-lg p-3 text-center shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide block">
                Current Dealer (Subordinate)
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1" data-testid="child-dealer-name">
                {dealer.firstName} {dealer.lastName} ({dealer.dealerCode})
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5" data-testid="child-msisdn-display">
                MSISDN: {dealer.mobile || dealer.scmMsisdn}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Modals & Dialogs                                              */}
        {/* ------------------------------------------------------------- */}

        {/* 1. Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md" data-testid="edit-dealer-dialog">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Edit Dealer Information
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update details for {dealer.dealerCode}. Action requires OTP authorization.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-3 py-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-first-name" className="text-xs text-slate-700">First Name</Label>
                  <Input
                    id="edit-first-name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="h-8.5 text-xs"
                    data-testid="edit-dealer-first-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-last-name" className="text-xs text-slate-700">Last Name</Label>
                  <Input
                    id="edit-last-name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="h-8.5 text-xs"
                    data-testid="edit-dealer-last-name"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-dob" className="text-xs text-slate-700">Date of Birth</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="h-8.5 text-xs"
                  data-testid="edit-dealer-dob"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-address" className="text-xs text-slate-700">Physical Address</Label>
                <Textarea
                  id="edit-address"
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="text-xs resize-none"
                  data-testid="edit-dealer-address"
                />
              </div>

              <DialogFooter className="gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="cancel-edit-dealer-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700"
                  data-testid="submit-edit-dealer-btn"
                >
                  Proceed to OTP
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 2. Status Change Confirmation */}
        <ConfirmationDialog
          open={isStatusConfirmOpen}
          onOpenChange={setIsStatusConfirmOpen}
          title={`Confirm Dealer ${targetStatus}`}
          description={
            <span>
              Are you sure you want to change the status of dealer{' '}
              <strong className="text-slate-900">{dealer.dealerCode}</strong> to{' '}
              <strong className="text-slate-900">{targetStatus}</strong>?
            </span>
          }
          destructive={targetStatus === 'Inactive'}
          confirmText={`Proceed to ${targetStatus}`}
          cancelText="Cancel"
          onConfirm={handleConfirmStatusChange}
        />

        {/* 3. MPIN Reset Confirmation (Irreversible Warning) */}
        <ConfirmationDialog
          open={isMpinConfirmOpen}
          onOpenChange={setIsMpinConfirmOpen}
          title="Reset Dealer MPIN"
          description={
            <span className="space-y-1.5 block">
              <span className="block">
                Are you sure you want to reset the transaction MPIN for dealer{' '}
                <strong className="text-slate-900">{dealer.dealerCode}</strong> ({dealer.mobile})?
              </span>
              <span className="text-amber-700 font-medium block mt-1">
                Warning: This action is irreversible. The current PIN will immediately be invalidated and a new temporary PIN will be dispatched via SMS.
              </span>
            </span>
          }

          destructive={true}
          confirmText="Proceed to Reset MPIN"
          cancelText="Cancel"
          onConfirm={handleConfirmMpinReset}
        />

        {/* 4. Hierarchy Reassignment Dialog */}
        <Dialog open={isHierarchyModalOpen} onOpenChange={setIsHierarchyModalOpen}>
          <DialogContent className="sm:max-w-md" data-testid="hierarchy-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Reassign Parent Distributor
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Transfer dealer {dealer.dealerCode} ({dealer.mobile}) to a new parent distributor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleHierarchySubmit} className="space-y-3 py-1">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Current Parent</Label>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                  {dealer.parentName || 'Telecom BSNL Direct'} ({dealer.parentMsisdn || '0'})
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-parent-msisdn" className="text-xs font-semibold text-slate-700">
                  Target Parent Mobile (MSISDN) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-parent-msisdn"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={newParentMsisdn}
                  onChange={(e) => setNewParentMsisdn(e.target.value)}
                  required
                  className="h-9 text-xs font-mono"
                  data-testid="target-parent-msisdn-input"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="transfer-type" className="text-xs font-semibold text-slate-700">
                  Distribution Tier
                </Label>
                <Select value={transferType} onValueChange={(val) => setTransferType(val ?? 'Franchise')}>
                  <SelectTrigger id="transfer-type" className="h-9 text-xs bg-white border-slate-200" data-testid="hierarchy-tier-select">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Franchise">Franchise (Direct)</SelectItem>
                    <SelectItem value="SubFranchise">Sub-Franchise</SelectItem>
                    <SelectItem value="Retailer">Retailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHierarchyModalOpen(false)}
                  data-testid="cancel-hierarchy-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  data-testid="submit-hierarchy-btn"
                >
                  Proceed to OTP
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Global Security OTP Verification Modal */}
        {isOtpOpen && (
          <OTPVerificationModal
            open={isOtpOpen}
            onOpenChange={setIsOtpOpen}
            topic={otpTopic}
            actionName={otpActionName}
            msisdn={currentUser?.mobileNumber || dealer.mobile || '9876543210'}
            onVerified={async () => {
              if (pendingOtpCallback) {
                await pendingOtpCallback()
              }
            }}
          />
        )}
      </div>
    </PermissionGuard>
  )
}
