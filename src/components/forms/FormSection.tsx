import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FormSectionProps {
  /** Section title (e.g., 'Personal Details', 'Location', 'Permissions') */
  title: string;
  /** Optional secondary description or instruction text */
  description?: React.ReactNode;
  /** Form fields, input grids, or nested controls */
  children: React.ReactNode;
  /** Optional header action slot (e.g. status badge, toggle, or secondary button) */
  action?: React.ReactNode;
  /** Optional container class name */
  className?: string;
  /** Optional header container class name */
  headerClassName?: string;
  /** Optional content wrapper class name */
  contentClassName?: string;
  /** Optional DOM id for anchor scrolling or referencing */
  id?: string;
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * FormSection renders a labeled group with consistent spacing,
 * organizing complex or lengthy forms into structured logical sections.
 */
export function FormSection({
  title,
  description,
  children,
  action,
  className,
  headerClassName,
  contentClassName,
  id,
  'data-testid': testId = 'form-section',
}: FormSectionProps) {
  const titleId = id ? `${id}-title` : undefined

  return (
    <section
      id={id}
      data-testid={testId}
      aria-labelledby={titleId}
      className={cn('space-y-3.5', className)}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-4 border-b border-slate-200/80 pb-2.5',
          headerClassName
        )}
      >
        <div className="space-y-0.5">
          <h3
            id={titleId}
            className="text-sm sm:text-base font-bold text-slate-900 font-heading tracking-tight"
            data-testid="form-section-title"
          >
            {title}
          </h3>
          {description && (
            <div
              className="text-xs text-slate-500"
              data-testid="form-section-description"
            >
              {description}
            </div>
          )}
        </div>
        {action && (
          <div className="shrink-0" data-testid="form-section-action">
            {action}
          </div>
        )}
      </div>

      <div className={cn('space-y-3.5', contentClassName)} data-testid="form-section-content">
        {children}
      </div>
    </section>
  )
}
