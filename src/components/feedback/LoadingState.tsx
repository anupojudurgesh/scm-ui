import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingStateProps {
  /** Optional primary message displayed below the spinner */
  message?: React.ReactNode;
  /** Optional secondary subtitle or detail message */
  description?: React.ReactNode;
  /** Size variant for the spinner (defaults to 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the loading state should expand to fill the full viewport / page height */
  fullPage?: boolean;
  /** Optional container class name */
  className?: string;
  /** Optional spinner class name */
  spinnerClassName?: string;
  /** Test identifier */
  'data-testid'?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
}

/**
 * LoadingState renders a generic centered spinner and an optional message,
 * suitable for full-page or full-section asynchronous loading states.
 */
export function LoadingState({
  message,
  description,
  size = 'md',
  fullPage = false,
  className,
  spinnerClassName,
  'data-testid': testId = 'loading-state',
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center',
        fullPage ? 'min-h-[50vh] flex-1' : 'min-h-[140px] w-full',
        className
      )}
      data-testid={testId}
    >
      <Loader2
        className={cn('animate-spin text-cyan-600 shrink-0', spinnerSizes[size], spinnerClassName)}
        aria-hidden="true"
        data-testid="loading-spinner"
      />
      <span className="sr-only">Loading</span>

      {message && (
        <p
          className="mt-3 text-xs sm:text-sm font-medium text-slate-700"
          data-testid="loading-message"
        >
          {message}
        </p>
      )}

      {description && (
        <p
          className="mt-1 text-xs text-slate-500 max-w-sm"
          data-testid="loading-description"
        >
          {description}
        </p>
      )}
    </div>
  )
}
