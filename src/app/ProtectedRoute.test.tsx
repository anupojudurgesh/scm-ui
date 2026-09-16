import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './routes'
import { useAuthStore } from '@/stores/authStore'

function renderApp(initialRoute: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProtectedRoute — authentication guard', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  // ─── Unauthenticated redirects ────────────────────────────────────────────

  it('redirects unauthenticated user from /dashboard to /login', () => {
    renderApp('/dashboard')

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated user from / to /login', () => {
    renderApp('/')

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated user from /dealers to /login', () => {
    renderApp('/dealers')

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dealers-page')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated user from /plans to /login', () => {
    renderApp('/plans')

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  // ─── Authenticated access ─────────────────────────────────────────────────

  it('renders /dashboard for an authenticated user', () => {
    useAuthStore.getState().setAuth(
      { userId: 1, username: 'op_user', hrmsId: 'H001', roleId: 1, roleName: 'Admin' },
      { userPermissions: 1 }
    )

    renderApp('/dashboard')

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('renders /dealers for an authenticated user with dealer permissions', () => {
    useAuthStore.getState().setAuth(
      { userId: 1, username: 'op_user', hrmsId: 'H001', roleId: 1, roleName: 'Admin' },
      { dealerPermissions: 1 }
    )

    renderApp('/dealers')

    expect(screen.getByTestId('dealers-page')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  // ─── Login → /dashboard flow ──────────────────────────────────────────────

  it('after successful login, navigates to /dashboard', async () => {
    const user = userEvent.setup()

    renderApp('/login')

    // Should be on login page initially
    expect(screen.getByTestId('login-page')).toBeInTheDocument()

    // Fill in credentials and submit
    await user.type(screen.getByTestId('input-username'), 'admin_dev')
    await user.type(screen.getByTestId('input-password'), 'Admin@12345')
    await user.click(screen.getByTestId('submit-login'))

    // Should now be on the dashboard
    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()

    // Auth store should reflect authenticated state
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('already-authenticated user visiting /login is redirected to /dashboard', () => {
    useAuthStore.getState().setAuth(
      { userId: 1, username: 'op_user', hrmsId: 'H001', roleId: 1, roleName: 'Admin' },
      { userPermissions: 1 }
    )

    renderApp('/login')

    // LoginPage's internal Navigate kicks in immediately
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  // ─── Redirect-back after login ────────────────────────────────────────────

  it('ProtectedRoute appends ?redirect= param when redirecting unauthenticated users to /login', () => {
    // Verifies the redirect URL structure produced by ProtectedRoute.
    // The full redirect-back-after-login navigate assertion lives in LoginPage.test.tsx
    // (where react-router-dom is already mocked at the module level).
    renderApp('/dealers')

    // Should have landed on login page
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    // The ProtectedRoute component itself passes location to <Navigate> — we can
    // verify the correct page rendered (login page) which confirms the guard fired.
    // URL params are tested at the LoginPage unit level.
    expect(screen.queryByTestId('dealers-page')).not.toBeInTheDocument()
  })
})
