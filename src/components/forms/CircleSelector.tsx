import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCirclesByZoneQuery, type Circle } from '@/api/masterdata.api'
import { cn } from '@/lib/utils'

export interface CircleSelectorProps {
  zoneId?: string | number | null;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (circleId: string, circle?: Circle) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

export function CircleSelector({
  zoneId,
  value,
  defaultValue,
  onChange,
  disabled = false,
  placeholder = 'Select Circle...',
  className,
  id,
  name,
}: CircleSelectorProps) {
  const hasParent = Boolean(zoneId)
  const isEffectivelyDisabled = disabled || !hasParent

  const { data: circles = [], isLoading, isError } = useCirclesByZoneQuery(zoneId)

  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue !== undefined ? String(defaultValue) : undefined
  )

  // Reset internal value if parent zoneId changes
  React.useEffect(() => {
    if (!hasParent) {
      setInternalValue(undefined)
    }
  }, [zoneId, hasParent])

  const currentValue = value !== undefined ? String(value) : internalValue

  const handleValueChange = (val: string | null) => {
    if (!val) return
    if (value === undefined) {
      setInternalValue(val)
    }
    const selected = circles.find((c) => String(c.circleId) === val)
    onChange?.(val, selected)
  }

  if (hasParent && isLoading) {
    return (
      <Skeleton
        className={cn('h-9 w-full rounded-lg', className)}
        data-testid="circle-selector-skeleton"
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
        data-testid="circle-selector-trigger"
        aria-label="Circle Selector"
      >
        <SelectValue
          placeholder={
            !hasParent
              ? 'Select Zone first'
              : isError
              ? 'Failed to load circles'
              : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {circles.map((circle) => (
          <SelectItem key={circle.circleId} value={String(circle.circleId)}>
            {circle.circleName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
