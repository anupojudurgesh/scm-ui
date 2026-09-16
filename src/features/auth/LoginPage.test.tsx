import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '@/stores/authStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clearAuth()
  })

  it('renders split-screen layout with form and network topology hero', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    // Form column
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.getByText('Operator Sign In')).toBeInTheDocument()
    expect(screen.getByTestId('input-username')).toBeInTheDocument()
    expect(screen.getByTestId('input-password')).toBeInTheDocument()
    expect(screen.getByTestId('submit-login')).toBeInTheDocument()

    // Hero column
    expect(screen.getByText('Supply Chain & Channel Governance')).toBeInTheDocument()
    expect(screen.getByText(/Unified operations console for dealer networks/i)).toBeInTheDocument()
    expect(screen.getByText('NATIONAL ZONE CORE')).toBeInTheDocument()
    expect(screen.getByText('Operating Circles')).toBeInTheDocument()
  })

  it('displays validation errors when submitting empty form', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.click(screen.getByTestId('submit-login'))

    await waitFor(() => {
      expect(screen.getByTestId('error-username')).toHaveTextContent(/Username or HRMS ID is required/i)
      expect(screen.getByTestId('error-password')).toHaveTextContent(/Password is required/i)
    })
  })

  it('populates fields when "Fill demo login" is clicked', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.click(screen.getByTestId('quick-fill-btn'))

    expect(screen.getByTestId('input-username')).toHaveValue('admin_dev')
    expect(screen.getByTestId('input-password')).toHaveValue('Admin@12345')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const passwordInput = screen.getByTestId('input-password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByTestId('toggle-password'))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByTestId('toggle-password'))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('authenticates and redirects to /dashboard upon valid submission', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.type(screen.getByTestId('input-username'), 'admin_dev')
    await user.type(screen.getByTestId('input-password'), 'Admin@12345')
    await user.click(screen.getByTestId('submit-login'))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user?.username).toBe('admin_dev')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
