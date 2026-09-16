import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormSection } from '@/components/forms/FormSection'
import { ZoneSelector } from '@/components/forms/ZoneSelector'
import { CircleSelector } from '@/components/forms/CircleSelector'
import { SSASelector } from '@/components/forms/SSASelector'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  useDealerTypesQuery,
  useCategoriesByDealerTypeQuery,
  useCreateDealerMutation,
  type CreateDealerPayload,
} from '@/api/dealer.api'
import {
  createDealerSchema,
  type CreateDealerFormValues,
} from '@/schemas/dealer.schema'
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'


export interface CreateDealerFormProps {
  defaultValues?: Partial<CreateDealerFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateDealerForm({ defaultValues, onSuccess, onCancel }: CreateDealerFormProps) {
  const currentUser = useAuthStore((state) => state.user)

  // Master Data Queries
  const { data: dealerTypes = [], isLoading: isLoadingTypes } = useDealerTypesQuery()
  const createDealerMutation = useCreateDealerMutation()

  // Selected file state for KYC certificate
  const [selectedFile, setSelectedFile] = React.useState<File | null>(defaultValues?.certificate || null)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Geographic selector states
  const [selectedZoneId, setSelectedZoneId] = React.useState<string>('')

  // Form setup
  const form = useForm<CreateDealerFormValues>({
    resolver: zodResolver(createDealerSchema),
    defaultValues: {
      firstName: defaultValues?.firstName || '',
      lastName: defaultValues?.lastName || '',
      mobile: defaultValues?.mobile || '',
      dob: defaultValues?.dob || '',
      address: defaultValues?.address || '',
      dealerType: defaultValues?.dealerType ? String(defaultValues.dealerType) : '',
      circleId: defaultValues?.circleId ? String(defaultValues.circleId) : '',
      ssaId: defaultValues?.ssaId ? String(defaultValues.ssaId) : '',
      category: defaultValues?.category ? String(defaultValues.category) : '',
      aadhaarId: defaultValues?.aadhaarId || '',
      panId: defaultValues?.panId || '',
      gstNumber: defaultValues?.gstNumber || '',
    },
  })


  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form

  const watchedDealerType = watch('dealerType')

  // Categories query based on selected dealerType
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategoriesByDealerTypeQuery(watchedDealerType, {
      enabled: Boolean(watchedDealerType),
    })

  // OTP Modal State
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [pendingValues, setPendingValues] = React.useState<CreateDealerFormValues | null>(null)

  // Feedback banners
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size cannot exceed 5MB')
      return
    }

