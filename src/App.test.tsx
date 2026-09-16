import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import App from './App.tsx'

function renderAppWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

describe('App Component', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('shows login page when unauthenticated', () => {
    renderAppWithClient()
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    // Login page still has SCM Portal branding
    expect(screen.getByText('SCM Portal')).toBeInTheDocument()
  })

  it('renders sidebar navigation and displays DashboardPage when authenticated', () => {
    useAuthStore.getState().setAuth(
      { userId: 1, username: 'admin_dev', hrmsId: 'H001', roleId: 1, roleName: 'System Administrator' },
      { userPermissions: 1 }
    )
    renderAppWithClient()

    expect(screen.getByTestId('sidebar-navigation')).toBeInTheDocument()
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.getByText('SCM Operations Dashboard')).toBeInTheDocument()
  })
})

