import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  it('renders SCM Portal header and status badge', () => {
    renderAppWithClient()
    expect(screen.getByText('SCM Portal')).toBeInTheDocument()
    expect(screen.getByText('API Connected')).toBeInTheDocument()
  })

  it('renders sidebar navigation and displays DashboardPage on default route', () => {
    renderAppWithClient()
    expect(screen.getByTestId('sidebar-navigation')).toBeInTheDocument()
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.getByText('SCM Operations Dashboard')).toBeInTheDocument()
  })
})
