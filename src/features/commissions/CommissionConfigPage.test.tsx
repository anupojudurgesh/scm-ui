import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CommissionConfigPage } from './CommissionConfigPage'
import { commissionApi } from '@/api/commission.api'
import { otpApi } from '@/api/otp.api'
import { masterDataApi } from '@/api/masterdata.api'
import { useOtpStore } from '@/stores/otpStore'
import { useAuthStore } from '@/stores/authStore'

function renderCommissionConfigPage(props = {}) {
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
        <CommissionConfigPage {...props} />
      </QueryClientProvider>
    </MemoryRouter>
  )
}


describe('CommissionConfigPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Default authenticated user with commissionPermissions
    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'admin@test.com',
        hrmsId: '100234',
        mobileNumber: '9848022334',
        roleId: 1,
      },
      {
        commissionPermissions: 1,
      }
    )

    // Mock category and masterdata queries
    vi.spyOn(commissionApi, 'getCategory').mockResolvedValue([
      { categoryId: '1', categoryName: 'Prepaid Normal Plans' },
      { categoryId: '2', categoryName: 'Special Tariff Vouchers (STV)' },
      { categoryId: '3', categoryName: 'Postpaid Corporate Plans' },
    ])
    vi.spyOn(masterDataApi, 'getZones').mockResolvedValue([
      { zoneId: 1, zoneName: 'North Zone' },
      { zoneId: 2, zoneName: 'South Zone' },
    ])
    vi.spyOn(masterDataApi, 'getZoneBasedCircles').mockResolvedValue([
      { circleId: 11, circleName: 'Delhi', zoneId: 1 },
      { circleId: 21, circleName: 'Andhra Pradesh', zoneId: 2 },
    ])

    // Mock OTP APIs
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent successfully',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified successfully',
    })

    // Mock Commission Mutations
    vi.spyOn(commissionApi, 'saveCommissionConfig').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Commission config saved',
    })
    vi.spyOn(commissionApi, 'saveMultipleCommissionConfig').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Multiple commission config saved',
    })
    vi.spyOn(commissionApi, 'postpaidCommissionConfig').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Postpaid commission config saved',
    })
    vi.spyOn(commissionApi, 'landlineCommissionConfig').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Landline commission config saved',
    })
  })

  // -------------------------------------------------------------
  // Permission Guard Tests
  // -------------------------------------------------------------
  describe('PermissionGuard Enforcement', () => {
    it('blocks access when user lacks commissionPermissions', () => {
      useAuthStore.getState().setPermissions({
        commissionPermissions: 0,
      })

      renderCommissionConfigPage()

      expect(screen.getByTestId('permission-denied-message')).toBeInTheDocument()
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument()
      expect(screen.queryByTestId('commission-tabs')).not.toBeInTheDocument()
    })

    it('renders tabs and controls when user has commissionPermissions', () => {
      renderCommissionConfigPage()

      expect(screen.getByTestId('commission-config-page')).toBeInTheDocument()
      expect(screen.getByTestId('commission-tabs')).toBeInTheDocument()
      expect(screen.getByTestId('tab-prepaid')).toBeInTheDocument()
      expect(screen.getByTestId('tab-postpaid')).toBeInTheDocument()
      expect(screen.getByTestId('tab-landline')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------
  // Flow 1: Prepaid FRC (topic: 'PrepaidFrc')
  // -------------------------------------------------------------
  describe('Prepaid FRC Commission Flow', () => {
    it('triggers OTP with topic PrepaidFrc on submit and calls saveCommissionConfig on success', async () => {
      renderCommissionConfigPage({
        defaultFrcValues: {
          categoryId: '1',
          circleId: '11',
          denomination: '199',
          sellerCommission: '4.5',
          fraCommission: '2.5',
          subCommission: '1.0',
          tds: '5',
        },
      })

      // Submit FRC form
      const submitBtn = screen.getByTestId('submit-prepaid-frc')
      fireEvent.click(submitBtn)

      // Verify OTP Modal is shown
      await waitFor(() => {
        expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
        expect(screen.getByText('Configure Prepaid FRC Commission')).toBeInTheDocument()
      })

      // Verify sendOtp called with topic 'PrepaidFrc'
      expect(otpApi.sendOtp).toHaveBeenCalledWith({
        msisdn: '9848022334',
        operation: '10069',
        topic: 'PrepaidFrc',
      })

      // Ensure API mutation NOT called prior to OTP verification
      expect(commissionApi.saveCommissionConfig).not.toHaveBeenCalled()

      // Enter OTP code and verify
      const otpInput = screen.getByTestId('otp-input')
      fireEvent.change(otpInput, { target: { value: '123456' } })

      const verifyBtn = screen.getByTestId('otp-submit-btn')
      fireEvent.click(verifyBtn)

      // Verify saveCommissionConfig API was called
      await waitFor(() => {
        expect(commissionApi.saveCommissionConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            circleId: '11',
            categoryId: '1',
            denomination: '199',
            sellerCommission: '4.5',
            fraCommission: '2.5',
            subCommission: '1.0',
            tds: '5',
          })
        )
      })
    })
  })

  // -------------------------------------------------------------
  // Flow 2: Prepaid OTF (topic: 'PrepaidOtf')
  // -------------------------------------------------------------
  describe('Prepaid OTF Commission Flow', () => {
    it('triggers OTP with topic PrepaidOtf on submit and calls saveMultipleCommissionConfig on success', async () => {
      renderCommissionConfigPage({
        defaultOtfValues: {
          categoryId: '2',
          zoneId: '1',
          circleId: '11',
          denomination: '299',
          sellerCommission: '6.0',
          fraCommission: '3.0',
          subCommission: '1.5',
          tds: '5',
        },
      })

      // Switch to OTF sub-tab
      const otfTabBtn = screen.getByTestId('tab-prepaid-otf')
      fireEvent.click(otfTabBtn)

      // Submit OTF form
      const submitBtn = screen.getByTestId('submit-prepaid-otf')
      fireEvent.click(submitBtn)

      // Verify OTP Modal is shown
      await waitFor(() => {
        expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
        expect(screen.getByText('Configure Prepaid OTF Commission')).toBeInTheDocument()
      })

      // Verify sendOtp called with topic 'PrepaidOtf'
      expect(otpApi.sendOtp).toHaveBeenCalledWith({
        msisdn: '9848022334',
        operation: '10069',
        topic: 'PrepaidOtf',
      })

      // Ensure API mutation NOT called prior to OTP verification
      expect(commissionApi.saveMultipleCommissionConfig).not.toHaveBeenCalled()

      // Enter OTP code and verify
      const otpInput = screen.getByTestId('otp-input')
      fireEvent.change(otpInput, { target: { value: '123456' } })

      const verifyBtn = screen.getByTestId('otp-submit-btn')
      fireEvent.click(verifyBtn)

      // Verify saveMultipleCommissionConfig API was called
      await waitFor(() => {
        expect(commissionApi.saveMultipleCommissionConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            circleId: '11',
            zoneId: '1',
            categoryId: '2',
            denomination: '299',
            sellerCommission: '6.0',
            fraCommission: '3.0',
            subCommission: '1.5',
            tds: '5',
          })
        )
      })
    })
  })

  // -------------------------------------------------------------
  // Flow 3: Postpaid (topic: 'Postpaid')
  // -------------------------------------------------------------
  describe('Postpaid Commission Flow', () => {
    it('triggers OTP with topic Postpaid on submit and calls postpaidCommissionConfig on success', async () => {
      renderCommissionConfigPage({
        initialTab: 'postpaid',
        defaultPostpaidValues: {
          categoryId: '3',
          circleId: '11',
          tdsAmount: '15',
          actualCommission: '60',
          sellerLevel: 'Tier-1',
          cap_limit: '10000',
        },
      })

      // Submit Postpaid form
      const submitBtn = screen.getByTestId('submit-postpaid')
      fireEvent.click(submitBtn)

      // Verify OTP Modal is shown
      await waitFor(() => {
        expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
        expect(screen.getByText('Configure Postpaid Commission')).toBeInTheDocument()
      })

      // Verify sendOtp called with topic 'Postpaid'
      expect(otpApi.sendOtp).toHaveBeenCalledWith({
        msisdn: '9848022334',
        operation: '10069',
        topic: 'Postpaid',
      })

      // Ensure API mutation NOT called prior to OTP verification
      expect(commissionApi.postpaidCommissionConfig).not.toHaveBeenCalled()

      // Enter OTP code and verify
      const otpInput = screen.getByTestId('otp-input')
      fireEvent.change(otpInput, { target: { value: '123456' } })

      const verifyBtn = screen.getByTestId('otp-submit-btn')
      fireEvent.click(verifyBtn)

      // Verify postpaidCommissionConfig API was called
      await waitFor(() => {
        expect(commissionApi.postpaidCommissionConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            circleId: '11',
            categoryId: '3',
            tdsAmount: '15',
            actualCommission: '60',
            sellerLevel: 'Tier-1',
            cap_limit: '10000',
          })
        )
      })
    })
  })

  // -------------------------------------------------------------
  // Flow 4: Landline (topic: 'Landline')
  // -------------------------------------------------------------
  describe('Landline Commission Flow', () => {
    it('triggers OTP with topic Landline on submit and calls landlineCommissionConfig on success', async () => {
      renderCommissionConfigPage({
        initialTab: 'landline',
        defaultLandlineValues: {
          categoryId: '1',
          circleId: '11',
          fromAmount: '200',
          toAmount: '2000',
          commissionAmount: '35',
          tdsAmount: '5',
        },
      })

      // Submit Landline form
      const submitBtn = screen.getByTestId('submit-landline')
      fireEvent.click(submitBtn)

      // Verify OTP Modal is shown
      await waitFor(() => {
        expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
        expect(screen.getByText('Configure Landline Commission')).toBeInTheDocument()
      })

      // Verify sendOtp called with topic 'Landline'
      expect(otpApi.sendOtp).toHaveBeenCalledWith({
        msisdn: '9848022334',
        operation: '10069',
        topic: 'Landline',
      })

      // Ensure API mutation NOT called prior to OTP verification
      expect(commissionApi.landlineCommissionConfig).not.toHaveBeenCalled()

      // Enter OTP code and verify
      const otpInput = screen.getByTestId('otp-input')
      fireEvent.change(otpInput, { target: { value: '123456' } })

      const verifyBtn = screen.getByTestId('otp-submit-btn')
      fireEvent.click(verifyBtn)

      // Verify landlineCommissionConfig API was called
      await waitFor(() => {
        expect(commissionApi.landlineCommissionConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            circleId: '11',
            categoryId: '1',
            fromAmount: '200',
            toAmount: '2000',
            commissionAmount: '35',
            tdsAmount: '5',
          })
        )
      })
    })
  })

  // -------------------------------------------------------------
  // Validation & Error Handling Tests
  // -------------------------------------------------------------
  describe('Form Validation & Protection', () => {
    it('prevents FRC submission and does NOT trigger OTP when required fields are missing', async () => {
      renderCommissionConfigPage()

      const submitBtn = screen.getByTestId('submit-prepaid-frc')
      fireEvent.click(submitBtn)

      // Validation errors should appear
      await waitFor(() => {
        expect(screen.getByText('Please select a Category')).toBeInTheDocument()
        expect(screen.getByText('Please select a Circle')).toBeInTheDocument()
        expect(screen.getByText('Denomination is required')).toBeInTheDocument()
      })

      // OTP should never have been requested
      expect(otpApi.sendOtp).not.toHaveBeenCalled()
      expect(screen.queryByTestId('otp-verification-modal')).not.toBeInTheDocument()
    })

    it('switches between Prepaid FRC/OTF, Postpaid, and Landline tabs when tab triggers are clicked', async () => {
      renderCommissionConfigPage()

      // Initially on Prepaid FRC
      expect(screen.getByTestId('prepaid-frc-form')).toBeInTheDocument()

      // Click Postpaid Tab
      const postpaidTab = screen.getByTestId('tab-postpaid')
      fireEvent.click(postpaidTab)

      await waitFor(() => {
        expect(screen.getByTestId('postpaid-commission-form')).toBeInTheDocument()
        expect(screen.queryByTestId('prepaid-frc-form')).not.toBeInTheDocument()
      })

      // Click Landline Tab
      const landlineTab = screen.getByTestId('tab-landline')
      fireEvent.click(landlineTab)

      await waitFor(() => {
        expect(screen.getByTestId('landline-commission-form')).toBeInTheDocument()
        expect(screen.queryByTestId('postpaid-commission-form')).not.toBeInTheDocument()
      })

      // Click Prepaid Tab
      const prepaidTab = screen.getByTestId('tab-prepaid')
      fireEvent.click(prepaidTab)

      await waitFor(() => {
        expect(screen.getByTestId('prepaid-frc-form')).toBeInTheDocument()
      })
    })
  })
})

