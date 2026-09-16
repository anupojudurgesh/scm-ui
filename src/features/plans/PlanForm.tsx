import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormSection } from '@/components/forms/FormSection'
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
import { useAllCirclesQuery } from '@/api/masterdata.api'
import {
  useAddPlanMutation,
  useUpdatePlanMutation,
  type Plan,
  type AddPlanPayload,
} from '@/api/plan.api'
import { planSchema, type PlanFormValues } from '@/schemas/plan.schema'
import { Loader2, Radio, AlertCircle } from 'lucide-react'

export interface PlanFormProps {
  initialData?: Plan | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PlanForm({ initialData, onSuccess, onCancel }: PlanFormProps) {
  const currentUser = useAuthStore((state) => state.user)
  const isEdit = Boolean(initialData)

  const { data: circles = [] } = useAllCirclesQuery()
  const addPlanMutation = useAddPlanMutation()
  const updatePlanMutation = useUpdatePlanMutation()

  // Form setup
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      operator: initialData?.operator || 'BSNL',
      denomination: initialData?.denomination ? String(initialData.denomination) : '',
      talkvalue: initialData?.talkvalue ? String(initialData.talkvalue) : '',
      country: initialData?.country || 'India',
      start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
      end_date: initialData?.end_date || '2026-12-31',
      type: initialData?.type || 'STV',
      description: initialData?.description || '',
      tab_name: initialData?.tab_name || 'STV',
      circle: initialData?.circle || 'AP',
      validity: initialData?.validity ? String(initialData.validity) : '28',
      from_date: initialData?.from_date || new Date().toISOString().split('T')[0],
      to_date: initialData?.to_date || '2026-12-31',
    },
  })

  // OTP flow states
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [pendingPayload, setPendingPayload] = React.useState<PlanFormValues | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // Target MSISDN for OTP verification
  const targetMsisdn = (currentUser as { mobileNumber?: string })?.mobileNumber || '9876543210'

  // Decide OTP topic: 'Addplan' for create, 'ModifyPlan' for edit
  const otpTopic = isEdit ? 'ModifyPlan' : 'Addplan'
  const actionName = isEdit ? `Modify Plan (${initialData?.sno})` : 'Create Product Plan'

  const handleFormSubmit = form.handleSubmit(
    (values) => {
      setSubmitError(null)
      setPendingPayload(values)
      setIsOtpOpen(true)
    },
    (errors) => {
      console.error('PLAN FORM VALIDATION ERRORS:', JSON.stringify(errors, null, 2))
    }
  )

  const handleOtpVerified = async () => {
    if (!pendingPayload) return

    try {
      if (isEdit && initialData?.sno) {
        await updatePlanMutation.mutateAsync({
          sno: initialData.sno,
          payload: { ...pendingPayload, sno: initialData.sno },
          username: currentUser?.username,
        })
        toast.add?.({
          title: 'Plan Updated',
          description: `Plan ${initialData.sno} modified successfully`,
          type: 'success',
        })
      } else {
        await addPlanMutation.mutateAsync({
          payload: pendingPayload as AddPlanPayload,
          username: currentUser?.username,
        })
        toast.add?.({
          title: 'Plan Created',
          description: 'New product plan added successfully',
          type: 'success',
        })
      }

      setIsOtpOpen(false)
      setPendingPayload(null)
      onSuccess?.()
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Failed to save plan'
      setSubmitError(errorMsg)
      toast.add?.({
        title: 'Operation Failed',
        description: errorMsg,
        type: 'error',
      })
    }
  }

  const isSubmitting = addPlanMutation.isPending || updatePlanMutation.isPending

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" data-testid="plan-form">
      {submitError && (
        <div
          role="alert"
          className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Operation Failed</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* Section 1: Classification & Operator */}
      <FormSection
        title="Tariff Classification"
        description="Select the telecom operator, circle, and product category grouping"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="operator" className="text-xs font-medium text-slate-700">
              Operator <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="operator"
              placeholder="e.g. BSNL"
              {...form.register('operator')}
              className="h-9 text-xs"
              data-testid="input-operator"
            />
            {form.formState.errors.operator && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.operator.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="circle" className="text-xs font-medium text-slate-700">
              Circle <span className="text-rose-500">*</span>
            </Label>
            <Controller
              name="circle"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="circle"
                    className="h-9 text-xs bg-white"
                    data-testid="select-circle"
                  >
                    <SelectValue placeholder="Select Circle" />
                  </SelectTrigger>
                  <SelectContent>
                    {circles.map((c) => (
                      <SelectItem key={c.circleId} value={String(c.circleId)}>
                        {c.circleName}
                      </SelectItem>
                    ))}
                    {circles.length === 0 && (
                      <>
                        <SelectItem value="AP">AP (Andhra Pradesh)</SelectItem>
                        <SelectItem value="TS">TS (Telangana)</SelectItem>
                        <SelectItem value="TN">TN (Tamil Nadu)</SelectItem>
                        <SelectItem value="DL">DL (Delhi)</SelectItem>
                        <SelectItem value="MH">MH (Maharashtra)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.circle && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.circle.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-xs font-medium text-slate-700">
              Plan Type <span className="text-rose-500">*</span>
            </Label>
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="type"
                    className="h-9 text-xs bg-white"
                    data-testid="select-type"
                  >
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STV">STV (Special Tariff)</SelectItem>
                    <SelectItem value="Unlimited">Unlimited Pack</SelectItem>
                    <SelectItem value="Prepaid">Prepaid General</SelectItem>
                    <SelectItem value="TopUp">Pure TopUp</SelectItem>
                    <SelectItem value="Annual">Annual Plan</SelectItem>
                    <SelectItem value="Data">Data Voucher</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.type && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tab_name" className="text-xs font-medium text-slate-700">
              Tab Identifier <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="tab_name"
              placeholder="e.g. STV, PV, TopUp"
              {...form.register('tab_name')}
              className="h-9 text-xs"
              data-testid="input-tab-name"
            />
            {form.formState.errors.tab_name && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.tab_name.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Section 2: Financial & Value Parameters */}
      <FormSection
        title="Value & Validity Parameters"
        description="Denomination price, talktime quota, and plan lifetime"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="denomination" className="text-xs font-medium text-slate-700">
              Denomination / MRP (₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="denomination"
              type="number"
              step="any"
              placeholder="199"
              {...form.register('denomination')}
              className="h-9 text-xs"
              data-testid="input-denomination"
            />
            {form.formState.errors.denomination && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.denomination.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="talkvalue" className="text-xs font-medium text-slate-700">
              Talk Value (₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="talkvalue"
              type="number"
              step="any"
              placeholder="199"
              {...form.register('talkvalue')}
              className="h-9 text-xs"
              data-testid="input-talkvalue"
            />
            {form.formState.errors.talkvalue && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.talkvalue.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="validity" className="text-xs font-medium text-slate-700">
              Validity (Days) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="validity"
              type="number"
              placeholder="28"
              {...form.register('validity')}
              className="h-9 text-xs"
              data-testid="input-validity"
            />
            {form.formState.errors.validity && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.validity.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Section 3: Schedule & Lifecycle Windows */}
      <FormSection
        title="Validity & Schedule Windows"
        description="Effective launch dates and recharge availability range"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date" className="text-xs font-medium text-slate-700">
              Start Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="start_date"
              type="date"
              {...form.register('start_date')}
              className="h-9 text-xs"
              data-testid="input-start-date"
            />
            {form.formState.errors.start_date && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.start_date.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end_date" className="text-xs font-medium text-slate-700">
              End Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="end_date"
              type="date"
              {...form.register('end_date')}
              className="h-9 text-xs"
              data-testid="input-end-date"
            />
            {form.formState.errors.end_date && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.end_date.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="from_date" className="text-xs font-medium text-slate-700">
              From Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="from_date"
              type="date"
              {...form.register('from_date')}
              className="h-9 text-xs"
              data-testid="input-from-date"
            />
            {form.formState.errors.from_date && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.from_date.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="to_date" className="text-xs font-medium text-slate-700">
              To Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="to_date"
              type="date"
              {...form.register('to_date')}
              className="h-9 text-xs"
              data-testid="input-to-date"
            />
            {form.formState.errors.to_date && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.to_date.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Section 4: Metadata & Description */}
      <FormSection
        title="Description & Regional Metadata"
        description="Customer-facing description and country designation"
      >
        <div className="space-y-4">
          <div className="w-full sm:w-1/3 space-y-1.5">
            <Label htmlFor="country" className="text-xs font-medium text-slate-700">
              Country <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="country"
              placeholder="India"
              {...form.register('country')}
              className="h-9 text-xs"
              data-testid="input-country"
            />
            {form.formState.errors.country && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.country.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-slate-700">
              Plan Description <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Provide a comprehensive breakdown of voice, data quotas, SMS allowances, and OTT bundles..."
              {...form.register('description')}
              className="text-xs"
              data-testid="input-description"
            />
            {form.formState.errors.description && (
              <p className="text-[11px] text-rose-600">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs"
            data-testid="btn-cancel"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 flex items-center gap-1.5 shadow-sm"
          data-testid="btn-submit-plan"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Radio className="h-3.5 w-3.5" />
              <span>{isEdit ? 'Update Plan (OTP Required)' : 'Save Plan (OTP Required)'}</span>
            </>
          )}
        </Button>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        open={isOtpOpen}
        onOpenChange={(open) => {
          setIsOtpOpen(open)
          if (!open) setPendingPayload(null)
        }}
        onVerified={handleOtpVerified}
        topic={otpTopic}
        msisdn={targetMsisdn}
        actionName={actionName}
      />
    </form>
  )
}
