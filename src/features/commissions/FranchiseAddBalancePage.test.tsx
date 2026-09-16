import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FranchiseAddBalancePage } from './FranchiseAddBalancePage'
import { commissionApi, type FranchiseAddBalanceTransaction } from '@/api/commission.api'
import { otpApi } from '@/api/otp.api'
import { masterDataApi } from '@/api/masterdata.api'
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
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <FranchiseAddBalancePage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('FranchiseAddBalancePage Component', () => {
  const mockTransactions: FranchiseAddBalanceTransaction[] = [
    {
      fabSeq: 9001,
      srcMsisdn: '9848011111',
      destMsisdn: '9848022222',
      amount: 50000,
      circle: 11,
      circleName: 'Delhi',
      cdt: '2026-09-16 10:30:00',
      createdBy: 'dealer_admin',
      status: 'PENDING',
    },
    {
      fabSeq: 9002,
      srcMsisdn: '9848033333',
      destMsisdn: '9848044444',
      amount: 25000,
      circle: 21,
      circleName: 'Andhra Pradesh',
      cdt: '2026-09-16 11:15:00',
      createdBy: 'franchise_mgr',
      status: 'APPROVED',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Auth user with commissionPermissions
    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'supervisor@scm.test',
        hrmsId: '100456',
        mobileNumber: '9848099887',
        roleId: 1,
      },
      {
        commissionPermissions: 1,
      }
    )

    // Mock API queries
    vi.spyOn(masterDataApi, 'getAllCircles').mockResolvedValue([
      { circleId: 11, circleName: 'Delhi' },
      { circleId: 21, circleName: 'Andhra Pradesh' },
    ])

    vi.spyOn(commissionApi, 'getFranchiseAddBalanceTransactions').mockResolvedValue(mockTransactions)

    // Mock OTP endpoints
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent successfully',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified',
    })

    // Mock Mutations
    vi.spyOn(commissionApi, 'approveFranchiseAddBalance').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Balance addition approved',
    })
    vi.spyOn(commissionApi, 'rejectFranchiseAddBalance').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Balance addition rejected',
    })
  })

  // Permission Guard
  it('blocks access when user lacks permissions', () => {
    useAuthStore.getState().setPermissions({
      commissionPermissions: 0,
    })

    renderComponent()

    expect(screen.getByTestId('franchise-balance-permission-denied')).toBeInTheDocument()
    expect(screen.queryByTestId('franchise-transactions-table')).not.toBeInTheDocument()
  })

  // Render Table
  it('renders transactions table with pending requests', async () => {
    renderComponent()

    expect(screen.getByTestId('franchise-balance-page')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('tx-seq-9001')).toBeInTheDocument()
      expect(screen.getByTestId('tx-seq-9002')).toBeInTheDocument()
      expect(screen.getByTestId('approve-btn-9001')).toBeInTheDocument()
      expect(screen.getByTestId('reject-btn-9001')).toBeInTheDocument()
    })
  })

  // Approve Flow with FranchiseAddbalanceApprove OTP topic
  it('triggers OTP with topic FranchiseAddbalanceApprove on Approve click and calls approveFranchiseAddBalance upon verification', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('approve-btn-9001')).toBeInTheDocument()
    })

    // Click Approve
    fireEvent.click(screen.getByTestId('approve-btn-9001'))

    // OTP Modal appears
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Verify sendOtp called with topic 'FranchiseAddbalanceApprove'
    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848099887',
      operation: '10069',
      topic: 'FranchiseAddbalanceApprove',
    })

    // API must NOT be called before OTP is submitted
    expect(commissionApi.approveFranchiseAddBalance).not.toHaveBeenCalled()

    // Enter OTP and submit
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '112233' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // API should now be called
    await waitFor(() => {
      expect(commissionApi.approveFranchiseAddBalance).toHaveBeenCalledWith({
        fabSeqList: [9001],
        actionUser: 'supervisor@scm.test',
      })
    })
  })

  // Reject Flow with FranchiseAddbalanceReject OTP topic
  it('triggers OTP with topic FranchiseAddbalanceReject on Reject click and calls rejectFranchiseAddBalance upon verification', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('reject-btn-9001')).toBeInTheDocument()
    })

    // Click Reject
    fireEvent.click(screen.getByTestId('reject-btn-9001'))

    // First, Confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('confirmation-confirm-btn')).toHaveTextContent('Proceed to Reject')
    })

    // Confirm to proceed to OTP
    fireEvent.click(screen.getByTestId('confirmation-confirm-btn'))

    // OTP Modal appears
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Verify sendOtp called with topic 'FranchiseAddbalanceReject'
    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848099887',
      operation: '10069',
      topic: 'FranchiseAddbalanceReject',
    })

    // Reject API must NOT be called before OTP verification
    expect(commissionApi.rejectFranchiseAddBalance).not.toHaveBeenCalled()

    // Enter OTP and submit
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '445566' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // API should now be called
    await waitFor(() => {
      expect(commissionApi.rejectFranchiseAddBalance).toHaveBeenCalledWith({
        fabSeqList: [9001],
        actionUser: 'supervisor@scm.test',
      })
    })
  })
})