    // Validate type (PDF, PNG, JPG, JPEG)
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF and image formats (PNG, JPG) are supported')
      return
    }

    setSelectedFile(file)
    setValue('certificate', file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileError(null)
    setValue('certificate', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Pre-submission handler: validates and triggers OTP modal
  const onSubmit = (values: CreateDealerFormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setPendingValues(values)
    setIsOtpOpen(true)
  }

  // Post-OTP verification execution: builds FormData and calls mutation
  const handleOtpVerified = async () => {
    if (!pendingValues) return

    try {
      const payload: CreateDealerPayload = {
        firstName: pendingValues.firstName,
        lastName: pendingValues.lastName,
        mobile: pendingValues.mobile,
        dob: pendingValues.dob,
        address: pendingValues.address,
        dealerType: pendingValues.dealerType,
        circleId: pendingValues.circleId,
        ssaId: pendingValues.ssaId,
        category: pendingValues.category,
        aadhaarId: pendingValues.aadhaarId,
        panId: pendingValues.panId,
        gstNumber: pendingValues.gstNumber,
        certificate: selectedFile,
      }

      await createDealerMutation.mutateAsync({
        payload,
        certificateFile: selectedFile || undefined,
      })

      const msg = `Dealer entity for ${pendingValues.firstName} ${pendingValues.lastName} created successfully.`
      setSuccessMessage(msg)
      try {
        toast.add?.({ title: 'Dealer Created', description: msg, type: 'success' })
      } catch {
        // Fallback
      }

      reset()
      handleRemoveFile()
      setIsOtpOpen(false)
      setPendingValues(null)
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create dealer account.'
      setErrorMessage(msg)
      try {
        toast.add?.({ title: 'Creation Failed', description: msg, type: 'error' })
      } catch {
        // Fallback
      }
    }
  }

  return (
    <div className="space-y-6" data-testid="create-dealer-form-container">
      {/* Global Status Banners */}
      {successMessage && (
        <div
          className="flex items-center gap-2.5 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs sm:text-sm animate-in fade-in"
          data-testid="create-dealer-success-banner"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs sm:text-sm animate-in fade-in"
          data-testid="create-dealer-error-banner"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="create-dealer-form">
        {/* Section 1: Basic & Contact Details */}
        <FormSection
          title="Personal & Contact Information"
          description="Principal owner identity, registered mobile contact, and date of birth."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold text-slate-700">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="e.g. Ramesh"
                {...register('firstName')}
                disabled={isSubmitting || createDealerMutation.isPending}
                className="h-9 text-xs"
                data-testid="dealer-first-name-input"
              />
              {errors.firstName && (
                <p className="text-[11px] text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="e.g. Kumar"
                {...register('lastName')}
                disabled={isSubmitting || createDealerMutation.isPending}
                className="h-9 text-xs"
                data-testid="dealer-last-name-input"
              />
              {errors.lastName && (
                <p className="text-[11px] text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mobile" className="text-xs font-semibold text-slate-700">
                Registered Mobile (SCM MSISDN) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="10-digit number (e.g. 9811002233)"
                {...register('mobile')}
                disabled={isSubmitting || createDealerMutation.isPending}
                className="h-9 text-xs font-mono"
                data-testid="dealer-mobile-input"
              />
              {errors.mobile && (
                <p className="text-[11px] text-red-600">{errors.mobile.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-semibold text-slate-700">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dob"
                type="date"
                {...register('dob')}
                disabled={isSubmitting || createDealerMutation.isPending}
                className="h-9 text-xs"
                data-testid="dealer-dob-input"
              />
              {errors.dob && (
                <p className="text-[11px] text-red-600">{errors.dob.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 2: Classification & Regional Jurisdiction */}
        <FormSection
          title="Classification & Jurisdiction"
          description="Entity role tier, operational category, and geographical jurisdiction mapping."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dealer Type */}
            <div className="space-y-1.5">
              <Label htmlFor="dealerType" className="text-xs font-semibold text-slate-700">
                Dealer Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="dealerType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val ?? '')
                      setValue('category', '')
                    }}
                    disabled={isLoadingTypes || isSubmitting}
                  >
                    <SelectTrigger
                      id="dealerType"
                      className="h-9 text-xs bg-white border-slate-200"
                      data-testid="dealer-type-select"
                    >
                      <SelectValue placeholder="Select Dealer Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealerTypes.map((t) => (
                        <SelectItem key={t.dealerTypeId} value={String(t.dealerTypeId)}>
                          {t.dealerTypeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.dealerType && (
                <p className="text-[11px] text-red-600">{errors.dealerType.message}</p>
              )}
            </div>

            {/* Category (dynamically filtered by dealerType) */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                Category <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val ?? '')}
                    disabled={!watchedDealerType || isLoadingCategories || isSubmitting}
                  >
                    <SelectTrigger
                      id="category"
                      className="h-9 text-xs bg-white border-slate-200"
                      data-testid="dealer-category-select"
                    >
                      <SelectValue
                        placeholder={
                          !watchedDealerType ? 'Select Dealer Type First' : 'Select Category'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.categoryId} value={String(c.categoryId)}>
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-[11px] text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Zone Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Zone</Label>
              <ZoneSelector
                value={selectedZoneId}
                onChange={(val) => {
                  setSelectedZoneId(val)
                  setValue('circleId', '')
                  setValue('ssaId', '')
                }}
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            {/* Circle Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Circle <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="circleId"
                render={({ field }) => (
                  <CircleSelector
                    zoneId={selectedZoneId}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val)
                      setValue('ssaId', '')
                    }}
                    disabled={!selectedZoneId || isSubmitting}
                    className="w-full"
                  />
                )}
              />
              {errors.circleId && (
                <p className="text-[11px] text-red-600">{errors.circleId.message}</p>
              )}
            </div>

            {/* SSA Selector */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">
                SSA (Secondary Switching Area) <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="ssaId"
                render={({ field }) => (
                  <SSASelector
                    circleId={watch('circleId')}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!watch('circleId') || isSubmitting}
                    className="w-full"
                  />
                )}
              />
              {errors.ssaId && (
                <p className="text-[11px] text-red-600">{errors.ssaId.message}</p>
              )}
            </div>

          </div>
        </FormSection>

        {/* Section 3: Compliance, Tax & Physical Address */}
        <FormSection
          title="Tax & Physical Verification"
          description="Statutory tax credentials, identity proof, and physical operational address."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="panId" className="text-xs font-semibold text-slate-700">
                PAN Number
              </Label>
              <Input
                id="panId"
                placeholder="e.g. ABCDE1234F"
                {...register('panId')}
                disabled={isSubmitting}
                className="h-9 text-xs uppercase font-mono"
                data-testid="dealer-pan-input"
              />
              {errors.panId && (
                <p className="text-[11px] text-red-600">{errors.panId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aadhaarId" className="text-xs font-semibold text-slate-700">
                Aadhaar Number
              </Label>
              <Input
                id="aadhaarId"
                placeholder="12 numeric digits"
                {...register('aadhaarId')}
                disabled={isSubmitting}
                className="h-9 text-xs font-mono"
                data-testid="dealer-aadhaar-input"
              />
              {errors.aadhaarId && (
                <p className="text-[11px] text-red-600">{errors.aadhaarId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gstNumber" className="text-xs font-semibold text-slate-700">
                GSTIN Number
              </Label>
              <Input
                id="gstNumber"
                placeholder="15-digit GSTIN"
                {...register('gstNumber')}
                disabled={isSubmitting}
                className="h-9 text-xs uppercase font-mono"
                data-testid="dealer-gst-input"
              />
              {errors.gstNumber && (
                <p className="text-[11px] text-red-600">{errors.gstNumber.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                Operational Business Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Building, Shop No., Street, City, Pincode"
                rows={2}
                {...register('address')}
                disabled={isSubmitting}
                className="text-xs resize-none"
                data-testid="dealer-address-input"
              />
              {errors.address && (
                <p className="text-[11px] text-red-600">{errors.address.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 4: KYC Certificate Attachment (Multipart File Upload) */}
        <FormSection
          title="KYC Document Attachment"
          description="Upload authorized verification document or business trade certificate (PDF, PNG, JPG up to 5MB)."
        >
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              id="certificate-file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
              data-testid="dealer-certificate-input"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-cyan-500/50 hover:bg-cyan-50/20 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group"
                data-testid="file-upload-dropzone"
              >
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors mb-2">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700 group-hover:text-cyan-800">
                  Click to choose or drag & drop certificate document
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supported formats: PDF, PNG, JPG (Maximum 5MB)
                </p>
              </div>
            ) : (
              <div
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                data-testid="selected-file-preview"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-blue-700 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate" data-testid="selected-file-name">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  data-testid="remove-file-btn"
                  aria-label="Remove certificate"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {fileError && (
              <p className="text-[11px] text-red-600 flex items-center gap-1" data-testid="file-error-msg">
                <AlertCircle className="h-3 w-3" />
                {fileError}
              </p>
            )}
          </div>
        </FormSection>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting || createDealerMutation.isPending}
              data-testid="cancel-create-dealer-btn"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || createDealerMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-36"
            data-testid="submit-create-dealer-btn"
          >
            {createDealerMutation.isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Proceed to OTP
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Security OTP Modal with Topic 'Dealercreation' */}
      {isOtpOpen && (
        <OTPVerificationModal
          open={isOtpOpen}
          onOpenChange={setIsOtpOpen}
          topic="Dealercreation"
          actionName="Create New Dealer Account"
          msisdn={currentUser?.mobileNumber || pendingValues?.mobile || '9876543210'}
          onVerified={handleOtpVerified}
        />
      )}
    </div>
  )
}
