import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateDealerForm } from './CreateDealerForm'
import { dealerApi } from '@/api/dealer.api'
import { otpApi } from '@/api/otp.api'
import { masterDataApi } from '@/api/masterdata.api'
import { useOtpStore } from '@/stores/otpStore'
import { useAuthStore } from '@/stores/authStore'

function renderComponent(props = {}) {
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
    <QueryClientProvider client={queryClient}>
      <CreateDealerForm {...props} />
    </QueryClientProvider>
  )
}

describe('CreateDealerForm Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Auth user setup
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

    // Masterdata queries
    vi.spyOn(dealerApi, 'getDealerTypes').mockResolvedValue([
      { dealerTypeId: '1', dealerTypeName: 'Franchise' },
      { dealerTypeId: '2', dealerTypeName: 'Sub-Franchise' },
    ])
    vi.spyOn(dealerApi, 'getCategoryByDealer').mockResolvedValue([
      { categoryId: '1', categoryName: 'Master Franchise' },
    ])
    vi.spyOn(masterDataApi, 'getZones').mockResolvedValue([
      { zoneId: 1, zoneName: 'North Zone' },
    ])
    vi.spyOn(masterDataApi, 'getZoneBasedCircles').mockResolvedValue([
      { circleId: 11, circleName: 'Delhi', zoneId: 1 },
    ])
    vi.spyOn(masterDataApi, 'getSSAsByCircle').mockResolvedValue([
      { ssaId: 1101, ssaName: 'Central Delhi', circleId: 11 },
    ])

    // OTP APIs
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified',
    })

    // Dealer Create Mutation
    vi.spyOn(dealerApi, 'createDealer').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Dealer created successfully',
    })
  })

  it('renders all form sections and file upload dropzone', async () => {
    renderComponent()

    expect(screen.getByTestId('create-dealer-form-container')).toBeInTheDocument()
    expect(screen.getByText('Personal & Contact Information')).toBeInTheDocument()
    expect(screen.getByText('Classification & Jurisdiction')).toBeInTheDocument()
    expect(screen.getByText('Tax & Physical Verification')).toBeInTheDocument()
    expect(screen.getByText('KYC Document Attachment')).toBeInTheDocument()
    expect(screen.getByTestId('file-upload-dropzone')).toBeInTheDocument()
  })

  it('prevents submission and displays errors when required fields are missing', async () => {
    renderComponent()

    const submitBtn = screen.getByTestId('submit-create-dealer-btn')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/First name must be at least 2 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/Last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Please enter a valid 10-digit Indian mobile number/i)).toBeInTheDocument()
    })

    // OTP Modal must NOT be triggered
    expect(otpApi.sendOtp).not.toHaveBeenCalled()
    expect(dealerApi.createDealer).not.toHaveBeenCalled()
  })

  it('submits dealer creation as FormData (not JSON) with dealer JSON blob and certificate file, gated by topic Dealercreation', async () => {
    renderComponent({
      defaultValues: {
        dealerType: '1',
        category: '1',
        circleId: '11',
        ssaId: '1101',
      },
    })

    // 1. Fill personal details
    fireEvent.change(screen.getByTestId('dealer-first-name-input'), { target: { value: 'Vikram' } })
    fireEvent.change(screen.getByTestId('dealer-last-name-input'), { target: { value: 'Singh' } })
    fireEvent.change(screen.getByTestId('dealer-mobile-input'), { target: { value: '9811009988' } })
    fireEvent.change(screen.getByTestId('dealer-dob-input'), { target: { value: '1990-05-15' } })

    // 2. Fill tax & address
    fireEvent.change(screen.getByTestId('dealer-pan-input'), { target: { value: 'ABCDE1234F' } })
    fireEvent.change(screen.getByTestId('dealer-aadhaar-input'), { target: { value: '123456789012' } })
    fireEvent.change(screen.getByTestId('dealer-gst-input'), { target: { value: '07AAAAA0000A1Z5' } })
    fireEvent.change(screen.getByTestId('dealer-address-input'), { target: { value: 'Shop 101, Connaught Place, New Delhi' } })


    // 6. Attach KYC certificate file
    const file = new File(['mock-certificate-content'], 'trade_license.pdf', {
      type: 'application/pdf',
    })
    const fileInput = screen.getByTestId('dealer-certificate-input')
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Confirm file preview renders
    expect(screen.getByTestId('selected-file-name')).toHaveTextContent('trade_license.pdf')

    // 7. Submit form -> Triggers OTP modal
    const submitBtn = screen.getByTestId('submit-create-dealer-btn')
    fireEvent.click(submitBtn)

    // Verify OTP Modal is shown with topic 'Dealercreation'
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    expect(otpApi.sendOtp).toHaveBeenCalledWith({
      msisdn: '9848099887',
      operation: '10069',
      topic: 'Dealercreation',
    })

    // API must NOT be called before OTP validation
    expect(dealerApi.createDealer).not.toHaveBeenCalled()

    // 8. Submit OTP code
    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // 9. After OTP verification, verify createDealer is called with payload and certificate File
    await waitFor(() => {
      expect(dealerApi.createDealer).toHaveBeenCalledTimes(1)
    })

    const callArgs = vi.mocked(dealerApi.createDealer).mock.calls[0]
    const [payloadArg, fileArg] = callArgs

    expect(payloadArg).toMatchObject({
      firstName: 'Vikram',
      lastName: 'Singh',
      mobile: '9811009988',
      dob: '1990-05-15',
      address: 'Shop 101, Connaught Place, New Delhi',
      panId: 'ABCDE1234F',
      aadhaarId: '123456789012',
      gstNumber: '07AAAAA0000A1Z5',
    })
    expect(fileArg).toBeInstanceOf(File)
    expect(fileArg?.name).toBe('trade_license.pdf')
  })
})
