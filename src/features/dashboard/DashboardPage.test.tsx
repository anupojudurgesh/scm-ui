import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from './DashboardPage'
import { dashboardApi } from '@/api/dashboard.api'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('DashboardPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all 7 KPI cards with their expected labels', async () => {
    renderWithClient(<DashboardPage />)

    // Verify all 7 KPI labels exist in the document
    expect(screen.getByText(/Total users/i)).toBeInTheDocument()
    expect(screen.getByText(/Active users/i)).toBeInTheDocument()
    expect(screen.getByText(/Total dealers/i)).toBeInTheDocument()
    expect(screen.getByText(/Active dealers/i)).toBeInTheDocument()
    expect(screen.getByText(/Pending actions/i)).toBeInTheDocument()
    expect(screen.getByText(/Commission configurations/i)).toBeInTheDocument()
    expect(screen.getByText(/Plans/i)).toBeInTheDocument()

    // Verify testids for all 7 cards
    expect(screen.getByTestId('kpi-card-totalUsers')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-card-activeUsers')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-card-totalDealers')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-card-activeDealers')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-card-pendingActions')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-card-commissionConfigurations')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-card-plans')).toBeInTheDocument()
  })

  it('displays skeletons while KPI queries are pending', () => {
    // Return an unresolved promise to test loading state
    vi.spyOn(dashboardApi, 'getKpis').mockReturnValue(new Promise(() => {}))

    renderWithClient(<DashboardPage />)

    expect(screen.getByTestId('kpi-skeleton-totalUsers')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-skeleton-activeUsers')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-skeleton-totalDealers')).toBeInTheDocument()
  })

  it('populates KPI values once data is fetched', async () => {
    vi.spyOn(dashboardApi, 'getKpis').mockResolvedValue({
      totalUsers: 1420,
      activeUsers: 1285,
      totalDealers: 8560,
      activeDealers: 7912,
      pendingActions: 24,
      commissionConfigurations: 18,
      plans: 42,
    })

    renderWithClient(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('kpi-value-totalUsers')).toHaveTextContent('1,420')
      expect(screen.getByTestId('kpi-value-activeUsers')).toHaveTextContent('1,285')
      expect(screen.getByTestId('kpi-value-totalDealers')).toHaveTextContent('8,560')
      expect(screen.getByTestId('kpi-value-activeDealers')).toHaveTextContent('7,912')
      expect(screen.getByTestId('kpi-value-pendingActions')).toHaveTextContent('24')
      expect(screen.getByTestId('kpi-value-commissionConfigurations')).toHaveTextContent('18')
      expect(screen.getByTestId('kpi-value-plans')).toHaveTextContent('42')
    })
  })

  it('renders Recent Activities section with the known limitation note', async () => {
    renderWithClient(<DashboardPage />)

    expect(screen.getByText(/Recent activities/i)).toBeInTheDocument()
    expect(screen.getByTestId('limitation-note')).toBeInTheDocument()
    expect(screen.getByTestId('limitation-note')).toHaveTextContent(
      'Static feed — dedicated activity log API endpoint pending backend integration'
    )

    await waitFor(() => {
      const activities = screen.getAllByTestId('activity-item')
      expect(activities.length).toBeGreaterThan(0)
    })
  })
})
