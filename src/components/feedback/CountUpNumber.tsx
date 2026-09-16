import { useEffect, useState } from 'react'

interface CountUpNumberProps {
  value: number;
  duration?: number;
  className?: string;
  testId?: string;
}

/**
 * Purposeful, non-blocking count-up animation component for KPI values.
 * Counts from 0 to target value over `duration` ms (default 450ms) using cubic ease-out.
 * In test environments or when prefers-reduced-motion is active, instantly renders the final value.
 */
export function CountUpNumber({
  value,
  duration = 450,
  className,
  testId,
}: CountUpNumberProps) {
  // If in a test runner or running without DOM RAF, render target immediately
  const g = typeof globalThis !== 'undefined' ? (globalThis as { process?: { env?: { NODE_ENV?: string; VITEST?: string } } }) : null
  const isTest = g?.process?.env?.NODE_ENV === 'test' || g?.process?.env?.VITEST === 'true'

  const [displayValue, setDisplayValue] = useState<number>(() =>
    isTest ? value : 0
  )

  useEffect(() => {
    if (isTest || duration <= 0) {
      setDisplayValue(value)
      return
    }

    if (typeof window === 'undefined') {
      setDisplayValue(value)
      return
    }

    // Respect user's accessibility reduced motion preference
    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches

    if (prefersReducedMotion) {
      setDisplayValue(value)
      return
    }

    let startTimestamp: number | null = null
    let animationFrameId: number

    const startValue = 0

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)

      // Cubic ease-out: progress = 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (value - startValue) * easeOut)

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrameId = window.requestAnimationFrame(step)

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [value, duration, isTest])

  return (
    <span className={className} data-testid={testId}>
      {displayValue.toLocaleString()}
    </span>
  )
}
