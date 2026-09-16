import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DenominationConfigPage } from './DenominationConfigPage'
import { NumberSeriesPage } from './NumberSeriesPage'
import { planApi, type Denomination, type NumberSeries } from '@/api/plan.api'
import { otpApi } from '@/api/otp.api'
import { useOtpStore } from '@/stores/otpStore'
import { useAuthStore } from '@/stores/authStore'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('DenominationConfigPage Component', () => {
  const mockDenominations: Denomination[] = [
    {
      id: 'D-1',
      rechargePlanName: 'STV 199 Unlimited',
      planType: 'STV',
      price: '199',
      validity: '28',
      description: '2GB/day + Unlimited Calls',
      bundleName: 'Unlimited',
      bucketId: 1,
      faceValue: 199,
      netValue: 199,
      cardGroup: 1,
      varepDenom: 199,
      circleId: 1,
      circleName: 'AP (Andhra Pradesh)',
      vasDenom: 0,
      varepGroup: 'General',
      status: 'Active',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'supervisor@scm.test',
        hrmsId: '100456',
        mobileNumber: '9848099887',
        roleId: 1,
      },
      {
        plansNumberpermissions: 1,
      }
    )

    vi.spyOn(planApi, 'listDenominations').mockResolvedValue(mockDenominations)
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified',
    })
    vi.spyOn(planApi, 'saveDenomination').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Denomination saved',
    })
  })

  it('triggers OTP with topic Denominationconfiguration on submit and calls saveDenomination upon verification', async () => {
    renderWithClient(<DenominationConfigPage />)

    await waitFor(() => {
      expect(screen.getByText('STV 199 Unlimited')).toBeInTheDocument()
    })

    // Open add modal
    fireEvent.click(screen.getByTestId('add-denom-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('denomination-form')).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByTestId('input-denom-name'), {
      target: { value: 'Data Special 249' },
    })
    fireEvent.change(screen.getByTestId('input-denom-price'), {
      target: { value: '249' },
    })
    fireEvent.change(screen.getByTestId('input-denom-facevalue'), {
      target: { value: '249' },
    })
    fireEvent.change(screen.getByTestId('input-denom-netvalue'), {
      target: { value: '249' },
    })
    fireEvent.change(screen.getByTestId('input-denom-desc'), {
      target: { value: '2GB per day high-speed data' },
    })

    // Select circle
    const circleSelector = screen.getByTestId('select-circle-trigger')
    fireEvent.click(circleSelector)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
    const options = screen.getAllByRole('option')
    fireEvent.click(options[0])

    // Submit
    fireEvent.click(screen.getByTestId('submit-denom-btn'))

    // Verify OTP modal opens with topic 'Denominationconfiguration'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('Denominationconfiguration')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const otpInput = screen.getByTestId('otp-input')
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // Confirm saveDenomination called
    await waitFor(() => {
      expect(planApi.saveDenomination).toHaveBeenCalledTimes(1)
      expect(planApi.saveDenomination).toHaveBeenCalledWith(
        expect.objectContaining({
          rechargePlanName: 'Data Special 249',
          price: 249,
          faceValue: 249,
        })
      )
    })
  })
})

describe('NumberSeriesPage Component', () => {
  const mockSeries: NumberSeries[] = [
    {
      numberSeriesId: 'SER-101',
      numberSeries: '94400',
      circleId: 1,
      circleName: 'AP (Andhra Pradesh)',
      inId: 101,
      zoneId: 1,
      seqNo: '1',
      username: 'admin_user',
      status: 'Allocated',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'supervisor@scm.test',
        hrmsId: '100456',
        mobileNumber: '9848099887',
        roleId: 1,
      },
      {
        plansNumberpermissions: 1,
      }
    )

    vi.spyOn(planApi, 'listNumberSeries').mockResolvedValue(mockSeries)
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified',
    })
    vi.spyOn(planApi, 'addNumberSeries').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Series added',
    })
    vi.spyOn(planApi, 'editNumberSeries').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Series edited',
    })
    vi.spyOn(planApi, 'purgeNumberSeries').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Series purged',
    })
  })

  it('triggers OTP with topic AddnumberSeries on add and calls addNumberSeries upon verification', async () => {
    renderWithClient(<NumberSeriesPage />)

    await waitFor(() => {
      expect(screen.getByText('94400')).toBeInTheDocument()
    })

    // Open add modal
    fireEvent.click(screen.getByTestId('add-series-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('series-add-form')).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByTestId('input-series-prefix'), {
      target: { value: '94900' },
    })
    fireEvent.change(screen.getByTestId('input-series-inid'), {
      target: { value: '102' },
    })

    // Select circle
    const circleSelector = screen.getByTestId('select-circle-trigger')
    fireEvent.click(circleSelector)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
    const options = screen.getAllByRole('option')
    fireEvent.click(options[0])

    // Submit
    fireEvent.click(screen.getByTestId('submit-series-btn'))

    // Verify OTP topic 'AddnumberSeries'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('AddnumberSeries')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const otpInput = screen.getByTestId('otp-input')
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // Verify API called
    await waitFor(() => {
      expect(planApi.addNumberSeries).toHaveBeenCalledTimes(1)
      expect(planApi.addNumberSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          numberSeries: '94900',
          inId: 102,
        }),
        'supervisor@scm.test'
      )
    })
  })

  it('triggers OTP with topic ModfifynumberSeries on edit and calls editNumberSeries upon verification', async () => {
    renderWithClient(<NumberSeriesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('btn-edit-series-94400')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('btn-edit-series-94400'))

    await waitFor(() => {
      expect(screen.getByTestId('series-edit-form')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByTestId('input-edit-series-inid'), {
      target: { value: '105' },
    })
    fireEvent.click(screen.getByTestId('submit-edit-series-btn'))

    // Verify OTP topic 'ModfifynumberSeries'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('ModfifynumberSeries')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const otpInput = screen.getByTestId('otp-input')
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    await waitFor(() => {
      expect(planApi.editNumberSeries).toHaveBeenCalledTimes(1)
      expect(planApi.editNumberSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          numberSeries: '94400',
          inId: 105,
        }),
        'supervisor@scm.test'
      )
    })
  })

  it('prompts ConfirmationDialog then triggers OTP with topic DeleteNumberseries on purge', async () => {
    renderWithClient(<NumberSeriesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('btn-purge-series-94400')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('btn-purge-series-94400'))

    await waitFor(() => {
      expect(screen.getByText('Purge Number Series Allocation?')).toBeInTheDocument()
    })

    // Proceed
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to OTP' }))

    // Verify OTP topic 'DeleteNumberseries'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('DeleteNumberseries')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const otpInput = screen.getByTestId('otp-input')
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    await waitFor(() => {
      expect(planApi.purgeNumberSeries).toHaveBeenCalledTimes(1)
      expect(planApi.purgeNumberSeries).toHaveBeenCalledWith({
        series: '94400',
        username: 'supervisor@scm.test',
      })
    })
  })
})
