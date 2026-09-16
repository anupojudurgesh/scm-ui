import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useZonesQuery, type Zone } from '@/api/masterdata.api'
import { cn } from '@/lib/utils'

export interface ZoneSelectorProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (zoneId: string, zone?: Zone) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

export function ZoneSelector({
  value,
  defaultValue,
  onChange,
  disabled = false,
  placeholder = 'Select Zone...',
  className,
  id,
  name,
}: ZoneSelectorProps) {
  const { data: zones = [], isLoading, isError } = useZonesQuery()

  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue !== undefined ? String(defaultValue) : undefined
  )

  const currentValue = value !== undefined ? String(value) : internalValue

  const handleValueChange = (val: string | null) => {
    if (!val) return
    if (value === undefined) {
      setInternalValue(val)
    }
    const selected = zones.find((z) => String(z.zoneId) === val)
    onChange?.(val, selected)
  }

  if (isLoading) {
    return (
      <Skeleton
        className={cn('h-9 w-full rounded-lg', className)}
        data-testid="zone-selector-skeleton"
      />
    )
  }

  return (
    <Select
      value={currentValue}
      defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
      onValueChange={handleValueChange}
      disabled={disabled || isError}
      name={name}
    >
      <SelectTrigger
        id={id}
        className={cn('w-full justify-between', className)}
        data-testid="zone-selector-trigger"
        aria-label="Zone Selector"
      >
        <SelectValue placeholder={isError ? 'Failed to load zones' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {zones.map((zone) => (
          <SelectItem key={zone.zoneId} value={String(zone.zoneId)}>
            {zone.zoneName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
