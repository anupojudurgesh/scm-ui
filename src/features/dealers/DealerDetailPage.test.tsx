import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DealerDetailPage } from './DealerDetailPage'
import { dealerApi, type Dealer } from '@/api/dealer.api'
import { otpApi } from '@/api/otp.api'
import { useOtpStore } from '@/stores/otpStore'
import { useAuthStore } from '@/stores/authStore'

function renderComponent(msisdn = '9811002233') {
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
    <MemoryRouter initialEntries={[`/dealers/${msisdn}`]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/dealers/:msisdn" element={<DealerDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('DealerDetailPage Component', () => {
  const mockDealer: Dealer = {
    dealerId: 1001,
    dealerCode: 'FRA-DEL-010',
    scmMsisdn: '9811002233',
    mobile: '9811002233',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    dob: '1984-06-15',
    address: 'Shop 14, Connaught Place, New Delhi',
    dealerType: '1',
    dealerTypeName: 'Franchise',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 1101,
    ssaName: 'Central Delhi',
    category: '1',
    categoryName: 'Master Franchise',
    aadhaarId: '987654321098',
    panId: 'ABCDE1234F',
    gstNumber: '07AAAAA0000A1Z5',
    status: 'Active',
    parentMsisdn: '9811000000',
    parentName: 'Telecom BSNL Direct',
    certificateFileName: 'rajesh_sharma_kyc.pdf',
    cdt: '2026-01-10 10:00:00',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Auth user setup with dealerPermissions
    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'supervisor@scm.test',
        hrmsId: '100456',
        mobileNumber: '9848099887',
        roleId: 1,
      },
      {
        dealerPermissions: 1,
      }
    )

    // Mock API queries
    vi.spyOn(dealerApi, 'getDealerByMsisdn').mockResolvedValue(mockDealer)

    // Mock OTP APIs
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified',
    })

    // Mock Mutations
    vi.spyOn(dealerApi, 'updateDealer').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Dealer updated',
    })
    vi.spyOn(dealerApi, 'dealerStatusChange').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Dealer status changed',
    })
    vi.spyOn(dealerApi, 'resetMpin').mockResolvedValue({
      status: 'SUCCESS',
      message: 'MPIN reset',
    })
    vi.spyOn(dealerApi, 'changeDealerHierarchy').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Hierarchy changed',
    })
  })

  // Permission Guard
  it('blocks access when user lacks dealerPermissions', async () => {
    useAuthStore.getState().setPermissions({
      dealerPermissions: 0,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('dealer-detail-permission-denied')).toBeInTheDocument()
    })
  })

  // Profile Rendering
  it('renders dealer profile info, compliance, and distribution hierarchy card', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('dealer-detail-page')).toBeInTheDocument()
      expect(screen.getByTestId('dealer-title-name')).toHaveTextContent('Rajesh Sharma')
      expect(screen.getByTestId('dealer-hierarchy-card')).toBeInTheDocument()
      expect(screen.getByTestId('parent-dealer-name')).toHaveTextContent('Telecom BSNL Direct')
    })
  })

  // 1. Edit Flow: Topic 'Modifydealer'
  it('triggers OTP with topic Modifydealer on Edit submit and calls updateDealer on OTP success', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('edit-dealer-btn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('edit-dealer-btn'))

    // Dialog opens
    expect(screen.getByTestId('edit-dealer-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('edit-dealer-first-name')).toHaveValue('Rajesh')

    // Change first name
    fireEvent.change(screen.getByTestId('edit-dealer-first-name'), { target: { value: 'Rajesh Kumar' } })

    // Submit edit form
    fireEvent.click(screen.getByTestId('submit-edit-dealer-btn'))

    // OTP Modal appears with topic 'Modifydealer'
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848099887',
      operation: '10069',
      topic: 'Modifydealer',
    })

    // API must NOT be called before OTP
    expect(dealerApi.updateDealer).not.toHaveBeenCalled()

    // Submit OTP code
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    await waitFor(() => {
      expect(dealerApi.updateDealer).toHaveBeenCalledWith(
        expect.objectContaining({
          dealerId: 1001,
          firstName: 'Rajesh Kumar',
        })
      )
    })
  })

  // 2. Status Change Flow: Topic 'DealerStatus'
  it('shows ConfirmationDialog then triggers OTP with topic DealerStatus on Status Change', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('change-status-btn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('change-status-btn'))

    // Confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('confirmation-confirm-btn'))

    // OTP Modal appears with topic 'DealerStatus'
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848099887',
      operation: '10069',
      topic: 'DealerStatus',
    })

    expect(dealerApi.dealerStatusChange).not.toHaveBeenCalled()

    // Submit OTP
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '112233' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    await waitFor(() => {
      expect(dealerApi.dealerStatusChange).toHaveBeenCalledWith({
        msisdn: '9811002233',
        username: 'supervisor@scm.test',
        status: 'Inactive',
      })
    })
  })

  // 3. MPIN Reset Flow: Topic 'DealerMpinreset' with Irreversible Warning
  it('shows ConfirmationDialog warning irreversible action then triggers OTP with topic DealerMpinreset', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('reset-mpin-btn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('reset-mpin-btn'))

    // Irreversible confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByText(/Warning: This action is irreversible/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('confirmation-confirm-btn'))

    // OTP Modal appears with topic 'DealerMpinreset'
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848099887',
      operation: '10069',
      topic: 'DealerMpinreset',
    })

    expect(dealerApi.resetMpin).not.toHaveBeenCalled()

    // Submit OTP
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '998877' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    await waitFor(() => {
      expect(dealerApi.resetMpin).toHaveBeenCalledWith('9811002233', 'supervisor@scm.test')
    })
  })

  // 4. Hierarchy Change Flow: Topic 'DealerHierarchyChange'
  it('triggers OTP with topic DealerHierarchyChange on Hierarchy Change and calls changeDealerHierarchy on OTP success', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('change-hierarchy-btn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('change-hierarchy-btn'))

    // Hierarchy dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('hierarchy-modal')).toBeInTheDocument()
    })

    // Enter target parent MSISDN
    fireEvent.change(screen.getByTestId('target-parent-msisdn-input'), {
      target: { value: '9848011223' },
    })

    fireEvent.click(screen.getByTestId('submit-hierarchy-btn'))

    // OTP Modal appears with topic 'DealerHierarchyChange'
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848099887',
      operation: '10069',
      topic: 'DealerHierarchyChange',
    })

    expect(dealerApi.changeDealerHierarchy).not.toHaveBeenCalled()

    // Submit OTP
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '556677' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    await waitFor(() => {
      expect(dealerApi.changeDealerHierarchy).toHaveBeenCalledWith({
        srcMsisdn: '9811002233',
        parentMsisdn: '9848011223',
        guiUsername: 'supervisor@scm.test',
        type: 'Franchise',
      })
    })
  })
})
