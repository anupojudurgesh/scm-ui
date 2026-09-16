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
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ConfirmationDialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** State changer callback for dialog visibility */
  onOpenChange: (open: boolean) => void;
  /** Dialog heading title */
  title: React.ReactNode;
  /** Explanation or description of the action */
  description: React.ReactNode;
  /** Action executed when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Action executed when user cancels or dismisses */
  onCancel?: () => void;
  /** Text on confirm button (default: 'Confirm' or 'Delete' if destructive) */
  confirmText?: string;
  /** Text on cancel button (default: 'Cancel') */
  cancelText?: string;
  /** If true, styles the action as destructive (e.g. red button, warning icon) */
  destructive?: boolean;
  /** Disables actions and displays a spinner on confirm button */
  loading?: boolean;
  /** Optional custom CSS class name for dialog content */
  className?: string;
}

/**
 * Reusable ConfirmationDialog prompt using shadcn Dialog primitives.
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
  className,
}: ConfirmationDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const isBusy = loading || internalLoading

  const defaultConfirmText = destructive ? 'Delete' : 'Confirm'
  const resolvedConfirmText = confirmText ?? defaultConfirmText

  const handleCancel = () => {
    if (isBusy) return
    onCancel?.()
    onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (isBusy) return
    const result = onConfirm()
    if (result instanceof Promise) {
      try {
        setInternalLoading(true)
        await result
        onOpenChange(false)
      } finally {
        setInternalLoading(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent
        className={cn('sm:max-w-md', className)}
        data-testid="confirmation-dialog"
      >
        <DialogHeader className="gap-2">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                destructive
                  ? 'border-red-100 bg-red-50 text-red-600'
                  : 'border-blue-100 bg-blue-50 text-blue-600'
              )}
              aria-hidden="true"
            >
              {destructive ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <HelpCircle className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold text-slate-900" data-testid="confirmation-title">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed" data-testid="confirmation-description">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isBusy}
            data-testid="confirmation-cancel-btn"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            size="sm"
            onClick={handleConfirm}
            disabled={isBusy}
            data-testid="confirmation-confirm-btn"
            className={cn(
              destructive && 'bg-red-600 hover:bg-red-700 text-white'
            )}
          >
            {isBusy ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing...
              </span>
            ) : (
              resolvedConfirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
