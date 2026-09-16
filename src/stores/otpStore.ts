import { create } from 'zustand'

export type OtpStatus =
  | 'idle'
  | 'confirming'
  | 'otpSent'
  | 'validating'
  | 'success'
  | 'failure'

export interface OtpContext {
  topic: string;
  operation?: string;
  msisdn: string;
  actionName?: string;
  meta?: Record<string, unknown>;
}

// Allowed state machine transitions map
const ALLOWED_TRANSITIONS: Record<OtpStatus, OtpStatus[]> = {
  idle: ['confirming', 'otpSent'],
  confirming: ['otpSent', 'idle'],
  otpSent: ['validating', 'otpSent', 'idle'],
  validating: ['success', 'failure', 'idle'],
  failure: ['validating', 'otpSent', 'idle'],
  success: ['idle'],
}

export interface OtpState {
  status: OtpStatus;
  context: OtpContext | null;
  otpCode: string;
  errorMessage: string | null;
  attempts: number;

  // Actions
  startFlow: (context: OtpContext, startState?: 'confirming' | 'otpSent') => boolean;
  setConfirming: () => boolean;
  setOtpSent: () => boolean;
  setValidating: (otpCode: string) => boolean;
  setSuccess: () => boolean;
  setFailure: (errorMessage: string) => boolean;
  setOtpCode: (code: string) => void;
  reset: () => void;
}

export const useOtpStore = create<OtpState>((set, get) => {
  const transitionTo = (newStatus: OtpStatus, updates: Partial<OtpState> = {}): boolean => {
    const currentStatus = get().status
    const allowed = ALLOWED_TRANSITIONS[currentStatus]

    if (!allowed || !allowed.includes(newStatus)) {
      return false
    }

    set({
      status: newStatus,
      ...updates,
    })
    return true
  }

  return {
    status: 'idle',
    context: null,
    otpCode: '',
    errorMessage: null,
    attempts: 0,

    startFlow: (context: OtpContext, startState: 'confirming' | 'otpSent' = 'confirming') => {
      const current = get().status
      if (current !== 'idle') {
        return false
      }

      set({
        status: startState,
        context: {
          operation: '10069',
          ...context,
        },
        otpCode: '',
        errorMessage: null,
        attempts: 0,
      })
      return true
    },

    setConfirming: () =>
      transitionTo('confirming', { errorMessage: null }),

    setOtpSent: () =>
      transitionTo('otpSent', { errorMessage: null, attempts: 0 }),

    setValidating: (otpCode: string) => {
      const currentAttempts = get().attempts
      if (currentAttempts >= 3) {
        set({
          status: 'otpSent',
          errorMessage: 'Too many failed attempts. Please request a new OTP.',
        })
        return false
      }

      return transitionTo('validating', {
        otpCode,
        errorMessage: null,
        attempts: currentAttempts + 1,
      })
    },

    setSuccess: () =>
      transitionTo('success', { errorMessage: null }),

    setFailure: (errorMessage: string) =>
      transitionTo('failure', { errorMessage }),

    setOtpCode: (code: string) =>
      set({ otpCode: code }),

    reset: () =>
      set({
        status: 'idle',
        context: null,
        otpCode: '',
        errorMessage: null,
        attempts: 0,
      }),
  }
})
