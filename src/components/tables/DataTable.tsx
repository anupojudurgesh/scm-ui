import * as React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  /** Unique identifier for the column */
  id: string;
  /** Header content or render function */
  header: React.ReactNode | ((column: DataTableColumn<T>) => React.ReactNode);
  /** Key of row item or extractor function */
  accessor?: keyof T | ((row: T) => React.ReactNode);
  /** Optional custom render function for the cell */
  cell?: (row: T, index: number) => React.ReactNode;
  /** Additional class names for table cells in this column */
  className?: string;
  /** Additional class names for table head */
  headerClassName?: string;
}

export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
}

export interface DataTableProps<T> {
  /** Array of column configurations */
  columns: DataTableColumn<T>[];
  /** Array of row data */
  data: T[];
  /** Indicates whether data is currently being fetched */
  loading?: boolean;
  /** Error message or error object if fetch failed */
  error?: string | Error | React.ReactNode | null;
  /** Callback triggered when retry button in error state is clicked */
  onRetry?: () => void;
  /** Optional callback triggered on row click */
  onRowClick?: (row: T, index: number) => void;
  /** Pagination configuration object */
  pagination?: DataTablePaginationProps;
  /** Flattened pagination props for convenience */
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (newPage: number) => void;
  /** Custom message for empty data state */
  emptyMessage?: string;
  /** Number of skeleton rows to display while loading (default 5) */
  loadingRowsCount?: number;
  /** Custom wrapper CSS class name */
  className?: string;
}

/**
 * Helper to resolve cell content from a column definition and row item.
 */
function renderCellContent<T>(column: DataTableColumn<T>, row: T, rowIndex: number): React.ReactNode {
  if (column.cell) {
    return column.cell(row, rowIndex)
  }

  if (typeof column.accessor === 'function') {
    return column.accessor(row)
  }

  if (column.accessor !== undefined && column.accessor in (row as Record<string, unknown>)) {
    const val = row[column.accessor]
    return val !== null && val !== undefined ? String(val) : ''
  }

  if (column.id in (row as Record<string, unknown>)) {
    const val = (row as Record<string, unknown>)[column.id]
    return val !== null && val !== undefined ? String(val) : ''
  }

  return null
}

/**
 * Generic DataTable component supporting loading skeletons, error with retry,
 * empty states, click handlers, and pagination controls.
 */
export function DataTable<T>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  onRowClick,
  pagination,
  page,
  pageSize,
  totalCount,
  onPageChange,
  emptyMessage = 'No results found.',
  loadingRowsCount = 5,
  className,
}: DataTableProps<T>) {
  // Resolve pagination parameters from either nested or direct props
  const effectivePage = pagination?.page ?? page
  const effectivePageSize = pagination?.pageSize ?? pageSize
  const effectiveTotal = pagination?.totalCount ?? totalCount
  const effectiveOnPageChange = pagination?.onPageChange ?? onPageChange

  const hasPagination =
    effectivePage !== undefined &&
    effectivePageSize !== undefined &&
    effectiveTotal !== undefined &&
    effectiveOnPageChange !== undefined

  const totalPages = hasPagination
    ? Math.max(1, Math.ceil(effectiveTotal / effectivePageSize))
    : 1

  const errorMessage = React.useMemo(() => {
    if (!error) return null
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message
    return 'Failed to load records. Please try again.'
  }, [error])

  return (
    <div className={cn('w-full space-y-3', className)} data-testid="data-table-container">
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    'text-xs font-semibold text-slate-700 tracking-wider uppercase',
                    col.headerClassName
                  )}
                  data-testid={`table-head-${col.id}`}
                >
                  {typeof col.header === 'function' ? col.header(col) : col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* 1. Loading State: Skeleton Rows */}
            {loading ? (
              Array.from({ length: loadingRowsCount }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`} data-testid="data-table-skeleton-row">
                  {columns.map((col, colIndex) => (
                    <TableCell key={`skeleton-cell-${col.id}-${colIndex}`} className={col.className}>
                      <Skeleton
                        className={cn(
                          'h-4.5 rounded-md',
                          colIndex === 0 ? 'w-3/4' : colIndex === columns.length - 1 ? 'w-1/2' : 'w-full'
                        )}
                        data-testid="table-skeleton-item"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              /* 2. Error State: Message + Retry button */
              <TableRow data-testid="data-table-error-row">
                <TableCell colSpan={columns.length} className="h-48 text-center p-6">
                  <div
                    className="flex flex-col items-center justify-center gap-3"
                    data-testid="data-table-error-state"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">Failed to load data</p>
                      {React.isValidElement(error) ? (
                        error
                      ) : (
                        <p className="text-xs text-slate-500 max-w-md mx-auto" data-testid="data-table-error-message">
                          {errorMessage}
                        </p>
                      )}
                    </div>
                    {onRetry && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onRetry}
                        data-testid="data-table-retry-btn"
                        className="mt-1 gap-1.5 text-xs text-slate-700 hover:text-slate-900"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              /* 3. Empty State: No results message */
              <TableRow data-testid="data-table-empty-row">
                <TableCell colSpan={columns.length} className="h-48 text-center p-6">
                  <div
                    className="flex flex-col items-center justify-center gap-2.5 text-slate-500"
                    data-testid="data-table-empty-state"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-700" data-testid="data-table-empty-message">
                      {emptyMessage}
                    </p>
                    <p className="text-xs text-slate-400">There are no records to display at this time.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              /* 4. Populated State: Normal table rows */
              data.map((row, rowIndex) => {
                const isClickable = Boolean(onRowClick)
                return (
                  <TableRow
                    key={`row-${rowIndex}`}
                    data-testid="data-table-row"
                    onClick={() => onRowClick?.(row, rowIndex)}
                    className={cn(
                      'transition-colors duration-150 ease-out',
                      isClickable
                        ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/70'
                        : 'hover:bg-transparent'
                    )}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={`cell-${col.id}`}
                        className={cn('text-sm text-slate-800', col.className)}
                        data-testid={`cell-${col.id}-${rowIndex}`}
                      >
                        {renderCellContent(col, row, rowIndex)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {hasPagination && (
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 text-xs text-slate-600"
          data-testid="data-table-pagination"
        >
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800" data-testid="pagination-showing-start">
              {effectiveTotal === 0 ? 0 : (effectivePage - 1) * effectivePageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800" data-testid="pagination-showing-end">
              {Math.min(effectivePage * effectivePageSize, effectiveTotal)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800" data-testid="pagination-total-count">
              {effectiveTotal}
            </span>{' '}
            results
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 mr-2" data-testid="pagination-page-indicator">
              Page <span className="font-medium text-slate-800">{effectivePage}</span> of{' '}
              <span className="font-medium text-slate-800">{totalPages}</span>
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={effectivePage <= 1 || loading}
              onClick={() => effectiveOnPageChange(effectivePage - 1)}
              data-testid="data-table-prev-page"
              className="h-8 w-8 p-0"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={effectivePage >= totalPages || loading}
              onClick={() => effectiveOnPageChange(effectivePage + 1)}
              data-testid="data-table-next-page"
              className="h-8 w-8 p-0"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
