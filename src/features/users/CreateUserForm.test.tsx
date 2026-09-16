import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateUserForm } from './CreateUserForm'
import { userApi } from '@/api/user.api'
import { otpApi } from '@/api/otp.api'
import { useOtpStore } from '@/stores/otpStore'
import * as masterDataApiModule from '@/api/masterdata.api'

function renderCreateUserForm(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <CreateUserForm {...props} />
    </QueryClientProvider>
  )
}

describe('CreateUserForm Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Mock master data queries so ZoneSelector, CircleSelector, SSASelector populate options
    vi.spyOn(masterDataApiModule.masterDataApi, 'getZones').mockResolvedValue([
      { zoneId: 1, zoneName: 'North Zone' },
      { zoneId: 2, zoneName: 'South Zone' },
    ])
    vi.spyOn(masterDataApiModule.masterDataApi, 'getZoneBasedCircles').mockResolvedValue([
      { circleId: 11, circleName: 'Delhi', zoneId: 1 },
      { circleId: 21, circleName: 'Andhra Pradesh', zoneId: 2 },
    ])
    vi.spyOn(masterDataApiModule.masterDataApi, 'getSSAsByCircle').mockResolvedValue([
      { ssaId: 101, ssaName: 'New Delhi Central', circleId: 11 },
      { ssaId: 201, ssaName: 'Hyderabad', circleId: 21 },
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

    // Mock Create User API
    vi.spyOn(userApi, 'createUser').mockResolvedValue({
      success: true,
      message: 'User created successfully',
      userId: 1050,
    })
  })

  it('renders all four FormSections: Basic Details, Location, Account, and Permissions', () => {
    renderCreateUserForm()

    expect(screen.getByTestId('section-basic-details')).toBeInTheDocument()
    expect(screen.getByTestId('section-location')).toBeInTheDocument()
    expect(screen.getByTestId('section-account')).toBeInTheDocument()
    expect(screen.getByTestId('section-permissions')).toBeInTheDocument()

    // Key inputs
    expect(screen.getByTestId('input-hrmsId')).toBeInTheDocument()
    expect(screen.getByTestId('input-username')).toBeInTheDocument()
    expect(screen.getByTestId('input-mobileNumber')).toBeInTheDocument()
    expect(screen.getByTestId('input-firstName')).toBeInTheDocument()
    expect(screen.getByTestId('input-lastName')).toBeInTheDocument()
    expect(screen.getByTestId('input-password')).toBeInTheDocument()
    expect(screen.getByTestId('input-dob')).toBeInTheDocument()
    expect(screen.getByTestId('input-address')).toBeInTheDocument()

    // Permission Groups
    expect(screen.getByTestId('permission-group-core-administration')).toBeInTheDocument()
    expect(screen.getByTestId('permission-group-dealer-&-wallet-operations')).toBeInTheDocument()
    expect(screen.getByTestId('permission-group-commission-types')).toBeInTheDocument()
  })

  it('prevents submission and displays validation errors when required fields are empty', async () => {
    renderCreateUserForm()

    const submitBtn = screen.getByTestId('create-user-submit')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/HRMS ID must be at least 3 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/Mobile number must be a valid 10-digit Indian number/i)).toBeInTheDocument()
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Last name is required/i)).toBeInTheDocument()
    })

    // OTP Modal must NOT open
    expect(screen.queryByText('OTP Verification')).not.toBeInTheDocument()
    // Create User API must NOT be called
    expect(userApi.createUser).not.toHaveBeenCalled()
  })

  it('submitting valid data opens the OTPVerificationModal without calling createUser API yet', async () => {
    renderCreateUserForm({
      defaultValues: {
        zoneId: 2,
        circleId: 21,
        ssaId: 201,
      },
    })

    // Fill valid data
    fireEvent.change(screen.getByTestId('input-hrmsId'), { target: { value: 'HRMS1048' } })
    fireEvent.change(screen.getByTestId('input-username'), { target: { value: 'rajesh.kumar' } })
    fireEvent.change(screen.getByTestId('input-mobileNumber'), { target: { value: '9848022334' } })
    fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'Rajesh' } })
    fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Kumar' } })
    fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'SecurePass123' } })
    fireEvent.change(screen.getByTestId('input-dob'), { target: { value: '1990-05-15' } })
    fireEvent.change(screen.getByTestId('input-address'), {
      target: { value: 'Telecom Bhavan, Saifabad, Hyderabad' },
    })

    // Submit form
    const submitBtn = screen.getByTestId('create-user-submit')
    fireEvent.click(submitBtn)

    // Verify OTP Modal is opened with the target mobile number and topic
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
      expect(screen.getByText('Security Authorization')).toBeInTheDocument()
      expect(screen.getByText('Create SCM User')).toBeInTheDocument()
      expect(screen.getByTestId('masked-msisdn')).toHaveTextContent(/98\*{6}34/)
    })

    // Verify sendOtp API was dispatched
    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848022334',
      operation: '10069',
      topic: 'UserCreation',
    })

    // CRITICAL: The actual createUser API must NOT be called before OTP verification!
    expect(userApi.createUser).not.toHaveBeenCalled()
  })

  it('calls createUser API mutation ONLY after OTP validation succeeds', async () => {
    const onSuccess = vi.fn()
    renderCreateUserForm({
      onSuccess,
      defaultValues: {
        zoneId: 2,
        circleId: 21,
        ssaId: 201,
      },
    })

    // Fill valid data
    fireEvent.change(screen.getByTestId('input-hrmsId'), { target: { value: 'HRMS1048' } })
    fireEvent.change(screen.getByTestId('input-username'), { target: { value: 'rajesh.kumar' } })
    fireEvent.change(screen.getByTestId('input-mobileNumber'), { target: { value: '9848022334' } })
    fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'Rajesh' } })
    fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Kumar' } })
    fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'SecurePass123' } })
    fireEvent.change(screen.getByTestId('input-dob'), { target: { value: '1990-05-15' } })
    fireEvent.change(screen.getByTestId('input-address'), {
      target: { value: 'Telecom Bhavan, Saifabad, Hyderabad' },
    })

    // Check a permission
    const userPermCheckbox = screen.getByTestId('checkbox-userPermissions')
    fireEvent.click(userPermCheckbox)

    // Submit form
    fireEvent.click(screen.getByTestId('create-user-submit'))

    // Wait for OTP modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })
    expect(userApi.createUser).not.toHaveBeenCalled()

    // Enter 6-digit OTP
    const otpInput = screen.getByTestId('otp-input')
    fireEvent.change(otpInput, { target: { value: '123456' } })

    // Click "Verify & Confirm" in OTP modal
    const verifyBtn = screen.getByTestId('otp-submit-btn')
    fireEvent.click(verifyBtn)

    // NOW createUser API must be called with expected payload
    await waitFor(() => {
      expect(userApi.createUser).toHaveBeenCalledTimes(1)
      expect(userApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          hrmsId: 'HRMS1048',
          username: 'rajesh.kumar',
          mobileNumber: '9848022334',
          firstName: 'Rajesh',
          lastName: 'Kumar',
          zoneId: 2,
          circleId: 21,
          ssaId: 201,
          permissions: expect.objectContaining({
            userPermissions: 1,
            dealerPermissions: 0,
          }),
        })
      )
    })

    // Verify success callback was invoked
    expect(onSuccess).toHaveBeenCalled()

    // Verify success banner is displayed
    await waitFor(() => {
      expect(screen.getByTestId('create-user-success-banner')).toBeInTheDocument()
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument()
    })
  })

  it('supports Grant All and Clear All permissions quick actions', () => {
    renderCreateUserForm()

    const grantAllBtn = screen.getByTestId('btn-grant-all-permissions')
    const clearAllBtn = screen.getByTestId('btn-clear-all-permissions')

    // Click Grant All
    fireEvent.click(grantAllBtn)
    expect(screen.getByTestId('checkbox-userPermissions')).toBeChecked()
    expect(screen.getByTestId('checkbox-dealerPermissions')).toBeChecked()
    expect(screen.getByTestId('checkbox-walletPermissions')).toBeChecked()

    // Click Clear All
    fireEvent.click(clearAllBtn)
    expect(screen.getByTestId('checkbox-userPermissions')).not.toBeChecked()
    expect(screen.getByTestId('checkbox-dealerPermissions')).not.toBeChecked()
  })
})
