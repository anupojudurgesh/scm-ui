import { ApiError as ApiErrorClass } from '@/api/client'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ApiErrorProps {
  /** Error to display: ApiError instance, generic Error, string, or null */
  error: ApiErrorClass | Error | string | null | undefined;
  /** Optional callback to retry the failed request */
  onRetry?: () => void;
  /** Optional custom title */
  title?: string;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Extracts a user-friendly message from an unknown data payload.
 */
function extractDataMessage(data: unknown): string | null {
  if (!data) return null
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
    if (typeof record.description === 'string') return record.description
  }
  return null
}

/**
 * Reusable alert card for rendering formatted ApiError responses with retry capability.
 */
export function ApiError({
  error,
  onRetry,
  title,
  className,
}: ApiErrorProps) {
  if (!error) return null

  const isApiError =
    error instanceof ApiErrorClass ||
    (typeof error === 'object' && error !== null && 'status' in error)
  const statusCode = isApiError ? (error as ApiErrorClass).status : null
  const statusText = isApiError ? (error as ApiErrorClass).statusText : null
  const errorData = isApiError ? (error as ApiErrorClass).data : null

  const detailMessage =
    extractDataMessage(errorData) ||
    (error instanceof Error ? error.message : typeof error === 'string' ? error : 'An unexpected error occurred.')

  const defaultTitle = statusCode
    ? `Request Failed (${statusCode}${statusText ? ` ${statusText}` : ''})`
    : 'Failed to complete request'

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-900',
        className
      )}
      data-testid="api-error-card"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <AlertCircle className="h-4 w-4" />
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-red-950" data-testid="api-error-title">
              {title || defaultTitle}
            </h4>
            {statusCode && (
              <span
                className="rounded bg-red-200/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-red-800"
                data-testid="api-error-status"
              >
                {statusCode}
              </span>
            )}
          </div>
          <p className="text-red-800 leading-relaxed" data-testid="api-error-message">
            {detailMessage}
          </p>
        </div>
      </div>

      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          data-testid="api-error-retry-btn"
          className="shrink-0 border-red-200 bg-white hover:bg-red-100/60 hover:text-red-950 text-red-800 text-xs font-medium"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}
