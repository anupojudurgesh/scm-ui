import * as React from 'react'
import { Search, X, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SearchToolbarProps {
  /** Callback fired after debounced delay (or immediately on clear/Enter) when search changes */
  onSearch: (query: string) => void;
  /** Search input placeholder (defaults to 'Search...') */
  placeholder?: string;
  /** Initial uncontrolled search value */
  defaultValue?: string;
  /** Controlled search value */
  value?: string;
  /** Debounce delay in milliseconds (defaults to 300ms) */
  debounceMs?: number;
  /** Slot for filter dropdowns, action buttons, or custom selectors */
  children?: React.ReactNode;
  /** Optional callback fired when search/filters are cleared or reset */
  onReset?: () => void;
  /** Whether to show a dedicated Reset button alongside the search input (defaults to true) */
  showResetButton?: boolean;
  /** Optional label for the reset button (defaults to 'Reset') */
  resetLabel?: string;
  /** Whether search input and buttons are disabled */
  disabled?: boolean;
  /** Optional container class name */
  className?: string;
  /** Optional search input class name */
  inputClassName?: string;
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * SearchToolbar provides a debounced search input, an optional clear/reset action,
 * and a generic slot for filter dropdowns.
 */
export function SearchToolbar({
  onSearch,
  placeholder = 'Search...',
  defaultValue = '',
  value,
  debounceMs = 300,
  children,
  onReset,
  showResetButton = true,
  resetLabel = 'Reset',
  disabled = false,
  className,
  inputClassName,
  'data-testid': testId = 'search-toolbar',
}: SearchToolbarProps) {
  const isControlled = value !== undefined
  const [searchTerm, setSearchTerm] = React.useState(value ?? defaultValue)
  const isMounted = React.useRef(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const onSearchRef = React.useRef(onSearch)
  React.useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // Synchronize controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setSearchTerm(value)
    }
  }, [value])

  // Debounce search input changes
  React.useEffect(() => {
    // Avoid firing on initial component mount
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onSearchRef.current(searchTerm)
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [searchTerm, debounceMs])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value
    if (!isControlled) {
      setSearchTerm(nextVal)
    } else {
      // In controlled mode, still update internal buffer so typing reflects immediately
      setSearchTerm(nextVal)
    }
  }

  const handleClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setSearchTerm('')
    onSearchRef.current('')
    onReset?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      onSearchRef.current(searchTerm)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleClear()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-1',
        className
      )}
      data-testid={testId}
    >
      <div className="flex flex-1 items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'pl-8.5 pr-8 text-xs sm:text-sm h-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500',
              inputClassName
            )}
            data-testid="search-toolbar-input"
            aria-label={placeholder}
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
              aria-label="Clear search"
              data-testid="search-toolbar-clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {showResetButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled || !searchTerm}
            className="h-9 px-3 text-xs text-slate-600 hover:text-slate-900 border-slate-200 shrink-0 font-medium transition-colors duration-150 ease-out"
            data-testid="search-toolbar-reset"
            aria-label={resetLabel}
          >
            <RotateCcw className="h-3 w-3 mr-1.5 text-slate-400" aria-hidden="true" />
            {resetLabel}
          </Button>
        )}
      </div>

      {children && (
        <div
          className="flex items-center gap-2 flex-wrap"
          data-testid="search-toolbar-filters"
        >
          {children}
        </div>
      )}
    </div>
  )
}
