import * as React from 'react'
import { useOtpStore, type OtpContext, type OtpStatus } from '@/stores/otpStore'
import { otpApi } from '@/api/otp.api'

export interface UseOtpFlowOptions {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: Error | string) => void;
}

export interface StartOtpContext extends OtpContext {
  autoSend?: boolean;
}

export function useOtpFlow(options?: UseOtpFlowOptions) {
  const store = useOtpStore()
  const successCallbackRef = React.useRef(options?.onSuccess)
  const errorCallbackRef = React.useRef(options?.onError)

  // Keep refs up-to-date with latest callbacks without triggering re-renders
  React.useEffect(() => {
    successCallbackRef.current = options?.onSuccess
    errorCallbackRef.current = options?.onError
  }, [options?.onSuccess, options?.onError])

  /**
   * Starts the OTP flow for an action context.
   * By default, initializes state to 'confirming'.
   * If autoSend is true, immediately dispatches the sendOtp API call.
   */
  const start = React.useCallback(
    async (context: StartOtpContext) => {
      const { autoSend = false, ...otpContext } = context

      // Reset any previous state first if not already idle
      if (store.status !== 'idle') {
        store.reset()
      }

      const started = store.startFlow(otpContext, 'confirming')
      if (!started) {
        return false
      }

      if (autoSend) {
        return await sendOtp(otpContext)
      }

      return true
    },
    [store]
  )

  /**
   * Dispatches the OTP token to the user's mobile number.
   * Transitions from 'confirming' (or 'failure') -> 'otpSent'.
   */
  const sendOtp = React.useCallback(
    async (overrideContext?: OtpContext): Promise<boolean> => {
      const ctx = overrideContext || store.context
      if (!ctx) {
        const msg = 'Cannot send OTP: No context specified.'
        store.setFailure(msg)
        errorCallbackRef.current?.(new Error(msg))
        return false
      }

      try {
        await otpApi.sendOtp({
          msisdn: ctx.msisdn,
          operation: ctx.operation || '10069',
          topic: ctx.topic,
        })

        store.setOtpSent()
        return true
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
        store.setFailure(errorMsg)
        errorCallbackRef.current?.(err instanceof Error ? err : new Error(errorMsg))
        return false
      }
    },
    [store]
  )

  /**
   * Submits the OTP code for verification.
   * Transitions 'otpSent' / 'failure' -> 'validating' -> 'success' (or 'failure').
   * If validation succeeds, executes the onSuccess callback.
   */
  const submitOtp = React.useCallback(
    async (code?: string): Promise<boolean> => {
      const enteredCode = (code !== undefined ? code : store.otpCode).trim()
      const ctx = store.context

      if (!enteredCode) {
        store.setFailure('Please enter a valid OTP code.')
        return false
      }

      if (!ctx) {
        store.setFailure('No active OTP session found.')
        return false
      }

      // Transition to validating
      const canValidate = store.setValidating(enteredCode)
      if (!canValidate) {
        const errorMsg = useOtpStore.getState().errorMessage || 'Validation not allowed'
        errorCallbackRef.current?.(new Error(errorMsg))
        return false
      }

      try {
        const res = await otpApi.validateOtp({
          otp: enteredCode,
          operation: ctx.operation || '10069',
          msisdn: ctx.msisdn,
        })

        // Check if API payload signaled an explicit failure status
        if (res.isValid === false || (typeof res.status === 'string' && res.status.toUpperCase() === 'FAILED')) {
          const failureMsg = res.message || 'OTP verification failed. Please check the code.'
          store.setFailure(failureMsg)
          errorCallbackRef.current?.(new Error(failureMsg))
          return false
        }

        // Mark state machine success
        store.setSuccess()

        // Execute mutation callback
        if (successCallbackRef.current) {
          await successCallbackRef.current()
        }

        return true
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Invalid OTP. Please check the code.'
        store.setFailure(errorMsg)
        errorCallbackRef.current?.(err instanceof Error ? err : new Error(errorMsg))
        return false
      }
    },
    [store]
  )

  /**
   * Resends OTP to the current context's phone number.
   */
  const resendOtp = React.useCallback(async () => {
    return await sendOtp()
  }, [sendOtp])

  /**
   * Resets the store back to 'idle'.
   */
  const reset = React.useCallback(() => {
    store.reset()
  }, [store])

  return {
    // State machine values
    status: store.status as OtpStatus,
    context: store.context,
    otpCode: store.otpCode,
    errorMessage: store.errorMessage,
    attempts: store.attempts,

    // Status boolean flags for convenience
    isIdle: store.status === 'idle',
    isConfirming: store.status === 'confirming',
    isOtpSent: store.status === 'otpSent',
    isValidating: store.status === 'validating',
    isSuccess: store.status === 'success',
    isFailure: store.status === 'failure',

    // Core actions
    start,
    sendOtp,
    submitOtp,
    resendOtp,
    reset,
    setOtpCode: store.setOtpCode,
  }
}
