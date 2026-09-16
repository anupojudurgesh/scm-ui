import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmationDialog } from './ConfirmationDialog'

describe('ConfirmationDialog Component', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Purge Old Transactions',
    description: 'This will permanently delete records older than 90 days.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('renders title, description and action buttons when open', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByTestId('confirmation-title')).toHaveTextContent('Purge Old Transactions')
    expect(screen.getByTestId('confirmation-description')).toHaveTextContent(
      'This will permanently delete records older than 90 days.'
    )
    expect(screen.getByTestId('confirmation-confirm-btn')).toHaveTextContent('Confirm')
    expect(screen.getByTestId('confirmation-cancel-btn')).toHaveTextContent('Cancel')
  })

  it('calls onConfirm and closes dialog when confirm button is clicked', async () => {
    const onConfirmMock = vi.fn()
    const onOpenChangeMock = vi.fn()

    render(
      <ConfirmationDialog
        {...defaultProps}
        onConfirm={onConfirmMock}
        onOpenChange={onOpenChangeMock}
      />
    )

    const confirmBtn = screen.getByTestId('confirmation-confirm-btn')
    fireEvent.click(confirmBtn)

    expect(onConfirmMock).toHaveBeenCalledTimes(1)
    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
  })

  it('calls onCancel and closes dialog when cancel button is clicked', () => {
    const onCancelMock = vi.fn()
    const onOpenChangeMock = vi.fn()

    render(
      <ConfirmationDialog
        {...defaultProps}
        onCancel={onCancelMock}
        onOpenChange={onOpenChangeMock}
      />
    )

    const cancelBtn = screen.getByTestId('confirmation-cancel-btn')
    fireEvent.click(cancelBtn)

    expect(onCancelMock).toHaveBeenCalledTimes(1)
    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
  })

  it('styles button and icon as destructive when destructive prop is true', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        destructive={true}
        confirmText="Purge Now"
      />
    )

    const confirmBtn = screen.getByTestId('confirmation-confirm-btn')
    expect(confirmBtn).toHaveTextContent('Purge Now')
    expect(confirmBtn.className).toContain('bg-red-600')
  })

  it('disables buttons when loading is true', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        loading={true}
      />
    )

    expect(screen.getByTestId('confirmation-confirm-btn')).toBeDisabled()
    expect(screen.getByTestId('confirmation-cancel-btn')).toBeDisabled()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })
})
