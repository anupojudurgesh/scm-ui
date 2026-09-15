import { describe, it, expect, beforeEach } from 'vitest'
import { useOtpStore, type OtpContext } from './otpStore'

describe('otpStore State Machine', () => {
  const sampleContext: OtpContext = {
    topic: 'Dealercreation',
    operation: '10069',
    msisdn: '9876543210',
    actionName: 'Create Franchise Dealer',
    meta: { dealerCode: 'DL-9912' },
  }

  beforeEach(() => {
    useOtpStore.getState().reset()
  })

  it('initializes with idle state and clean context', () => {
    const state = useOtpStore.getState()
    expect(state.status).toBe('idle')
    expect(state.context).toBeNull()
    expect(state.otpCode).toBe('')
    expect(state.errorMessage).toBeNull()
    expect(state.attempts).toBe(0)
  })

  it('transitions idle -> confirming via startFlow', () => {
    const success = useOtpStore.getState().startFlow(sampleContext, 'confirming')
    expect(success).toBe(true)

    const state = useOtpStore.getState()
    expect(state.status).toBe('confirming')
    expect(state.context?.topic).toBe('Dealercreation')
    expect(state.context?.msisdn).toBe('9876543210')
    expect(state.context?.operation).toBe('10069')
  })

  it('transitions idle -> otpSent directly if specified in startFlow', () => {
    const success = useOtpStore.getState().startFlow(sampleContext, 'otpSent')
    expect(success).toBe(true)
    expect(useOtpStore.getState().status).toBe('otpSent')
  })

  it('transitions confirming -> otpSent', () => {
    useOtpStore.getState().startFlow(sampleContext, 'confirming')
    const ok = useOtpStore.getState().setOtpSent()
    expect(ok).toBe(true)
    expect(useOtpStore.getState().status).toBe('otpSent')
  })

  it('transitions otpSent -> validating with entered OTP code and increments attempts', () => {
    useOtpStore.getState().startFlow(sampleContext, 'otpSent')
    expect(useOtpStore.getState().attempts).toBe(0)

    const ok = useOtpStore.getState().setValidating('654321')
    expect(ok).toBe(true)

    const state = useOtpStore.getState()
    expect(state.status).toBe('validating')
    expect(state.otpCode).toBe('654321')
    expect(state.attempts).toBe(1)
  })

  it('transitions validating -> success', () => {
    useOtpStore.getState().startFlow(sampleContext, 'otpSent')
    useOtpStore.getState().setValidating('654321')

    const ok = useOtpStore.getState().setSuccess()
    expect(ok).toBe(true)
    expect(useOtpStore.getState().status).toBe('success')
  })

  it('transitions validating -> failure with error message', () => {
    useOtpStore.getState().startFlow(sampleContext, 'otpSent')
    useOtpStore.getState().setValidating('000000')

    const ok = useOtpStore.getState().setFailure('Invalid OTP entered. Please try again.')
    expect(ok).toBe(true)

    const state = useOtpStore.getState()
    expect(state.status).toBe('failure')
    expect(state.errorMessage).toBe('Invalid OTP entered. Please try again.')
  })

  it('allows retry from failure -> validating and increments attempts', () => {
    useOtpStore.getState().startFlow(sampleContext, 'otpSent')
    useOtpStore.getState().setValidating('111111') // attempt 1
    useOtpStore.getState().setFailure('Incorrect OTP')

    // Retry validating with corrected OTP
    const ok = useOtpStore.getState().setValidating('123456') // attempt 2
    expect(ok).toBe(true)

    const state = useOtpStore.getState()
    expect(state.status).toBe('validating')
    expect(state.otpCode).toBe('123456')
    expect(state.attempts).toBe(2)
    expect(state.errorMessage).toBeNull()
  })

  it('allows resend transition from failure -> otpSent', () => {
    useOtpStore.getState().startFlow(sampleContext, 'otpSent')
    useOtpStore.getState().setValidating('999999')
    useOtpStore.getState().setFailure('OTP Expired')

    const ok = useOtpStore.getState().setOtpSent()
    expect(ok).toBe(true)

    const state = useOtpStore.getState()
    expect(state.status).toBe('otpSent')
    expect(state.errorMessage).toBeNull()
  })

  it('blocks invalid transitions and preserves current state', () => {
    // Cannot transition idle -> validating directly without startFlow
    expect(useOtpStore.getState().status).toBe('idle')
    const invalidStep = useOtpStore.getState().setValidating('123456')
    expect(invalidStep).toBe(false)
    expect(useOtpStore.getState().status).toBe('idle')

    // Cannot transition idle -> success
    const invalidSuccess = useOtpStore.getState().setSuccess()
    expect(invalidSuccess).toBe(false)
    expect(useOtpStore.getState().status).toBe('idle')

    // Cannot start flow if already active
    useOtpStore.getState().startFlow(sampleContext, 'confirming')
    const doubleStart = useOtpStore.getState().startFlow(sampleContext)
    expect(doubleStart).toBe(false)
    expect(useOtpStore.getState().status).toBe('confirming')
  })

  it('resets from any active state back to idle', () => {
    useOtpStore.getState().startFlow(sampleContext, 'otpSent')
    useOtpStore.getState().setValidating('123456')
    useOtpStore.getState().setFailure('Something went wrong')

    useOtpStore.getState().reset()

    const state = useOtpStore.getState()
    expect(state.status).toBe('idle')
    expect(state.context).toBeNull()
    expect(state.otpCode).toBe('')
    expect(state.errorMessage).toBeNull()
    expect(state.attempts).toBe(0)
  })
})
