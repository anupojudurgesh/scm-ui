import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOtpFlow } from '@/hooks/useOtpFlow'
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OTPVerificationModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  topic: string;
  msisdn: string;
  actionName: string;
  onVerified: () => void | Promise<void>;
  onCancel?: () => void;
  autoSendOnOpen?: boolean;
  className?: string;
}

export function OTPVerificationModal({
  open = true,
  onOpenChange,
  topic,
  msisdn,
  actionName,
  onVerified,
  onCancel,
  autoSendOnOpen = true,
  className,
}: OTPVerificationModalProps) {
  const [countdown, setCountdown] = React.useState<number>(0)
  const [localCode, setLocalCode] = React.useState<string>('')

  const flow = useOtpFlow({
    onSuccess: async () => {
      await onVerified()
      onOpenChange?.(false)
    },
  })

  // Start the flow and optionally trigger sendOtp when the modal opens
  React.useEffect(() => {
    if (open && (flow.isIdle || flow.context?.topic !== topic || flow.context?.msisdn !== msisdn)) {
      setLocalCode('')
      flow.start({
        topic,
        msisdn,
        actionName,
        autoSend: autoSendOnOpen,
      })
      if (autoSendOnOpen) {
        setCountdown(30)
      }
    }
  }, [open, topic, msisdn, actionName, autoSendOnOpen])

  // Countdown timer for Resend button
  React.useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const handleClose = () => {
    flow.reset()
    onCancel?.()
    onOpenChange?.(false)
  }

  const handleResend = async () => {
    const sent = await flow.resendOtp()
    if (sent) {
      setCountdown(30)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!localCode.trim() || flow.isValidating || flow.isSuccess) {
      return
    }
    await flow.submitOtp(localCode.trim())
  }

  // Mask MSISDN for privacy: e.g. 9876543210 -> 98******10
  const maskedMsisdn = React.useMemo(() => {
    if (!msisdn) return ''
    if (msisdn.length <= 4) return msisdn
    const start = msisdn.slice(0, 2)
    const end = msisdn.slice(-2)
    return `${start}${'*'.repeat(Math.max(2, msisdn.length - 4))}${end}`
  }, [msisdn])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className={cn('sm:max-w-md', className)}
        data-testid="otp-verification-modal"
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Security Authorization
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Authorize <span className="font-medium text-slate-700">{actionName}</span> via code sent to{' '}
                <strong className="font-semibold text-slate-700" data-testid="masked-msisdn">
                  {maskedMsisdn || msisdn}
                </strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Status Feedback Banner */}
          {(flow.isFailure || Boolean(flow.errorMessage)) && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-800"
              role="alert"
              data-testid="otp-error-alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium">Verification Failed</p>
                <p className="mt-0.5 text-red-700">{flow.errorMessage || 'Invalid OTP. Please try again.'}</p>
              </div>
            </div>
          )}

          {flow.isSuccess && (
            <div
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
              data-testid="otp-success-alert"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>OTP verified successfully! Executing {actionName}...</span>
            </div>
          )}

          {flow.isConfirming && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <span>Ready to dispatch OTP to registered number.</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => flow.sendOtp()}
                data-testid="otp-send-now-btn"
              >
                Send OTP
              </Button>
            </div>
          )}

          {flow.isOtpSent && (
            <p className="text-xs text-slate-600">
              Enter the 6-digit OTP dispatched to{' '}
              <strong className="text-slate-800 font-semibold">{maskedMsisdn || msisdn}</strong>.
            </p>
          )}

          {/* OTP Code Input */}
          <div className="space-y-1.5">
            <Label htmlFor="otp-input" className="text-xs font-medium text-slate-700">
              Verification Code (OTP)
            </Label>
            <Input
              id="otp-input"
              data-testid="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={localCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setLocalCode(val)
                flow.setOtpCode(val)
              }}
              disabled={flow.isValidating || flow.isSuccess}
              className="text-center font-mono text-lg tracking-[0.4em] h-11"
              autoFocus
            />
          </div>

          {/* Resend Action Option */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Status:{' '}
              <span className="font-medium text-slate-700 capitalize" data-testid="otp-status-indicator">
                {flow.status}
              </span>
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={countdown > 0 || flow.isValidating || flow.isSuccess}
              onClick={handleResend}
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-transparent font-medium"
              data-testid="otp-resend-btn"
            >
              {countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <span className="inline-flex items-center gap-1">
                  <RotateCw className="h-3 w-3" />
                  Resend OTP
                </span>
              )}
            </Button>
          </div>

          {/* Dialog Footer Actions */}
          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={flow.isValidating}
              data-testid="otp-cancel-btn"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!localCode.trim() || flow.isValidating || flow.isSuccess}
              data-testid="otp-submit-btn"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {flow.isValidating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify & Proceed'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
