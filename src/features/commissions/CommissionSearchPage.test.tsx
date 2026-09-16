import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CommissionSearchPage } from './CommissionSearchPage'
import { commissionApi, type CommissionItem } from '@/api/commission.api'
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
        <CommissionSearchPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('CommissionSearchPage Component', () => {
  const mockFrcList: CommissionItem[] = [
    {
      commissionId: 101,
      type: 'prepaid-frc',
      circleId: 11,
      circleName: 'Delhi',
      categoryId: 1,
      categoryName: 'Prepaid Normal Plans',
      denomination: 199,
      sellerCommission: 5.5,
      fraCommission: 2.5,
      subCommission: 1.0,
      tds: 5,
    },
    {
      commissionId: 102,
      type: 'prepaid-frc',
      circleId: 21,
      circleName: 'Andhra Pradesh',
      categoryId: 2,
      categoryName: 'Special Tariff Vouchers',
      denomination: 299,
      sellerCommission: 8.0,
      fraCommission: 3.5,
      subCommission: 1.5,
      tds: 5,
    },
  ]

  const mockPostpaidList: CommissionItem[] = [
    {
      commissionId: 301,
      type: 'postpaid',
      circleId: 11,
      circleName: 'Delhi',
      categoryId: 3,
      categoryName: 'Postpaid Corporate Plans',
      actualCommission: 50,
      tdsAmount: 5,
      sellerLevel: 1,
      cap_limit: 500,
      fraCommission: 20,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Auth user with commissionPermissions
    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'admin@scm.test',
        hrmsId: '100099',
        mobileNumber: '9848011223',
        roleId: 1,
      },
      {
        commissionPermissions: 1,
      }
    )

    // Mock API queries
    vi.spyOn(commissionApi, 'getCategory').mockResolvedValue([
      { categoryId: 1, categoryName: 'Prepaid Normal Plans' },
      { categoryId: 2, categoryName: 'Special Tariff Vouchers' },
      { categoryId: 3, categoryName: 'Postpaid Corporate Plans' },
    ])

    vi.spyOn(masterDataApi, 'getAllCircles').mockResolvedValue([
      { circleId: 11, circleName: 'Delhi' },
      { circleId: 21, circleName: 'Andhra Pradesh' },
    ])

    vi.spyOn(commissionApi, 'fetchCommissions').mockImplementation(async (type) => {
      if (type === 'prepaid-frc') return mockFrcList
      if (type === 'postpaid') return mockPostpaidList
      return []
    })

    // Mock OTP endpoints
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP validated',
    })

    // Mock Mutations
    vi.spyOn(commissionApi, 'updateCommissionConfig').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Commission updated',
    })
    vi.spyOn(commissionApi, 'updatePostpaidCommission').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Postpaid commission updated',
    })
    vi.spyOn(commissionApi, 'updateLandlineCommission').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Landline commission updated',
    })
    vi.spyOn(commissionApi, 'deleteCommissionConfig').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Commission deleted',
    })
  })

  // Permission Guard
  it('enforces PermissionGuard when user lacks commissionPermissions', () => {
    useAuthStore.getState().setPermissions({
      commissionPermissions: 0,
    })

    renderComponent()

    expect(screen.getByTestId('commission-search-permission-denied')).toBeInTheDocument()
    expect(screen.queryByTestId('commission-search-tabs')).not.toBeInTheDocument()
  })

  // Render Directory
  it('renders search page with line-bar tabs and populated table', async () => {
    renderComponent()

    expect(screen.getByTestId('commission-search-page')).toBeInTheDocument()
    expect(screen.getByTestId('commission-search-tabs')).toBeInTheDocument()

    // Wait for table rows to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('commission-id-101')).toBeInTheDocument()
      expect(screen.getByTestId('commission-id-102')).toBeInTheDocument()
    })
  })

  // Edit Flow with Modify_PrepaidFRC OTP topic
  it('triggers OTP with topic Modify_PrepaidFRC on Edit submit and calls updateCommissionConfig on OTP verified', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('edit-commission-btn-101')).toBeInTheDocument()
    })

    // Click Edit button
    fireEvent.click(screen.getByTestId('edit-commission-btn-101'))

    // Dialog should open
    expect(screen.getByTestId('edit-commission-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('edit-seller-comm-input')).toHaveValue(5.5)

    // Modify seller commission
    fireEvent.change(screen.getByTestId('edit-seller-comm-input'), {
      target: { value: '7.5' },
    })

    // Submit the edit form -> opens OTP modal
    fireEvent.click(screen.getByTestId('edit-dialog-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Verify OTP was dispatched with topic Modify_PrepaidFRC
    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848011223',
      operation: '10069',
      topic: 'Modify_PrepaidFRC',
    })

    // API must NOT be called before OTP verification
    expect(commissionApi.updateCommissionConfig).not.toHaveBeenCalled()

    // Enter OTP code and verify
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // After OTP verified, updateCommissionConfig should be called
    await waitFor(() => {
      expect(commissionApi.updateCommissionConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          commissionId: 101,
          sellerCommission: '7.5',
        })
      )
    })
  })

  // Edit Flow for Postpaid with Modify_Postpaid OTP topic
  it('triggers OTP with topic Modify_Postpaid on Postpaid Edit submit', async () => {
    renderComponent()

    // Switch to Postpaid tab
    fireEvent.click(screen.getByTestId('tab-postpaid'))

    await waitFor(() => {
      expect(screen.getByTestId('edit-commission-btn-301')).toBeInTheDocument()
    })

    // Click Edit on postpaid commission
    fireEvent.click(screen.getByTestId('edit-commission-btn-301'))

    expect(screen.getByTestId('edit-commission-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('edit-actual-comm-input')).toHaveValue(50)

    // Submit edit form
    fireEvent.click(screen.getByTestId('edit-dialog-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Verify OTP dispatched with Modify_Postpaid topic
    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848011223',
      operation: '10069',
      topic: 'Modify_Postpaid',
    })

    // Verify updatePostpaidCommission not called yet
    expect(commissionApi.updatePostpaidCommission).not.toHaveBeenCalled()

    // Verify OTP
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '654321' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    await waitFor(() => {
      expect(commissionApi.updatePostpaidCommission).toHaveBeenCalledWith(
        expect.objectContaining({
          commissionId: 301,
          actualCommission: '50',
        })
      )
    })
  })

  // Delete Flow with destructive ConfirmationDialog
  it('opens ConfirmationDialog with destructive=true on Delete click and calls deleteCommissionConfig on confirmation', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('delete-commission-btn-101')).toBeInTheDocument()
    })

    // Click Delete
    fireEvent.click(screen.getByTestId('delete-commission-btn-101'))

    // Confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('confirmation-confirm-btn')).toHaveTextContent('Delete Configuration')
    })

    // Ensure delete API was not called prior to confirmation
    expect(commissionApi.deleteCommissionConfig).not.toHaveBeenCalled()

    // Confirm deletion
    fireEvent.click(screen.getByTestId('confirmation-confirm-btn'))

    await waitFor(() => {
      expect(commissionApi.deleteCommissionConfig).toHaveBeenCalledWith(101)
    })
  })
})
