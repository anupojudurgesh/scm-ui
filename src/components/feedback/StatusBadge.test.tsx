import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge Component', () => {
  it('maps "Active" status correctly with emerald styling', () => {
    render(<StatusBadge status="Active" />)

    const badge = screen.getByTestId('status-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Active')
    expect(badge).toHaveAttribute('data-status', 'active')
    expect(badge.className).toContain('text-emerald-700')
  })

  it('maps "Inactive" status correctly with secondary slate styling', () => {
    render(<StatusBadge status="Inactive" />)

    const badge = screen.getByTestId('status-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Inactive')
    expect(badge).toHaveAttribute('data-status', 'inactive')
    expect(badge.className).toContain('text-slate-600')
  })

  it('maps "Pending" status correctly with amber styling', () => {
    render(<StatusBadge status="Pending" />)

    const badge = screen.getByTestId('status-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Pending')
    expect(badge).toHaveAttribute('data-status', 'pending')
    expect(badge.className).toContain('text-amber-700')
  })

  it('maps "Blocked" status correctly with destructive red styling', () => {
    render(<StatusBadge status="Blocked" />)

    const badge = screen.getByTestId('status-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Blocked')
    expect(badge).toHaveAttribute('data-status', 'blocked')
    expect(badge.className).toContain('text-red-700')
  })

  it('handles case-insensitive and trimmed status strings', () => {
    render(<StatusBadge status="  aCtIvE  " />)

    const badge = screen.getByTestId('status-badge')
    expect(badge).toHaveAttribute('data-status', 'active')
    expect(badge.className).toContain('text-emerald-700')
  })

  it('falls back gracefully for unknown status', () => {
    render(<StatusBadge status="Under Review" />)

    const badge = screen.getByTestId('status-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Under Review')
    expect(badge).toHaveAttribute('data-status', 'under review')
  })

  it('renders dot indicator by default, and hides when showDot is false', () => {
    const { rerender } = render(<StatusBadge status="Active" showDot={true} />)
    expect(screen.getByTestId('status-badge-dot')).toBeInTheDocument()

    rerender(<StatusBadge status="Active" showDot={false} />)
    expect(screen.queryByTestId('status-badge-dot')).not.toBeInTheDocument()
  })
})
