import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OTPVerificationModal } from './OTPVerificationModal'
import { useOtpStore } from '@/stores/otpStore'
import { otpApi } from '@/api/otp.api'

describe('OTPVerificationModal Component', () => {
  const defaultProps = {
    open: true,
    topic: 'Dealercreation',
    msisdn: '9876543210',
    actionName: 'Create Franchise Dealer',
    onVerified: vi.fn(),
    onCancel: vi.fn(),
    onOpenChange: vi.fn(),
    autoSendOnOpen: false, // We'll test manual or auto-send explicitly
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()
  })

  it('renders actionName and masked MSISDN', () => {
    render(<OTPVerificationModal {...defaultProps} />)

    expect(screen.getByText('Security Authorization')).toBeInTheDocument()
    expect(screen.getByText('Create Franchise Dealer')).toBeInTheDocument()
    // Masked MSISDN should be visible: 98******10
    expect(screen.getByText(/98\*{6}10/)).toBeInTheDocument()
    expect(screen.getByTestId('otp-input')).toBeInTheDocument()
    expect(screen.getByTestId('otp-submit-btn')).toBeInTheDocument()
  })

  it('keeps submit button disabled when OTP input is empty', () => {
    render(<OTPVerificationModal {...defaultProps} />)

    const submitBtn = screen.getByTestId('otp-submit-btn')
    expect(submitBtn).toBeDisabled()
  })

  it('calls onVerified ONLY after a successful validateOtp response', async () => {
    const onVerifiedSpy = vi.fn()
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({ status: 'SUCCESS' })
    const validateSpy = vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({ status: 'SUCCESS' })

    render(
      <OTPVerificationModal
        {...defaultProps}
        autoSendOnOpen={true}
        onVerified={onVerifiedSpy}
      />
    )

    // Wait for auto-send to transition to otpSent
    await waitFor(() => {
      expect(screen.getByTestId('otp-status-indicator')).toHaveTextContent('otpSent')
    })

    // onVerified must NOT be called yet
    expect(onVerifiedSpy).not.toHaveBeenCalled()

    // User types 6-digit valid OTP
    const input = screen.getByTestId('otp-input')
    fireEvent.change(input, { target: { value: '123456' } })

    const submitBtn = screen.getByTestId('otp-submit-btn')
    expect(submitBtn).not.toBeDisabled()

    // Click verify
    fireEvent.click(submitBtn)

    // Await validateOtp call
    await waitFor(() => {
      expect(validateSpy).toHaveBeenCalledWith({
        otp: '123456',
        operation: '10069',
        msisdn: '9876543210',
      })
    })

    // Verify onVerified callback was invoked!
    await waitFor(() => {
      expect(onVerifiedSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('does NOT call onVerified when validateOtp fails, and displays error alert', async () => {
    const onVerifiedSpy = vi.fn()
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({ status: 'SUCCESS' })
    const validateSpy = vi
      .spyOn(otpApi, 'validateOtp')
      .mockRejectedValue(new Error('Invalid or expired OTP'))

    render(
      <OTPVerificationModal
        {...defaultProps}
        autoSendOnOpen={true}
        onVerified={onVerifiedSpy}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('otp-status-indicator')).toHaveTextContent('otpSent')
    })

    // User enters invalid OTP
    const input = screen.getByTestId('otp-input')
    fireEvent.change(input, { target: { value: '000000' } })

    const submitBtn = screen.getByTestId('otp-submit-btn')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(validateSpy).toHaveBeenCalledWith({
        otp: '000000',
        operation: '10069',
        msisdn: '9876543210',
      })
    })

    // Error alert is displayed
    await waitFor(() => {
      expect(screen.getByTestId('otp-error-alert')).toBeInTheDocument()
      expect(screen.getByText('Invalid or expired OTP')).toBeInTheDocument()
    })

    // CRITICAL: onVerified MUST NOT be called!
    expect(onVerifiedSpy).not.toHaveBeenCalled()
  })

  it('cancels verification without triggering onVerified', async () => {
    const onVerifiedSpy = vi.fn()
    const onCancelSpy = vi.fn()

    render(
      <OTPVerificationModal
        {...defaultProps}
        onVerified={onVerifiedSpy}
        onCancel={onCancelSpy}
      />
    )

    const cancelBtn = screen.getByTestId('otp-cancel-btn')
    fireEvent.click(cancelBtn)

    expect(onCancelSpy).toHaveBeenCalledTimes(1)
    expect(onVerifiedSpy).not.toHaveBeenCalled()
    expect(useOtpStore.getState().status).toBe('idle')
  })

  it('displays error banner and blocks validation when 4th attempt is made', async () => {
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({ status: 'SUCCESS' })
    vi.spyOn(otpApi, 'validateOtp').mockRejectedValue(new Error('Incorrect OTP'))

    render(
      <OTPVerificationModal
        {...defaultProps}
        autoSendOnOpen={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('otp-status-indicator')).toHaveTextContent('otpSent')
    })

    const input = screen.getByTestId('otp-input')
    const submitBtn = screen.getByTestId('otp-submit-btn')

    // 3 failed attempts
    for (let i = 1; i <= 3; i++) {
      fireEvent.change(input, { target: { value: `11111${i}` } })
      fireEvent.click(submitBtn)
      await waitFor(() => {
        expect(screen.getByTestId('otp-error-alert')).toBeInTheDocument()
      })
    }

    // 4th attempt
    fireEvent.change(input, { target: { value: '999999' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('otp-error-alert')).toBeInTheDocument()
      expect(
        screen.getByText('Too many failed attempts. Please request a new OTP.')
      ).toBeInTheDocument()
      expect(screen.getByTestId('otp-status-indicator')).toHaveTextContent('otpSent')
    })
  })
})
