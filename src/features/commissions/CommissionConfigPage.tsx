import * as React from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsIndicator,
} from '@/components/ui/tabs'
import { FormSection } from '@/components/forms/FormSection'
import { CircleSelector } from '@/components/forms/CircleSelector'
import { ZoneSelector } from '@/components/forms/ZoneSelector'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { PermissionGuard } from '@/components/PermissionGuard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  useCategoriesQuery,
  useSaveCommissionConfigMutation,
  useSaveMultipleCommissionConfigMutation,
  usePostpaidCommissionConfigMutation,
  useLandlineCommissionConfigMutation,
} from '@/api/commission.api'
import {
  prepaidFrcSchema,
  prepaidOtfSchema,
  postpaidCommissionSchema,
  landlineCommissionSchema,
  type PrepaidFrcFormValues,
  type PrepaidOtfFormValues,
  type PostpaidCommissionFormValues,
  type LandlineCommissionFormValues,
} from '@/schemas/commission.schema'
import {
  ShieldAlert,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Radio,
  PhoneCall,
  Layers,
  Search,
  Building2,
} from 'lucide-react'


import { cn } from '@/lib/utils'

export interface CommissionConfigPageProps {
  initialTab?: string;
  defaultFrcValues?: Partial<PrepaidFrcFormValues>;
  defaultOtfValues?: Partial<PrepaidOtfFormValues>;
  defaultPostpaidValues?: Partial<PostpaidCommissionFormValues>;
  defaultLandlineValues?: Partial<LandlineCommissionFormValues>;
}

