import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSSAsByCircleQuery, type SSA } from '@/api/masterdata.api'
import { cn } from '@/lib/utils'

export interface SSASelectorProps {
  circleId?: string | number | null;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (ssaId: string, ssa?: SSA) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

export function SSASelector({
  circleId,
  value,
  defaultValue,
  onChange,
  disabled = false,
  placeholder = 'Select SSA...',
  className,
  id,
  name,
}: SSASelectorProps) {
  const hasParent = Boolean(circleId)
  const isEffectivelyDisabled = disabled || !hasParent

  const { data: ssas = [], isLoading, isError } = useSSAsByCircleQuery(circleId)

  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue !== undefined ? String(defaultValue) : undefined
  )

  // Reset internal value if parent circleId changes
  React.useEffect(() => {
    if (!hasParent) {
      setInternalValue(undefined)
    }
  }, [circleId, hasParent])

  const currentValue = value !== undefined ? String(value) : internalValue

  const handleValueChange = (val: string | null) => {
    if (!val) return
    if (value === undefined) {
      setInternalValue(val)
    }
    const selected = ssas.find((s) => String(s.ssaId) === val)
    onChange?.(val, selected)
  }

  if (hasParent && isLoading) {
    return (
      <Skeleton
        className={cn('h-9 w-full rounded-lg', className)}
        data-testid="ssa-selector-skeleton"
      />
    )
  }

  return (
    <Select
      value={currentValue}
      defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
      onValueChange={handleValueChange}
      disabled={isEffectivelyDisabled || isError}
      name={name}
    >
      <SelectTrigger
        id={id}
        className={cn('w-full justify-between', className)}
        data-testid="ssa-selector-trigger"
        aria-label="SSA Selector"
      >
        <SelectValue
          placeholder={
            !hasParent
              ? 'Select Circle first'
              : isError
              ? 'Failed to load SSAs'
              : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {ssas.map((ssa) => (
          <SelectItem key={ssa.ssaId} value={String(ssa.ssaId)}>
            {ssa.ssaName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
