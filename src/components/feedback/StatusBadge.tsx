import type { HTMLAttributes } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type CommonScmStatus =
  | 'Active'
  | 'Inactive'
  | 'Pending'
  | 'Blocked'
  | string;

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** SCM Status label (e.g. Active, Inactive, Pending, Blocked) */
  status: CommonScmStatus;
  /** Optional override for Badge variant */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Whether to render a colored status indicator dot */
  showDot?: boolean;
}

interface StatusConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  dotColor: string;
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  active: {
    variant: 'default',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  inactive: {
    variant: 'secondary',
    className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotColor: 'bg-slate-400',
  },
  pending: {
    variant: 'outline',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  blocked: {
    variant: 'destructive',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
    dotColor: 'bg-red-500',
  },
}

const DEFAULT_CONFIG: StatusConfig = {
  variant: 'outline',
  className: 'bg-slate-50 text-slate-600 border-slate-200',
  dotColor: 'bg-slate-400',
}

/**
 * Maps standard SCM statuses to appropriately colored shadcn Badge variants.
 */
export function StatusBadge({
  status,
  variant,
  showDot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const normalized = (status || '').toString().toLowerCase().trim()
  const config = STATUS_CONFIG_MAP[normalized] || DEFAULT_CONFIG
  const badgeVariant = variant || config.variant

  return (
    <Badge
      variant={badgeVariant}
      className={cn('inline-flex items-center gap-1.5 font-medium', config.className, className)}
      data-testid="status-badge"
      data-status={normalized}
      {...props}
    >
      {showDot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotColor)}
          data-testid="status-badge-dot"
          aria-hidden="true"
        />
      )}
      <span>{children ?? status}</span>
    </Badge>
  )
}
