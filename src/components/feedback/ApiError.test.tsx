import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ApiError } from './ApiError'
import { ApiError as ApiErrorClass } from '@/api/client'

describe('ApiError Component', () => {
  it('returns null when error is null or undefined', () => {
    const { container } = render(<ApiError error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders ApiError instance with status code and data message', () => {
    const apiError = new ApiErrorClass(500, 'Internal Server Error', {
      message: 'Database connection pool exhausted.',
    })

    render(<ApiError error={apiError} />)

    expect(screen.getByTestId('api-error-card')).toBeInTheDocument()
    expect(screen.getByTestId('api-error-status')).toHaveTextContent('500')
    expect(screen.getByTestId('api-error-title')).toHaveTextContent(
      'Request Failed (500 Internal Server Error)'
    )
    expect(screen.getByTestId('api-error-message')).toHaveTextContent(
      'Database connection pool exhausted.'
    )
  })

  it('renders standard Error instance message', () => {
    render(<ApiError error={new Error('Network disconnected')} />)

    expect(screen.getByTestId('api-error-message')).toHaveTextContent('Network disconnected')
    expect(screen.getByTestId('api-error-title')).toHaveTextContent('Failed to complete request')
  })

  it('renders string error message', () => {
    render(<ApiError error="Invalid credentials provided." />)

    expect(screen.getByTestId('api-error-message')).toHaveTextContent('Invalid credentials provided.')
  })

  it('calls onRetry callback when retry button is clicked', () => {
    const onRetryMock = vi.fn()

    render(
      <ApiError
        error={new ApiErrorClass(503, 'Service Unavailable')}
        onRetry={onRetryMock}
      />
    )

    const retryBtn = screen.getByTestId('api-error-retry-btn')
    expect(retryBtn).toBeInTheDocument()

    fireEvent.click(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ApiError error="Something went wrong" />)

    expect(screen.queryByTestId('api-error-retry-btn')).not.toBeInTheDocument()
  })
})
