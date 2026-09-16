import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOtpFlow } from './useOtpFlow'
import { useOtpStore } from '@/stores/otpStore'
import { otpApi } from '@/api/otp.api'

describe('useOtpFlow Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useOtpFlow())
    expect(result.current.status).toBe('idle')
    expect(result.current.isIdle).toBe(true)
    expect(result.current.context).toBeNull()
  })

  it('executes the complete transition sequence: confirming -> otpSent -> validating -> success', async () => {
    const onSuccessMock = vi.fn()
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValueOnce({ status: 'SUCCESS' })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValueOnce({ status: 'SUCCESS' })

    const { result } = renderHook(() => useOtpFlow({ onSuccess: onSuccessMock }))

    // 1. start() transitions to confirming
    await act(async () => {
      await result.current.start({
        topic: 'UserCreation',
        msisdn: '9876543210',
        actionName: 'Create User',
      })
    })

    expect(result.current.status).toBe('confirming')
    expect(result.current.isConfirming).toBe(true)
    expect(result.current.context?.topic).toBe('UserCreation')
    expect(result.current.context?.msisdn).toBe('9876543210')

    // 2. sendOtp() transitions confirming -> otpSent
    await act(async () => {
      const ok = await result.current.sendOtp()
      expect(ok).toBe(true)
    })

    expect(result.current.status).toBe('otpSent')
    expect(result.current.isOtpSent).toBe(true)
    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9876543210',
      operation: '10069',
      topic: 'UserCreation',
    })

    // 3. submitOtp(code) transitions otpSent -> validating -> success
    await act(async () => {
      const ok = await result.current.submitOtp('123456')
      expect(ok).toBe(true)
    })

    expect(result.current.status).toBe('success')
    expect(result.current.isSuccess).toBe(true)
    expect(otpApi.validateOtp).toHaveBeenCalledWith({
      otp: '123456',
      operation: '10069',
      msisdn: '9876543210',
    })

    // 4. Caller's onSuccess callback is triggered
    expect(onSuccessMock).toHaveBeenCalledTimes(1)
  })

  it('handles autoSend=true to transition directly to otpSent', async () => {
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValueOnce({ status: 'SUCCESS' })

    const { result } = renderHook(() => useOtpFlow())

    await act(async () => {
      await result.current.start({
        topic: 'DealerStatus',
        msisdn: '9123456789',
        autoSend: true,
      })
    })

    expect(result.current.status).toBe('otpSent')
    expect(otpApi.sendOtp).toHaveBeenCalledTimes(1)
  })

  it('transitions validating -> failure on API validation error and does NOT call onSuccess', async () => {
    const onSuccessMock = vi.fn()
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValueOnce({ status: 'SUCCESS' })
    vi.spyOn(otpApi, 'validateOtp').mockRejectedValueOnce(new Error('Invalid OTP token'))

    const { result } = renderHook(() => useOtpFlow({ onSuccess: onSuccessMock }))

    await act(async () => {
      await result.current.start({
        topic: 'Modifydealer',
        msisdn: '9876543210',
        autoSend: true,
      })
    })

    expect(result.current.status).toBe('otpSent')

    // Submit wrong OTP
    await act(async () => {
      const ok = await result.current.submitOtp('000000')
      expect(ok).toBe(false)
    })

    expect(result.current.status).toBe('failure')
    expect(result.current.isFailure).toBe(true)
    expect(result.current.errorMessage).toBe('Invalid OTP token')
    expect(onSuccessMock).not.toHaveBeenCalled()
  })

  it('allows resending OTP from failure state', async () => {
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({ status: 'SUCCESS' })
    vi.spyOn(otpApi, 'validateOtp').mockRejectedValueOnce(new Error('OTP expired'))

    const { result } = renderHook(() => useOtpFlow())

    await act(async () => {
      await result.current.start({ topic: 'PrepaidFrc', msisdn: '9876543210', autoSend: true })
      await result.current.submitOtp('999999')
    })

    expect(result.current.status).toBe('failure')

    // Resend
    await act(async () => {
      const res = await result.current.resendOtp()
      expect(res).toBe(true)
    })

    expect(result.current.status).toBe('otpSent')
  })

  it('clears state on reset', async () => {
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValueOnce({ status: 'SUCCESS' })
    const { result } = renderHook(() => useOtpFlow())

    await act(async () => {
      await result.current.start({ topic: 'Addplan', msisdn: '9876543210', autoSend: true })
    })

    expect(result.current.status).toBe('otpSent')

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.context).toBeNull()
  })

  it('rejects submitOtp and surfaces error when max validation attempts (3) are exceeded', async () => {
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({ status: 'SUCCESS' })
    vi.spyOn(otpApi, 'validateOtp').mockRejectedValue(new Error('Incorrect code'))
    const onErrorMock = vi.fn()

    const { result } = renderHook(() => useOtpFlow({ onError: onErrorMock }))

    await act(async () => {
      await result.current.start({ topic: 'LimitTest', msisdn: '9876543210', autoSend: true })
    })

    // 3 failed validation attempts
    for (let i = 1; i <= 3; i++) {
      await act(async () => {
        const ok = await result.current.submitOtp(`11111${i}`)
        expect(ok).toBe(false)
      })
    }

    expect(result.current.attempts).toBe(3)

    // 4th attempt: blocked by retry limit
    let submitResult: boolean | undefined
    await act(async () => {
      submitResult = await result.current.submitOtp('999999')
    })

    expect(submitResult).toBe(false)
    expect(result.current.status).toBe('otpSent')
    expect(result.current.errorMessage).toBe('Too many failed attempts. Please request a new OTP.')
    expect(onErrorMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Too many failed attempts. Please request a new OTP.' })
    )
  })
})
