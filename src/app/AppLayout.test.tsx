import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './routes'
import { useAuthStore } from '@/stores/authStore'

function renderApp(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('App Routing & Layout Navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.getState().clearAuth()
  })

  it('renders top navbar branding and status badge', () => {
    renderApp('/dashboard')

    expect(screen.getByText('SCM Portal')).toBeInTheDocument()
    expect(screen.getByText('API Connected')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-navigation')).toBeInTheDocument()
  })

  it('renders Dashboard nav link by default and hides permission-gated nav items when unauthenticated', () => {
    renderApp('/dashboard')

    // Dashboard nav link is always visible
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument()

    // Permission-gated links must not render without permissions
    expect(screen.queryByTestId('nav-users')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-dealers')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-commissions')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-plans')).not.toBeInTheDocument()
  })

  it('renders permission-gated nav items when the user has appropriate permissions', () => {
    useAuthStore.getState().setAuth(
      {
        userId: 101,
        username: 'admin_user',
        hrmsId: 'HRMS101',
        roleId: 1,
        roleName: 'System Administrator',
      },
      {
        userPermissions: 1,
        dealerPermissions: 1,
        commissionPermissions: 1,
        plansNumberpermissions: 1,
      }
    )

    renderApp('/dashboard')

    // All links should now be visible
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('nav-users')).toBeInTheDocument()
    expect(screen.getByTestId('nav-dealers')).toBeInTheDocument()
    expect(screen.getByTestId('nav-commissions')).toBeInTheDocument()
    expect(screen.getByTestId('nav-plans')).toBeInTheDocument()

    // User profile indicator in header
    expect(screen.getByText('admin_user')).toBeInTheDocument()
    expect(screen.getByText('System Administrator')).toBeInTheDocument()
  })

  it('redirects root "/" to "/dashboard" and renders DashboardPage', async () => {
    renderApp('/')

    // Confirms redirect reached DashboardPage
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.getByText('SCM Operations Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-grid')).toBeInTheDocument()
  })

  it('renders DashboardPage directly at "/dashboard"', () => {
    renderApp('/dashboard')

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.getByText('SCM Operations Dashboard')).toBeInTheDocument()
  })

  it('renders feature pages when navigated to directly', () => {
    useAuthStore.getState().setAuth(
      {
        userId: 101,
        username: 'admin_user',
        hrmsId: 'HRMS101',
        roleId: 1,
        roleName: 'System Administrator',
      },
      {
        dealerPermissions: 1,
      }
    )

    renderApp('/dealers')

    expect(screen.getByTestId('dealers-page')).toBeInTheDocument()
    expect(screen.getByText('Dealer Management')).toBeInTheDocument()
  })

  it('toggles expandable Commissions sub-menu and reveals sub-routes', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()

    useAuthStore.getState().setAuth(
      {
        userId: 101,
        username: 'admin_user',
        hrmsId: 'HRMS101',
        roleId: 1,
        roleName: 'System Administrator',
      },
      {
        commissionPermissions: 1,
      }
    )

    renderApp('/dashboard')

    // Commissions parent trigger exists
    const commissionsTrigger = screen.getByTestId('nav-commissions')
    expect(commissionsTrigger).toBeInTheDocument()

    // Sub-items should not be visible initially when on /dashboard
    expect(screen.queryByTestId('nav-commissions-config')).not.toBeInTheDocument()

    // Click to expand
    await user.click(commissionsTrigger)
    expect(screen.getByTestId('nav-commissions-config')).toBeInTheDocument()
    expect(screen.getByTestId('nav-commissions-search')).toBeInTheDocument()
    expect(screen.getByTestId('nav-franchise-balance')).toBeInTheDocument()

    // Click to collapse
    await user.click(commissionsTrigger)
    expect(screen.queryByTestId('nav-commissions-config')).not.toBeInTheDocument()
  })

  it('signs out operator and clears authentication state when clicking sign out button', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()

    useAuthStore.getState().setAuth(
      {
        userId: 101,
        username: 'admin_user',
        hrmsId: 'HRMS101',
        roleId: 1,
        roleName: 'System Administrator',
      },
      {
        userPermissions: 1,
      }
    )

    renderApp('/dashboard')

    const signOutBtn = screen.getByTestId('sign-out-btn')
    expect(signOutBtn).toBeInTheDocument()

    await user.click(signOutBtn)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
