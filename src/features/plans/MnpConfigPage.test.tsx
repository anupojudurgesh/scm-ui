import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MnpConfigPage } from './MnpConfigPage'
import { planApi, type MnpRecord } from '@/api/plan.api'
import { otpApi } from '@/api/otp.api'
import { useOtpStore } from '@/stores/otpStore'
import { useAuthStore } from '@/stores/authStore'

function renderComponent() {
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
    <MemoryRouter initialEntries={['/plans/mnp']}>
      <QueryClientProvider client={queryClient}>
        <MnpConfigPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('MnpConfigPage Component', () => {
  const mockMnpRecords: MnpRecord[] = [
    {
      id: 'MNP-1',
      msisdn: '9440012345',
      recipientNo: '40401',
      circleId: 1,
      circleName: 'AP (Andhra Pradesh)',
      username: 'admin_user',
      status: 'Ported In',
    },
    {
      id: 'MNP-2',
      msisdn: '9490054321',
      recipientNo: '40402',
      circleId: 2,
      circleName: 'TS (Telangana)',
      username: 'admin_user',
      status: 'Ported In',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Auth setup
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

    // Mock APIs
    vi.spyOn(planApi, 'listMnpRecords').mockResolvedValue(mockMnpRecords)
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified',
    })
    vi.spyOn(planApi, 'saveMnp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'MNP saved',
    })
    vi.spyOn(planApi, 'modifyMnpData').mockResolvedValue({
      status: 'SUCCESS',
      message: 'MNP modified',
    })
    vi.spyOn(planApi, 'deleteMnp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'MNP deleted',
    })
  })

  // Permission Guard
  it('blocks access when user lacks plansNumberpermissions', async () => {
    useAuthStore.getState().setPermissions({
      plansNumberpermissions: 0,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument()
    })
  })

  // Rendering
  it('renders MNP routing records and search filter', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('9440012345')).toBeInTheDocument()
      expect(screen.getByText('9490054321')).toBeInTheDocument()
      expect(screen.getByText('40401')).toBeInTheDocument()
      expect(screen.getByText('40402')).toBeInTheDocument()
    })

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Search by 10-digit MSISDN/i)
    fireEvent.change(searchInput, { target: { value: '94900' } })

    await waitFor(() => {
      expect(screen.queryByText('9440012345')).not.toBeInTheDocument()
      expect(screen.getByText('9490054321')).toBeInTheDocument()
    })
  })

  // Add MNP -> OTP topic 'ADD MNP'
  it('triggers OTP with exact topic "ADD MNP" on Add MNP submit and calls saveMnp on verified OTP', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('add-mnp-btn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('add-mnp-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('mnp-add-form')).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByTestId('input-mnp-msisdn'), { target: { value: '9848011223' } })
    fireEvent.change(screen.getByTestId('input-mnp-recipient'), { target: { value: '40405' } })

    // Select circle
    const circleSelector = screen.getByTestId('select-circle-trigger')
    fireEvent.click(circleSelector)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
    const options = screen.getAllByRole('option')
    fireEvent.click(options[0])

    // Submit
    fireEvent.click(screen.getByTestId('submit-mnp-btn'))

    // Verify OTP topic is exactly 'ADD MNP'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('ADD MNP')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const otpInput = screen.getByTestId('otp-input')
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // Verify saveMnp called
    await waitFor(() => {
      expect(planApi.saveMnp).toHaveBeenCalledTimes(1)
      expect(planApi.saveMnp).toHaveBeenCalledWith(
        expect.objectContaining({
          msisdn: '9848011223',
          recipientNo: '40405',
        })
      )
    })
  })

  // Modify MNP -> OTP topic 'ModifyMnp'
  it('triggers OTP with topic "ModifyMnp" on edit submit and calls modifyMnpData on verified OTP', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('btn-edit-mnp-9440012345')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('btn-edit-mnp-9440012345'))

    await waitFor(() => {
      expect(screen.getByTestId('mnp-edit-form')).toBeInTheDocument()
    })

    // Modify recipient number
    fireEvent.change(screen.getByTestId('input-edit-mnp-recipient'), { target: { value: '40499' } })
    fireEvent.click(screen.getByTestId('submit-edit-mnp-btn'))

    // Verify OTP topic 'ModifyMnp'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('ModifyMnp')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const editOtpInput = screen.getByTestId('otp-input')
    fireEvent.change(editOtpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // Verify modifyMnpData called
    await waitFor(() => {
      expect(planApi.modifyMnpData).toHaveBeenCalledTimes(1)
      expect(planApi.modifyMnpData).toHaveBeenCalledWith(
        expect.objectContaining({
          msisdn: '9440012345',
          recipientNo: '40499',
        })
      )
    })
  })

  // Delete MNP -> Confirmation then OTP topic 'DeleteMnp'
  it('prompts ConfirmationDialog then triggers OTP with topic "DeleteMnp" and calls deleteMnp on verified OTP', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('btn-delete-mnp-9440012345')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('btn-delete-mnp-9440012345'))

    await waitFor(() => {
      expect(screen.getByText('Delete MNP Routing Rule?')).toBeInTheDocument()
    })

    // Confirm to proceed to OTP
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to OTP' }))

    // Verify OTP topic 'DeleteMnp'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('DeleteMnp')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const delOtpInput = screen.getByTestId('otp-input')
    fireEvent.change(delOtpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // Verify deleteMnp called
    await waitFor(() => {
      expect(planApi.deleteMnp).toHaveBeenCalledTimes(1)
      expect(planApi.deleteMnp).toHaveBeenCalledWith(
        expect.objectContaining({
          msisdn: '9440012345',
        })
      )
    })
  })
})
