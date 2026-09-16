import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingState } from './LoadingState'

describe('LoadingState Component', () => {
  it('renders spinner and accessible role without crashing when no message is provided', () => {
    render(<LoadingState />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Loading')).toHaveClass('sr-only')
    expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument()
  })

  it('renders the message when provided', () => {
    render(<LoadingState message="Fetching subscriber records..." />)

    expect(screen.getByText('Fetching subscriber records...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-message')).toBeInTheDocument()
  })

  it('renders both message and description when provided', () => {
    render(
      <LoadingState
        message="Generating commission statement"
        description="This operation might take up to 30 seconds to query all regional nodes."
      />
    )

    expect(screen.getByText('Generating commission statement')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This operation might take up to 30 seconds to query all regional nodes.'
      )
    ).toBeInTheDocument()
  })

  it('applies spinner size variants correctly', () => {
    const { rerender } = render(<LoadingState size="sm" />)
    expect(screen.getByTestId('loading-spinner')).toHaveClass('h-4 w-4')

    rerender(<LoadingState size="md" />)
    expect(screen.getByTestId('loading-spinner')).toHaveClass('h-6 w-6')

    rerender(<LoadingState size="lg" />)
    expect(screen.getByTestId('loading-spinner')).toHaveClass('h-9 w-9')
  })

  it('applies fullPage styling when fullPage is true', () => {
    render(<LoadingState fullPage message="Loading system configuration..." />)

    const container = screen.getByTestId('loading-state')
    expect(container).toHaveClass('min-h-[50vh]')
    expect(container).toHaveClass('flex-1')
  })

  it('accepts custom className and spinnerClassName', () => {
    render(
      <LoadingState
        className="custom-container-class"
        spinnerClassName="custom-spinner-class"
      />
    )

    expect(screen.getByTestId('loading-state')).toHaveClass('custom-container-class')
    expect(screen.getByTestId('loading-spinner')).toHaveClass('custom-spinner-class')
  })
})
