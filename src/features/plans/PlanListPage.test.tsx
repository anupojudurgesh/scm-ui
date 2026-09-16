import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlanListPage } from './PlanListPage'
import { planApi, type Plan } from '@/api/plan.api'
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
    <MemoryRouter initialEntries={['/plans']}>
      <QueryClientProvider client={queryClient}>
        <PlanListPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('PlanListPage Component', () => {
  const mockPlans: Plan[] = [
    {
      sno: 'PLN-001',
      operator: 'BSNL',
      denomination: '199',
      talkvalue: '199',
      country: 'India',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      type: 'STV',
      description: 'Unlimited Calls + 2GB/day Data',
      tab_name: 'STV',
      circle: 'AP',
      validity: '28',
      from_date: '2026-01-01',
      to_date: '2026-12-31',
      status: 'Active',
    },
    {
      sno: 'PLN-002',
      operator: 'BSNL',
      denomination: '399',
      talkvalue: '399',
      country: 'India',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      type: 'Unlimited',
      description: 'Unlimited Voice Calls + 3GB/day',
      tab_name: 'Unlimited',
      circle: 'TS',
      validity: '70',
      from_date: '2026-01-01',
      to_date: '2026-12-31',
      status: 'Active',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useOtpStore.getState().reset()

    // Auth with plansNumberpermissions
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
    vi.spyOn(planApi, 'getPlans').mockResolvedValue(mockPlans)
    vi.spyOn(otpApi, 'sendOtp').mockResolvedValue({
      status: 'SUCCESS',
      message: 'OTP sent',
    })
    vi.spyOn(otpApi, 'validateOtp').mockResolvedValue({
      isValid: true,
      status: 'SUCCESS',
      message: 'OTP verified',
    })
    vi.spyOn(planApi, 'addPlan').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Plan created',
    })
    vi.spyOn(planApi, 'updatePlan').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Plan updated',
    })
    vi.spyOn(planApi, 'deletePlan').mockResolvedValue({
      status: 'SUCCESS',
      message: 'Plan deleted',
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
      expect(screen.getByText('plansNumberpermissions')).toBeInTheDocument()
    })
  })

  // Table rendering
  it('renders plans catalog table with sample plans', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('PLN-001')).toBeInTheDocument()
      expect(screen.getByText('PLN-002')).toBeInTheDocument()
      expect(screen.getByText('₹199')).toBeInTheDocument()
      expect(screen.getByText('₹399')).toBeInTheDocument()
    })
  })

  // Search filtering
  it('filters plans when entering a search query', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('PLN-001')).toBeInTheDocument()
      expect(screen.getByText('PLN-002')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Search by plan ID, denomination/i)
    fireEvent.change(searchInput, { target: { value: '399' } })

    await waitFor(() => {
      expect(screen.queryByText('PLN-001')).not.toBeInTheDocument()
      expect(screen.getByText('PLN-002')).toBeInTheDocument()
    })
  })

  // Add Plan -> OTP topic 'Addplan'
  it('triggers OTP with topic Addplan on new plan submit and calls addPlan upon OTP verification', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('add-plan-btn')).toBeInTheDocument()
    })

    // Open Add Plan modal
    fireEvent.click(screen.getByTestId('add-plan-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
    })

    // Fill in required fields
    fireEvent.change(screen.getByTestId('input-operator'), { target: { value: 'BSNL' } })
    fireEvent.change(screen.getByTestId('input-denomination'), { target: { value: '299' } })
    fireEvent.change(screen.getByTestId('input-talkvalue'), { target: { value: '299' } })
    fireEvent.change(screen.getByTestId('input-validity'), { target: { value: '30' } })
    fireEvent.change(screen.getByTestId('input-description'), {
      target: { value: 'New 299 Unlimited Monthly Plan' },
    })

    // Submit form
    fireEvent.click(screen.getByTestId('btn-submit-plan'))

    // Verify OTP modal opens with topic 'Addplan'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('Addplan')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter 6-digit OTP
    const otpInput = screen.getByTestId('otp-input')
    fireEvent.change(otpInput, { target: { value: '123456' } })

    // Verify OTP submit button
    const verifyBtn = screen.getByTestId('otp-submit-btn')
    fireEvent.click(verifyBtn)

    // Confirm addPlan mutation was called
    await waitFor(() => {
      expect(planApi.addPlan).toHaveBeenCalledTimes(1)
      expect(planApi.addPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          operator: 'BSNL',
          denomination: '299',
          talkvalue: '299',
          validity: '30',
        }),
        'supervisor@scm.test'
      )
    })
  })

  // Edit Plan -> OTP topic 'ModifyPlan'
  it('triggers OTP with topic ModifyPlan on plan edit and calls updatePlan upon OTP verification', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('btn-edit-plan-PLN-001')).toBeInTheDocument()
    })

    // Open Edit modal
    fireEvent.click(screen.getByTestId('btn-edit-plan-PLN-001'))

    await waitFor(() => {
      expect(screen.getByText(/Edit Plan — PLN-001/i)).toBeInTheDocument()
    })

    // Change denomination
    const denomInput = screen.getByTestId('input-denomination')
    fireEvent.change(denomInput, { target: { value: '209' } })

    // Submit form
    fireEvent.click(screen.getByTestId('btn-submit-plan'))

    // Verify OTP modal opens with topic 'ModifyPlan'
    await waitFor(() => {
      expect(useOtpStore.getState().context?.topic).toBe('ModifyPlan')
      expect(screen.getByTestId('otp-verification-modal')).toBeInTheDocument()
    })

    // Enter OTP
    const editOtpInput = screen.getByTestId('otp-input')
    fireEvent.change(editOtpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('otp-submit-btn'))

    // Confirm updatePlan mutation called
    await waitFor(() => {
      expect(planApi.updatePlan).toHaveBeenCalledTimes(1)
      expect(planApi.updatePlan).toHaveBeenCalledWith(
        'PLN-001',
        expect.objectContaining({
          denomination: '209',
        }),
        'supervisor@scm.test'
      )
    })
  })

  // Delete Plan -> ConfirmationDialog
  it('triggers ConfirmationDialog on delete and calls deletePlan on confirmation', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('btn-delete-plan-PLN-001')).toBeInTheDocument()
    })

    // Click Delete
    fireEvent.click(screen.getByTestId('btn-delete-plan-PLN-001'))

    // Verify ConfirmationDialog is shown
    await waitFor(() => {
      expect(screen.getByText('Delete Product Plan?')).toBeInTheDocument()
    })

    // Confirm Delete
    const confirmBtn = screen.getByRole('button', { name: 'Delete Plan' })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(planApi.deletePlan).toHaveBeenCalledTimes(1)
      expect(planApi.deletePlan).toHaveBeenCalledWith('PLN-001', 'supervisor@scm.test')
    })
  })
})
