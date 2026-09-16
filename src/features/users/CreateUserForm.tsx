import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createUserSchema,
  type CreateUserFormValues,
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  type UserPermissionField,
} from '@/schemas/user.schema'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormSection } from '@/components/forms/FormSection'
import { ZoneSelector } from '@/components/forms/ZoneSelector'
import { CircleSelector } from '@/components/forms/CircleSelector'
import { SSASelector } from '@/components/forms/SSASelector'
import { OTPVerificationModal } from '@/components/forms/OTPVerificationModal'
import { toast } from '@/components/ui/toast'
import {
  useCreateUserMutation,
  type CreateUserPayload,
  type CreateUserResponse,
} from '@/api/user.api'
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
} from 'lucide-react'

export interface CreateUserFormProps {
  onSuccess?: (data: CreateUserResponse) => void;
  onCancel?: () => void;
  className?: string;
  defaultValues?: Partial<CreateUserFormValues>;
}

export function CreateUserForm({
  onSuccess,
  onCancel,
  className,
  defaultValues,
}: CreateUserFormProps) {
  const [isOtpOpen, setIsOtpOpen] = React.useState(false)
  const [pendingValues, setPendingValues] = React.useState<CreateUserFormValues | null>(null)
  const [submissionError, setSubmissionError] = React.useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = React.useState<string | null>(null)

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: {
      hrmsId: '',
      username: '',
      mobileNumber: '',
      firstName: '',
      lastName: '',
      address: '',
      dob: '',
      roleId: 2,
      zoneId: 0,
      circleId: 0,
      ssaId: 0,
      password: '',
      status: 'Active',
      permissions: PERMISSION_KEYS.reduce((acc, key) => {
        acc[key] = false
        return acc
      }, {} as Record<string, boolean>),
      ...defaultValues,
    },
    mode: 'onTouched',
  })

  const createUserMutation = useCreateUserMutation()
  const isBusy = form.formState.isSubmitting || createUserMutation.isPending

  // Watch location IDs for cascading behavior
  const selectedZoneId = form.watch('zoneId')
  const selectedCircleId = form.watch('circleId')

  // Step 1: Form submission initiates OTP verification modal (DOES NOT CALL API DIRECTLY)
  const handleFormSubmit = (values: CreateUserFormValues) => {
    setSubmissionError(null)
    setSubmissionSuccess(null)
    setPendingValues(values)
    setIsOtpOpen(true)
  }

  // Step 2: Only called once the OTP validation successfully resolves
  const handleOtpVerified = async () => {
    if (!pendingValues) return

    // Transform boolean permissions dictionary to backend integer flags (1 or 0)
    const formattedPermissions: Record<string, number> = {}
    PERMISSION_KEYS.forEach((key) => {
      formattedPermissions[key] = pendingValues.permissions?.[key] ? 1 : 0
    })

    const payload: CreateUserPayload = {
      hrmsId: pendingValues.hrmsId.trim(),
      username: pendingValues.username.trim(),
      mobileNumber: pendingValues.mobileNumber.trim(),
      firstName: pendingValues.firstName.trim(),
      lastName: pendingValues.lastName.trim(),
      address: pendingValues.address.trim(),
      dob: pendingValues.dob,
      roleId: Number(pendingValues.roleId),
      zoneId: Number(pendingValues.zoneId),
      circleId: Number(pendingValues.circleId),
      ssaId: Number(pendingValues.ssaId),
      password: pendingValues.password,
      status: pendingValues.status || 'Active',
      permissions: formattedPermissions,
    }

    try {
      const response = await createUserMutation.mutateAsync(payload)

      const successMsg = `Operator account for ${payload.username} (${payload.hrmsId}) created successfully.`
      setSubmissionSuccess(successMsg)

      try {
        toast.add?.({
          title: 'User Created',
          description: successMsg,
          type: 'success',
        })
      } catch {
        // Safe toast handling
      }

      form.reset()
      setPendingValues(null)
      setIsOtpOpen(false)
      onSuccess?.(response)
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to create user account.'
      setSubmissionError(errorMsg)

      try {
        toast.add?.({
          title: 'User Creation Failed',
          description: errorMsg,
          type: 'error',
        })
      } catch {
        // Safe toast handling
      }
    }
  }

  // Quick helper to batch toggle permissions
  const handleSelectAllGroupPermissions = (
    groupKeys: UserPermissionField[],
    grant: boolean
  ) => {
    groupKeys.forEach((key) => {
      form.setValue(`permissions.${key}`, grant, { shouldDirty: true })
    })
  }

  const handleSelectAllPermissions = (grant: boolean) => {
    PERMISSION_KEYS.forEach((key) => {
      form.setValue(`permissions.${key}`, grant, { shouldDirty: true })
    })
  }

  return (
    <div className={className} data-testid="create-user-form-container">
      {/* Submission Feedback Banners */}
      {submissionSuccess && (
        <div
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-xs flex items-center gap-2.5"
          data-testid="create-user-success-banner"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{submissionSuccess}</span>
        </div>
      )}

      {submissionError && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-xs flex items-center gap-2.5"
          data-testid="create-user-error-banner"
        >
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="font-medium">{submissionError}</span>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
          data-testid="create-user-form"
        >
          {/* Section 1: Basic Details */}
          <FormSection
            title="Basic Details"
            description="Enter HRMS employee identification, credentials, and full legal name."
            data-testid="section-basic-details"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* HRMS ID */}
              <FormField
                control={form.control}
                name="hrmsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HRMS ID *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. HRMS1048"
                        disabled={isBusy}
                        data-testid="input-hrmsId"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. rajesh.kumar"
                        disabled={isBusy}
                        data-testid="input-username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mobile Number */}
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number (OTP Target) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10-digit number (e.g. 9848022334)"
                        disabled={isBusy}
                        maxLength={10}
                        data-testid="input-mobileNumber"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="First Name"
                        disabled={isBusy}
                        data-testid="input-firstName"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Last Name"
                        disabled={isBusy}
                        data-testid="input-lastName"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* System Role */}
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Role *</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isBusy}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        data-testid="select-roleId"
                      >
                        <option value={1}>System Administrator</option>
                        <option value={2}>Circle Manager</option>
                        <option value={3}>Finance Officer</option>
                        <option value={4}>Franchise Auditor</option>
                        <option value={5}>Support Operator</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Section 2: Location (Cascading Geographies) */}
          <FormSection
            title="Location"
            description="Assign operational jurisdiction: selecting a Zone unlocks Circles, and selecting a Circle unlocks SSAs."
            data-testid="section-location"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Zone Selector */}
              <FormField
                control={form.control}
                name="zoneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone *</FormLabel>
                    <FormControl>
                      <ZoneSelector
                        value={field.value || undefined}
                        onChange={(newZone) => {
                          const num = Number(newZone)
                          field.onChange(num)
                          // Reset child cascading selections
                          form.setValue('circleId', 0, { shouldValidate: true })
                          form.setValue('ssaId', 0, { shouldValidate: true })
                        }}
                        disabled={isBusy}
                        placeholder="Select Zone..."
                        className="h-9 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Circle Selector */}
              <FormField
                control={form.control}
                name="circleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Circle *</FormLabel>
                    <FormControl>
                      <CircleSelector
                        zoneId={selectedZoneId || null}
                        value={field.value || undefined}
                        onChange={(newCircle) => {
                          const num = Number(newCircle)
                          field.onChange(num)
                          form.setValue('ssaId', 0, { shouldValidate: true })
                        }}
                        disabled={isBusy || !selectedZoneId}
                        placeholder="Select Circle..."
                        className="h-9 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SSA Selector */}
              <FormField
                control={form.control}
                name="ssaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SSA (Secondary Switching Area) *</FormLabel>
                    <FormControl>
                      <SSASelector
                        circleId={selectedCircleId || null}
                        value={field.value || undefined}
                        onChange={(newSsa) => {
                          field.onChange(Number(newSsa))
                        }}
                        disabled={isBusy || !selectedCircleId}
                        placeholder="Select SSA..."
                        className="h-9 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Section 3: Account Credentials & Metadata */}
          <FormSection
            title="Account"
            description="Configure initial authentication password, lifecycle status, date of birth, and postal address."
            data-testid="section-account"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit"
                        disabled={isBusy}
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Status *</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isBusy}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        data-testid="select-status"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth */}
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth (YYYY-MM-DD) *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isBusy}
                        data-testid="input-dob"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Physical Address */}
              <div className="sm:col-span-2 lg:col-span-3">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical / Office Address *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Complete office address, building, or exchange location"
                          disabled={isBusy}
                          data-testid="input-address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* Section 4: Permissions (32-Key Bitmask Matrix) */}
          <FormSection
            title="Permissions"
            description="Assign granular operational permissions across domain modules."
            data-testid="section-permissions"
            action={
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllPermissions(true)}
                  disabled={isBusy}
                  className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 border-slate-200"
                  data-testid="btn-grant-all-permissions"
                >
                  <CheckSquare className="h-3 w-3 mr-1 text-cyan-600" />
                  Grant All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllPermissions(false)}
                  disabled={isBusy}
                  className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 border-slate-200"
                  data-testid="btn-clear-all-permissions"
                >
                  <Square className="h-3 w-3 mr-1 text-slate-400" />
                  Clear All
                </Button>
              </div>
            }
          >
            <div className="space-y-6 pt-1">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.keys.map((k) => k.key)

                return (
                  <div
                    key={group.title}
                    className="rounded-lg border border-slate-200/80 bg-white p-4 space-y-3"
                    data-testid={`permission-group-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-heading">
                          {group.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">{group.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectAllGroupPermissions(groupKeys, true)}
                          disabled={isBusy}
                          className="text-[10px] text-cyan-700 hover:underline px-1 py-0.5"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => handleSelectAllGroupPermissions(groupKeys, false)}
                          disabled={isBusy}
                          className="text-[10px] text-slate-500 hover:underline px-1 py-0.5"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.keys.map(({ key, label, description }) => (
                        <Controller
                          key={key}
                          control={form.control}
                          name={`permissions.${key}`}
                          render={({ field }) => (
                            <label
                              htmlFor={`perm-${key}`}
                              className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                            >
                              <Checkbox
                                id={`perm-${key}`}
                                checked={Boolean(field.value)}
                                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                                disabled={isBusy}
                                className="mt-0.5"
                                data-testid={`checkbox-${key}`}
                              />
                              <div className="space-y-0.5 text-left">
                                <span className="text-xs font-medium text-slate-900 block leading-tight">
                                  {label}
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-tight">
                                  {description}
                                </span>
                              </div>
                            </label>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </FormSection>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isBusy}
                className="h-10 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                data-testid="create-user-cancel"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isBusy}
              className="h-10 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
              data-testid="create-user-reset"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Reset Form
            </Button>

            <Button
              type="submit"
              disabled={isBusy}
              className="h-10 px-6 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white transition-colors duration-150 ease-out"
              data-testid="create-user-submit"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span>Proceed to OTP Verification</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* OTP Verification Modal: Gating the actual createUser API Mutation */}
      {pendingValues && (
        <OTPVerificationModal
          open={isOtpOpen}
          onOpenChange={(open) => {
            setIsOtpOpen(open)
            if (!open) {
              setPendingValues(null)
            }
          }}
          topic="UserCreation"
          actionName="Create SCM User"
          msisdn={pendingValues.mobileNumber}
          onVerified={handleOtpVerified}
          onCancel={() => {
            setIsOtpOpen(false)
            setPendingValues(null)
          }}
        />
      )}
    </div>
  )
}