export function CommissionConfigPage({
  initialTab = 'prepaid',
  defaultFrcValues,
  defaultOtfValues,
  defaultPostpaidValues,
  defaultLandlineValues,
}: CommissionConfigPageProps) {
  const currentUser = useAuthStore((state) => state.user)

  // Top-level tab state ('prepaid' | 'postpaid' | 'landline')
  const [activeTab, setActiveTab] = React.useState<string>(initialTab)
  const [prepaidSubTab, setPrepaidSubTab] = React.useState<'frc' | 'otf'>('frc')

  // Category query
  const { data: categories = [], isLoading: isLoadingCategories } = useCategoriesQuery()

  // Mutations
  const saveFrcMutation = useSaveCommissionConfigMutation()
  const saveOtfMutation = useSaveMultipleCommissionConfigMutation()
  const savePostpaidMutation = usePostpaidCommissionConfigMutation()
  const saveLandlineMutation = useLandlineCommissionConfigMutation()

  // Global OTP Modal State
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [otpTopic, setOtpTopic] = React.useState<string>('PrepaidFrc')
  const [otpActionName, setOtpActionName] = React.useState<string>('')
  const [pendingAction, setPendingAction] = React.useState<(() => Promise<void>) | null>(null)

  // Status banners
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // -------------------------------------------------------------
  // 1. Prepaid FRC Form
  // -------------------------------------------------------------
  const frcForm = useForm<PrepaidFrcFormValues>({
    resolver: zodResolver(prepaidFrcSchema),
    defaultValues: {
      categoryId: defaultFrcValues?.categoryId || '',
      zoneId: defaultFrcValues?.zoneId ? String(defaultFrcValues.zoneId) : '',
      circleId: defaultFrcValues?.circleId ? String(defaultFrcValues.circleId) : '',
      denomination: defaultFrcValues?.denomination ? String(defaultFrcValues.denomination) : '',
      sellerCommission: defaultFrcValues?.sellerCommission ? String(defaultFrcValues.sellerCommission) : '',
      fraCommission: defaultFrcValues?.fraCommission ? String(defaultFrcValues.fraCommission) : '',
      subCommission: defaultFrcValues?.subCommission ? String(defaultFrcValues.subCommission) : '0',
      tds: defaultFrcValues?.tds ? String(defaultFrcValues.tds) : '5',
      masterCategoryId: defaultFrcValues?.masterCategoryId || '0',
      commissionType: '1',
      dtype: 'web',
    },
  })

  const onFrcSubmit = (values: PrepaidFrcFormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setOtpTopic('PrepaidFrc')
    setOtpActionName('Configure Prepaid FRC Commission')
    setPendingAction(() => async () => {
      await saveFrcMutation.mutateAsync({
        masterCategoryId: values.masterCategoryId || '0',
        circleId: values.circleId,
        sellerCommission: values.sellerCommission,
        fraCommission: values.fraCommission,
        subCommission: values.subCommission || '0',
        tds: values.tds,
        denomination: values.denomination,
        categoryId: values.categoryId,
        commissionType: '1',
        dtype: 'web',
        createdGuiUser: currentUser?.username || 'admin',
      })
      const msg = `Prepaid FRC commission of ₹${values.denomination} configured successfully.`
      setSuccessMessage(msg)
      try {
        toast.add?.({ title: 'Commission Configured', description: msg, type: 'success' })
      } catch {
        /* safe */
      }
    })
    setIsOtpOpen(true)
  }

  // -------------------------------------------------------------
  // 2. Prepaid OTF Form
  // -------------------------------------------------------------
  const otfForm = useForm<PrepaidOtfFormValues>({
    resolver: zodResolver(prepaidOtfSchema),
    defaultValues: {
      categoryId: defaultOtfValues?.categoryId || '',
      zoneId: defaultOtfValues?.zoneId ? String(defaultOtfValues.zoneId) : '',
      circleId: defaultOtfValues?.circleId ? String(defaultOtfValues.circleId) : '',
      denomination: defaultOtfValues?.denomination ? String(defaultOtfValues.denomination) : '',
      sellerCommission: defaultOtfValues?.sellerCommission ? String(defaultOtfValues.sellerCommission) : '',
      fraCommission: defaultOtfValues?.fraCommission ? String(defaultOtfValues.fraCommission) : '',
      subCommission: defaultOtfValues?.subCommission ? String(defaultOtfValues.subCommission) : '0',
      tds: defaultOtfValues?.tds ? String(defaultOtfValues.tds) : '5',
      masterCategoryId: defaultOtfValues?.masterCategoryId || '0',
      commissionType: '2',
      dtype: 'web',
    },
  })

  const onOtfSubmit = (values: PrepaidOtfFormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setOtpTopic('PrepaidOtf')
    setOtpActionName('Configure Prepaid OTF Commission')
    setPendingAction(() => async () => {
      await saveOtfMutation.mutateAsync({
        masterCategoryId: values.masterCategoryId || '0',
        circleId: values.circleId,
        zoneId: values.zoneId,
        sellerCommission: values.sellerCommission,
        fraCommission: values.fraCommission,
        subCommission: values.subCommission || '0',
        tds: values.tds,
        denomination: values.denomination,
        categoryId: values.categoryId,
        commissionType: '2',
        dtype: 'web',
        createdGuiUser: currentUser?.username || 'admin',
      })
      const msg = `Prepaid OTF commission for denomination ₹${values.denomination} saved successfully.`
      setSuccessMessage(msg)
      try {
        toast.add?.({ title: 'OTF Commission Saved', description: msg, type: 'success' })
      } catch {
        /* safe */
      }
    })
    setIsOtpOpen(true)
  }

  // -------------------------------------------------------------
  // 3. Postpaid Form
  // -------------------------------------------------------------
  const postpaidForm = useForm<PostpaidCommissionFormValues>({
    resolver: zodResolver(postpaidCommissionSchema),
    defaultValues: {
      categoryId: defaultPostpaidValues?.categoryId || '',
      zoneId: defaultPostpaidValues?.zoneId ? String(defaultPostpaidValues.zoneId) : '',
      circleId: defaultPostpaidValues?.circleId ? String(defaultPostpaidValues.circleId) : '',
      tdsAmount: defaultPostpaidValues?.tdsAmount ? String(defaultPostpaidValues.tdsAmount) : '',
      actualCommission: defaultPostpaidValues?.actualCommission ? String(defaultPostpaidValues.actualCommission) : '',
      sellerLevel: defaultPostpaidValues?.sellerLevel ? String(defaultPostpaidValues.sellerLevel) : '1',
      cap_limit: defaultPostpaidValues?.cap_limit ? String(defaultPostpaidValues.cap_limit) : '',
      fraCommission: defaultPostpaidValues?.fraCommission ? String(defaultPostpaidValues.fraCommission) : '0',
      subFraCommission: defaultPostpaidValues?.subFraCommission ?? 0,
      retailerCommission: defaultPostpaidValues?.retailerCommission ?? 0,
    },
  })

  const onPostpaidSubmit = (values: PostpaidCommissionFormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setOtpTopic('Postpaid')
    setOtpActionName('Configure Postpaid Commission')
    setPendingAction(() => async () => {
      await savePostpaidMutation.mutateAsync({
        categoryId: values.categoryId,
        circleId: values.circleId,
        zoneId: values.zoneId,
        tdsAmount: values.tdsAmount,
        fraCommission: values.fraCommission ?? '0',
        subFraCommission: values.subFraCommission ?? 0,
        actualCommission: values.actualCommission,
        retailerCommission: values.retailerCommission ?? 0,
        sellerLevel: values.sellerLevel,
        cap_limit: values.cap_limit,
        createdGuiUser: currentUser?.username || 'admin',
      })
      const msg = `Postpaid commission with cap limit ₹${values.cap_limit} configured successfully.`
      setSuccessMessage(msg)
      try {
        toast.add?.({ title: 'Postpaid Configured', description: msg, type: 'success' })
      } catch {
        /* safe */
      }
    })
    setIsOtpOpen(true)
  }

  // -------------------------------------------------------------
  // 4. Landline Form
  // -------------------------------------------------------------
  const landlineForm = useForm<LandlineCommissionFormValues>({
    resolver: zodResolver(landlineCommissionSchema),
    defaultValues: {
      categoryId: defaultLandlineValues?.categoryId || '',
      zoneId: defaultLandlineValues?.zoneId ? String(defaultLandlineValues.zoneId) : '',
      circleId: defaultLandlineValues?.circleId ? String(defaultLandlineValues.circleId) : '',
      fromAmount: defaultLandlineValues?.fromAmount ? String(defaultLandlineValues.fromAmount) : '',
      toAmount: defaultLandlineValues?.toAmount ? String(defaultLandlineValues.toAmount) : '',
      tdsAmount: defaultLandlineValues?.tdsAmount ? String(defaultLandlineValues.tdsAmount) : '0',
      commissionAmount: defaultLandlineValues?.commissionAmount ? String(defaultLandlineValues.commissionAmount) : '0',
      fraCommission: defaultLandlineValues?.fraCommission ?? 0,
      subFraCommission: defaultLandlineValues?.subFraCommission ?? 0,
      retailerCommission: defaultLandlineValues?.retailerCommission ?? 0,
      sellerLevel: defaultLandlineValues?.sellerLevel || '1',
    },
  })

  const onLandlineSubmit = (values: LandlineCommissionFormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setOtpTopic('Landline')
    setOtpActionName('Configure Landline Commission')
    setPendingAction(() => async () => {
      await saveLandlineMutation.mutateAsync({
        categoryId: values.categoryId,
        circleId: values.circleId,
        zoneId: values.zoneId,
        fromAmount: values.fromAmount,
        toAmount: values.toAmount,
        tdsAmount: values.tdsAmount ?? '0',
        commissionAmount: values.commissionAmount ?? '0',
        fraCommission: values.fraCommission ?? 0,
        subFraCommission: values.subFraCommission ?? 0,
        retailerCommission: values.retailerCommission ?? 0,
        sellerLevel: values.sellerLevel ?? '1',
        commissionId: '0',
        dtype: 'web',
        createdGuiUser: currentUser?.username || 'admin',
      })
      const msg = `Landline tariff slab (₹${values.fromAmount} - ₹${values.toAmount}) configured successfully.`
      setSuccessMessage(msg)
      try {
        toast.add?.({ title: 'Landline Configured', description: msg, type: 'success' })
      } catch {
        /* safe */
      }
    })
    setIsOtpOpen(true)
  }

  // Handle OTP Verified
  const handleOtpVerified = async () => {
    if (!pendingAction) return
    try {
      await pendingAction()
      setPendingAction(null)
      setIsOtpOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply commission configuration.'
      setErrorMessage(msg)
      try {
        toast.add?.({ title: 'Configuration Failed', description: msg, type: 'error' })
      } catch {
        /* safe */
      }
    }
  }

  return (
    <PermissionGuard
      permission="commissionPermissions"
      fallback={
        <div
          className="p-8 max-w-xl mx-auto my-12 text-center rounded-xl border border-amber-200 bg-amber-50 text-amber-900 shadow-sm"
          data-testid="permission-denied-message"
        >
          <ShieldAlert className="w-10 h-10 mx-auto text-amber-600 mb-3" />
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-sm text-amber-700 mt-1">
            You do not have the required permissions (<code>commissionPermissions</code>) to view or
            manage commission configurations.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6" data-testid="commission-config-page">
        {/* Page Header */}
        <div className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Commission Configuration
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Configure tariff commission rates, TDS withholding amounts, and channel tier splits
                across Prepaid, Postpaid, and Landline.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/commissions/search">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-100"
                  data-testid="search-commissions-link"
                >
                  <Search className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Search & Manage
                </Button>
              </Link>

              <Link to="/commissions/franchise-balance">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-100"
                  data-testid="franchise-balance-nav-link"
                >
                  <Building2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Franchise Balance
                </Button>
              </Link>

             
            </div>
          </div>
        </div>


        {/* Global Feedback Banners */}
        {successMessage && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm animate-in fade-in"
            data-testid="commission-success-banner"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm animate-in fade-in"
            data-testid="commission-error-banner"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Line Bar Tabs Container */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col space-y-6"
          data-testid="commission-tabs"
        >
          {/* Modern Line Bar Navigation Header */}
          <div className="border-b border-slate-200 w-full">
            <TabsList
              variant="line"
              className="flex w-full justify-start border-b-0 gap-6 sm:gap-8 bg-transparent p-0 h-auto"
            >
              <TabsTrigger
                value="prepaid"
                data-testid="tab-prepaid"
                className="group flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-slate-900 hover:border-slate-300 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:font-semibold data-selected:border-blue-600 data-selected:text-blue-600 aria-selected:border-blue-600 aria-selected:text-blue-600 -mb-px cursor-pointer"
              >
                <Layers className="w-4 h-4 text-slate-400 group-data-[state=active]:text-blue-600 group-data-selected:text-blue-600 group-aria-selected:text-blue-600 transition-colors" />
                <span>Prepaid FRC/OTF</span>
              </TabsTrigger>
              <TabsTrigger
                value="postpaid"
                data-testid="tab-postpaid"
                className="group flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-slate-900 hover:border-slate-300 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:font-semibold data-selected:border-blue-600 data-selected:text-blue-600 aria-selected:border-blue-600 aria-selected:text-blue-600 -mb-px cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-400 group-data-[state=active]:text-blue-600 group-data-selected:text-blue-600 group-aria-selected:text-blue-600 transition-colors" />
                <span>Postpaid</span>
              </TabsTrigger>
              <TabsTrigger
                value="landline"
                data-testid="tab-landline"
                className="group flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-slate-900 hover:border-slate-300 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:font-semibold data-selected:border-blue-600 data-selected:text-blue-600 aria-selected:border-blue-600 aria-selected:text-blue-600 -mb-px cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-slate-400 group-data-[state=active]:text-blue-600 group-data-selected:text-blue-600 group-aria-selected:text-blue-600 transition-colors" />
                <span>Landline</span>
              </TabsTrigger>
              <TabsIndicator />
            </TabsList>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: PREPAID (FRC & OTF)                                */}
          {/* ========================================================= */}
          <TabsContent value="prepaid" className="space-y-6 w-full">
            {/* Sleek Sub-mode Segmented Controller */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/80 px-4 py-3 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-700">
                <Radio className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Prepaid Mode:
                </span>
                <span className="text-xs text-slate-500">
                  {prepaidSubTab === 'frc'
                    ? 'First Recharge Coupon (Single Circle)'
                    : 'On-The-Fly Tariff (Zone Scoped / Multi Circle)'}
                </span>
              </div>
              <div
                className="inline-flex p-1 bg-slate-200/60 rounded-lg gap-1 border border-slate-200"
                role="tablist"
                aria-label="Prepaid Sub-types"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={prepaidSubTab === 'frc'}
                  data-testid="tab-prepaid-frc"
                  onClick={() => setPrepaidSubTab('frc')}
                  className={cn(
                    'text-xs font-medium h-7 px-3.5 rounded-md transition-all cursor-pointer',
                    prepaidSubTab === 'frc'
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  )}
                >
                  Prepaid FRC (Single Circle)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={prepaidSubTab === 'otf'}
                  data-testid="tab-prepaid-otf"
                  onClick={() => setPrepaidSubTab('otf')}
                  className={cn(
                    'text-xs font-medium h-7 px-3.5 rounded-md transition-all cursor-pointer',
                    prepaidSubTab === 'otf'
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  )}
                >
                  Prepaid OTF (Zone Scoped)
                </button>
              </div>
            </div>

            {/* --- FRC FORM --- */}
            {prepaidSubTab === 'frc' && (
              <form
                onSubmit={frcForm.handleSubmit(onFrcSubmit)}
                className="space-y-6"
                data-testid="prepaid-frc-form"
              >
                <FormSection
                  title="Prepaid FRC Commission Configuration"
                  description="Define First Recharge Coupon (FRC) channel commission percentages, circle scope, and tax deductions."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-category">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        control={frcForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <div className="relative">
                            <Select
                              value={field.value ? String(field.value) : undefined}
                              onValueChange={(val) => field.onChange(val || '')}
                            >
                              <SelectTrigger
                                id="frc-category"
                                data-testid="select-category-frc"
                                className="w-full bg-white"
                              >
                                <SelectValue
                                  placeholder={
                                    isLoadingCategories
                                      ? 'Loading categories...'
                                      : 'Select Category...'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem
                                    key={String(cat.categoryId)}
                                    value={String(cat.categoryId)}
                                  >
                                    {cat.categoryName || `Category ${cat.categoryId}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <input
                              type="hidden"
                              data-testid="input-category-frc"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                        )}
                      />
                      {frcForm.formState.errors.categoryId && (
                        <p className="text-xs text-red-500">
                          {frcForm.formState.errors.categoryId.message}
                        </p>
                      )}
                    </div>

                    {/* Zone Selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-zone">Zone</Label>
                      <Controller
                        control={frcForm.control}
                        name="zoneId"
                        render={({ field }) => (
                          <ZoneSelector
                            id="frc-zone"
                            value={field.value}
                            onChange={(zoneId) => {
                              field.onChange(zoneId)
                              frcForm.setValue('circleId', '')
                            }}
                            placeholder="Select Zone..."
                            className="bg-white"
                          />
                        )}
                      />
                    </div>

                    {/* Circle Selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-circle">
                        Circle <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        control={frcForm.control}
                        name="circleId"
                        render={({ field }) => (
                          <div>
                            <CircleSelector
                              id="frc-circle"
                              zoneId={frcForm.watch('zoneId')}
                              value={field.value}
                              onChange={(circleId) => field.onChange(circleId)}
                              placeholder="Select Target Circle..."
                              className="bg-white"
                            />
                            <input
                              type="hidden"
                              data-testid="input-circle-frc"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                        )}
                      />
                      {frcForm.formState.errors.circleId && (
                        <p className="text-xs text-red-500">
                          {frcForm.formState.errors.circleId.message}
                        </p>
                      )}
                    </div>

                    {/* Denomination */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-denomination">
                        Denomination (₹) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="frc-denomination"
                        data-testid="input-denomination-frc"
                        type="number"
                        placeholder="e.g. 100"
                        {...frcForm.register('denomination')}
                      />
                      {frcForm.formState.errors.denomination && (
                        <p className="text-xs text-red-500">
                          {frcForm.formState.errors.denomination.message}
                        </p>
                      )}
                    </div>

                    {/* Seller Commission */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-sellerCommission">
                        Seller Commission (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="frc-sellerCommission"
                        data-testid="input-seller-commission"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5.5"
                        {...frcForm.register('sellerCommission')}
                      />
                      {frcForm.formState.errors.sellerCommission && (
                        <p className="text-xs text-red-500">
                          {frcForm.formState.errors.sellerCommission.message}
                        </p>
                      )}
                    </div>

                    {/* FRA Commission */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-fraCommission">
                        FRA Commission (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="frc-fraCommission"
                        data-testid="input-fra-commission"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 3.0"
                        {...frcForm.register('fraCommission')}
                      />
                      {frcForm.formState.errors.fraCommission && (
                        <p className="text-xs text-red-500">
                          {frcForm.formState.errors.fraCommission.message}
                        </p>
                      )}
                    </div>

                    {/* Sub Commission */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-subCommission">Sub Commission (%)</Label>
                      <Input
                        id="frc-subCommission"
                        data-testid="input-sub-commission"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1.5"
                        {...frcForm.register('subCommission')}
                      />
                      {frcForm.formState.errors.subCommission && (
                        <p className="text-xs text-red-500">
                          {frcForm.formState.errors.subCommission.message}
                        </p>
                      )}
                    </div>

                    {/* TDS */}
                    <div className="space-y-1.5">
                      <Label htmlFor="frc-tds">
                        TDS (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="frc-tds"
                        data-testid="input-tds"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5"
                        {...frcForm.register('tds')}
                      />
                      {frcForm.formState.errors.tds && (
                        <p className="text-xs text-red-500">
                          {frcForm.formState.errors.tds.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <Button
                      type="submit"
                      data-testid="submit-prepaid-frc"
                      disabled={saveFrcMutation.isPending}
                      className="gap-2"
                    >
                      {saveFrcMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save FRC Configuration</span>
                    </Button>
                  </div>
                </FormSection>
              </form>
            )}

            {/* --- OTF FORM --- */}
            {prepaidSubTab === 'otf' && (
              <form
                onSubmit={otfForm.handleSubmit(onOtfSubmit)}
                className="space-y-6"
                data-testid="prepaid-otf-form"
              >
                <FormSection
                  title="Prepaid OTF Commission Configuration (Zone Scoped)"
                  description="Configure On-The-Fly (OTF) recharge commissions scoped across zones and multiple circles."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-category">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        control={otfForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <div>
                            <Select
                              value={field.value ? String(field.value) : undefined}
                              onValueChange={(val) => field.onChange(val || '')}
                            >
                              <SelectTrigger
                                id="otf-category"
                                data-testid="select-category-otf"
                                className="w-full bg-white"
                              >
                                <SelectValue
                                  placeholder={
                                    isLoadingCategories
                                      ? 'Loading categories...'
                                      : 'Select Category...'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem
                                    key={String(cat.categoryId)}
                                    value={String(cat.categoryId)}
                                  >
                                    {cat.categoryName || `Category ${cat.categoryId}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <input
                              type="hidden"
                              data-testid="input-category-otf"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                        )}
                      />
                      {otfForm.formState.errors.categoryId && (
                        <p className="text-xs text-red-500">
                          {otfForm.formState.errors.categoryId.message}
                        </p>
                      )}
                    </div>

                    {/* Zone Selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-zone">
                        Zone <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        control={otfForm.control}
                        name="zoneId"
                        render={({ field }) => (
                          <ZoneSelector
                            id="otf-zone"
                            value={field.value}
                            onChange={(zoneId) => {
                              field.onChange(zoneId)
                              otfForm.setValue('circleId', '')
                            }}
                            placeholder="Select Zone..."
                            className="bg-white"
                          />
                        )}
                      />
                      {otfForm.formState.errors.zoneId && (
                        <p className="text-xs text-red-500">
                          {otfForm.formState.errors.zoneId.message}
                        </p>
                      )}
                    </div>

                    {/* Cascaded Circle Selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-circle">
                        Circle <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        control={otfForm.control}
                        name="circleId"
                        render={({ field }) => (
                          <div>
                            <CircleSelector
                              id="otf-circle"
                              zoneId={otfForm.watch('zoneId')}
                              value={field.value}
                              onChange={(circleId) => field.onChange(circleId)}
                              placeholder="Select Circle..."
                              className="bg-white"
                            />
                            <input
                              type="hidden"
                              data-testid="input-circle-otf"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                        )}
                      />
                      {otfForm.formState.errors.circleId && (
                        <p className="text-xs text-red-500">
                          {otfForm.formState.errors.circleId.message}
                        </p>
                      )}
                    </div>

                    {/* Denomination */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-denomination">
                        Denomination (₹) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="otf-denomination"
                        data-testid="input-denomination-otf"
                        type="number"
                        placeholder="e.g. 200"
                        {...otfForm.register('denomination')}
                      />
                      {otfForm.formState.errors.denomination && (
                        <p className="text-xs text-red-500">
                          {otfForm.formState.errors.denomination.message}
                        </p>
                      )}
                    </div>

                    {/* Seller Commission */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-sellerCommission">
                        Seller Commission (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="otf-sellerCommission"
                        data-testid="input-seller-commission-otf"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 6.0"
                        {...otfForm.register('sellerCommission')}
                      />
                      {otfForm.formState.errors.sellerCommission && (
                        <p className="text-xs text-red-500">
                          {otfForm.formState.errors.sellerCommission.message}
                        </p>
                      )}
                    </div>

                    {/* FRA Commission */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-fraCommission">
                        FRA Commission (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="otf-fraCommission"
                        data-testid="input-fra-commission-otf"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 3.5"
                        {...otfForm.register('fraCommission')}
                      />
                      {otfForm.formState.errors.fraCommission && (
                        <p className="text-xs text-red-500">
                          {otfForm.formState.errors.fraCommission.message}
                        </p>
                      )}
                    </div>

                    {/* Sub Commission */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-subCommission">Sub Commission (%)</Label>
                      <Input
                        id="otf-subCommission"
                        data-testid="input-sub-commission-otf"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2.0"
                        {...otfForm.register('subCommission')}
                      />
                    </div>

                    {/* TDS */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otf-tds">
                        TDS (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="otf-tds"
                        data-testid="input-tds-otf"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5"
                        {...otfForm.register('tds')}
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <Button
                      type="submit"
                      data-testid="submit-prepaid-otf"
                      disabled={saveOtfMutation.isPending}
                      className="gap-2"
                    >
                      {saveOtfMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save OTF Configuration</span>
                    </Button>
                  </div>
                </FormSection>
              </form>
            )}
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: POSTPAID                                           */}
          {/* ========================================================= */}
          <TabsContent value="postpaid" className="space-y-6 w-full">
            <form
              onSubmit={postpaidForm.handleSubmit(onPostpaidSubmit)}
              className="space-y-6"
              data-testid="postpaid-commission-form"
            >
              <FormSection
                title="Postpaid Commission Structure"
                description="Set up postpaid billing commissions, TDS withholdings, seller tier levels, and monthly cap limits."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="postpaid-category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={postpaidForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <div>
                          <Select
                            value={field.value ? String(field.value) : undefined}
                            onValueChange={(val) => field.onChange(val || '')}
                          >
                            <SelectTrigger
                              id="postpaid-category"
                              data-testid="select-category-postpaid"
                              className="w-full bg-white"
                            >
                              <SelectValue
                                placeholder={
                                  isLoadingCategories
                                    ? 'Loading categories...'
                                    : 'Select Category...'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem
                                  key={String(cat.categoryId)}
                                  value={String(cat.categoryId)}
                                >
                                  {cat.categoryName || `Category ${cat.categoryId}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input
                            type="hidden"
                            data-testid="input-category-postpaid"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </div>
                      )}
                    />
                    {postpaidForm.formState.errors.categoryId && (
                      <p className="text-xs text-red-500">
                        {postpaidForm.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  {/* Zone Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="postpaid-zone">Zone</Label>
                    <Controller
                      control={postpaidForm.control}
                      name="zoneId"
                      render={({ field }) => (
                        <ZoneSelector
                          id="postpaid-zone"
                          value={field.value}
                          onChange={(zoneId) => {
                            field.onChange(zoneId)
                            postpaidForm.setValue('circleId', '')
                          }}
                          placeholder="Select Zone..."
                          className="bg-white"
                        />
                      )}
                    />
                  </div>

                  {/* Circle Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="postpaid-circle">
                      Circle <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={postpaidForm.control}
                      name="circleId"
                      render={({ field }) => (
                        <div>
                          <CircleSelector
                            id="postpaid-circle"
                            zoneId={postpaidForm.watch('zoneId')}
                            value={field.value}
                            onChange={(circleId) => field.onChange(circleId)}
                            placeholder="Select Circle..."
                            className="bg-white"
                          />
                          <input
                            type="hidden"
                            data-testid="input-circle-postpaid"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </div>
                      )}
                    />
                    {postpaidForm.formState.errors.circleId && (
                      <p className="text-xs text-red-500">
                        {postpaidForm.formState.errors.circleId.message}
                      </p>
                    )}
                  </div>

                  {/* TDS Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="postpaid-tdsAmount">
                      TDS Amount (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="postpaid-tdsAmount"
                      data-testid="input-tds-amount-postpaid"
                      type="number"
                      placeholder="e.g. 10"
                      {...postpaidForm.register('tdsAmount')}
                    />
                    {postpaidForm.formState.errors.tdsAmount && (
                      <p className="text-xs text-red-500">
                        {postpaidForm.formState.errors.tdsAmount.message}
                      </p>
                    )}
                  </div>

                  {/* Actual Commission */}
                  <div className="space-y-1.5">
                    <Label htmlFor="postpaid-actualCommission">
                      Actual Commission (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="postpaid-actualCommission"
                      data-testid="input-actual-commission"
                      type="number"
                      placeholder="e.g. 50"
                      {...postpaidForm.register('actualCommission')}
                    />
                    {postpaidForm.formState.errors.actualCommission && (
                      <p className="text-xs text-red-500">
                        {postpaidForm.formState.errors.actualCommission.message}
                      </p>
                    )}
                  </div>

                  {/* Seller Level */}
                  <div className="space-y-1.5">
                    <Label htmlFor="postpaid-sellerLevel">
                      Seller Level <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="postpaid-sellerLevel"
                      data-testid="input-seller-level"
                      type="text"
                      placeholder="e.g. 1 or Gold"
                      {...postpaidForm.register('sellerLevel')}
                    />
                    {postpaidForm.formState.errors.sellerLevel && (
                      <p className="text-xs text-red-500">
                        {postpaidForm.formState.errors.sellerLevel.message}
                      </p>
                    )}
                  </div>

                  {/* Cap Limit */}
                  <div className="space-y-1.5">
                    <Label htmlFor="postpaid-cap_limit">
                      Cap Limit (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="postpaid-cap_limit"
                      data-testid="input-cap-limit"
                      type="number"
                      placeholder="e.g. 5000"
                      {...postpaidForm.register('cap_limit')}
                    />
                    {postpaidForm.formState.errors.cap_limit && (
                      <p className="text-xs text-red-500">
                        {postpaidForm.formState.errors.cap_limit.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <Button
                    type="submit"
                    data-testid="submit-postpaid"
                    disabled={savePostpaidMutation.isPending}
                    className="gap-2"
                  >
                    {savePostpaidMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Postpaid Configuration</span>
                  </Button>
                </div>
              </FormSection>
            </form>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 3: LANDLINE                                           */}
          {/* ========================================================= */}
          <TabsContent value="landline" className="space-y-6 w-full">
            <form
              onSubmit={landlineForm.handleSubmit(onLandlineSubmit)}
              className="space-y-6"
              data-testid="landline-commission-form"
            >
              <FormSection
                title="Landline Commission Structure"
                description="Configure tariff bill payment brackets (From - To Amount) and flat commission incentives for Landline channels."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="landline-category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={landlineForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <div>
                          <Select
                            value={field.value ? String(field.value) : undefined}
                            onValueChange={(val) => field.onChange(val || '')}
                          >
                            <SelectTrigger
                              id="landline-category"
                              data-testid="select-category-landline"
                              className="w-full bg-white"
                            >
                              <SelectValue
                                placeholder={
                                  isLoadingCategories
                                    ? 'Loading categories...'
                                    : 'Select Category...'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem
                                  key={String(cat.categoryId)}
                                  value={String(cat.categoryId)}
                                >
                                  {cat.categoryName || `Category ${cat.categoryId}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input
                            type="hidden"
                            data-testid="input-category-landline"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </div>
                      )}
                    />
                    {landlineForm.formState.errors.categoryId && (
                      <p className="text-xs text-red-500">
                        {landlineForm.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  {/* Zone Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="landline-zone">Zone</Label>
                    <Controller
                      control={landlineForm.control}
                      name="zoneId"
                      render={({ field }) => (
                        <ZoneSelector
                          id="landline-zone"
                          value={field.value}
                          onChange={(zoneId) => {
                            field.onChange(zoneId)
                            landlineForm.setValue('circleId', '')
                          }}
                          placeholder="Select Zone..."
                          className="bg-white"
                        />
                      )}
                    />
                  </div>

                  {/* Circle Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="landline-circle">
                      Circle <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={landlineForm.control}
                      name="circleId"
                      render={({ field }) => (
                        <div>
                          <CircleSelector
                            id="landline-circle"
                            zoneId={landlineForm.watch('zoneId')}
                            value={field.value}
                            onChange={(circleId) => field.onChange(circleId)}
                            placeholder="Select Circle..."
                            className="bg-white"
                          />
                          <input
                            type="hidden"
                            data-testid="input-circle-landline"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </div>
                      )}
                    />
                    {landlineForm.formState.errors.circleId && (
                      <p className="text-xs text-red-500">
                        {landlineForm.formState.errors.circleId.message}
                      </p>
                    )}
                  </div>

                  {/* From Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="landline-fromAmount">
                      From Amount (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="landline-fromAmount"
                      data-testid="input-from-amount"
                      type="number"
                      placeholder="e.g. 100"
                      {...landlineForm.register('fromAmount')}
                    />
                    {landlineForm.formState.errors.fromAmount && (
                      <p className="text-xs text-red-500">
                        {landlineForm.formState.errors.fromAmount.message}
                      </p>
                    )}
                  </div>

                  {/* To Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="landline-toAmount">
                      To Amount (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="landline-toAmount"
                      data-testid="input-to-amount"
                      type="number"
                      placeholder="e.g. 1000"
                      {...landlineForm.register('toAmount')}
                    />
                    {landlineForm.formState.errors.toAmount && (
                      <p className="text-xs text-red-500">
                        {landlineForm.formState.errors.toAmount.message}
                      </p>
                    )}
                  </div>

                  {/* Commission Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="landline-commissionAmount">Commission Amount (₹)</Label>
                    <Input
                      id="landline-commissionAmount"
                      data-testid="input-commission-amount"
                      type="number"
                      placeholder="e.g. 25"
                      {...landlineForm.register('commissionAmount')}
                    />
                  </div>

                  {/* TDS Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="landline-tdsAmount">TDS Amount (₹)</Label>
                    <Input
                      id="landline-tdsAmount"
                      data-testid="input-tds-amount-landline"
                      type="number"
                      placeholder="e.g. 5"
                      {...landlineForm.register('tdsAmount')}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <Button
                    type="submit"
                    data-testid="submit-landline"
                    disabled={saveLandlineMutation.isPending}
                    className="gap-2"
                  >
                    {saveLandlineMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Landline Configuration</span>
                  </Button>
                </div>
              </FormSection>
            </form>
          </TabsContent>
        </Tabs>

        {/* Global OTP Verification Modal */}
        {isOtpOpen && (
          <OTPVerificationModal
            open={isOtpOpen}
            onOpenChange={setIsOtpOpen}
            topic={otpTopic}
            msisdn={currentUser?.mobileNumber || '9800000000'}
            actionName={otpActionName}
            onVerified={handleOtpVerified}
            onCancel={() => {
              setIsOtpOpen(false)
              setPendingAction(null)
            }}
          />
        )}
      </div>
    </PermissionGuard>
  )
}
