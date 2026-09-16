import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserListPage } from './UserListPage'
import { useAuthStore } from '@/stores/authStore'
import * as masterDataApiModule from '@/api/masterdata.api'

// Helper component to track current router location
let currentLocation: ReturnType<typeof useLocation>
function LocationObserver() {
  currentLocation = useLocation()
  return null
}

function renderUserListPage(initialEntries = ['/users']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationObserver />
        <UserListPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('UserListPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Grant admin user permissions by default
    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'admin_dev',
        hrmsId: 'HRMS1001',
        roleId: 1,
        roleName: 'System Administrator',
      },
      {
        userPermissions: 1,
        dealerPermissions: 1,
      }
    )

    // Mock master data queries so ZoneSelector, CircleSelector, SSASelector don't error
    vi.spyOn(masterDataApiModule.masterDataApi, 'getZones').mockResolvedValue([
      { zoneId: 1, zoneName: 'North Zone' },
      { zoneId: 2, zoneName: 'South Zone' },
      { zoneId: 3, zoneName: 'West Zone' },
    ])
    vi.spyOn(masterDataApiModule.masterDataApi, 'getZoneBasedCircles').mockResolvedValue([
      { circleId: 11, circleName: 'Delhi', zoneId: 1 },
      { circleId: 21, circleName: 'Andhra Pradesh', zoneId: 2 },
    ])
    vi.spyOn(masterDataApiModule.masterDataApi, 'getSSAsByCircle').mockResolvedValue([
      { ssaId: 101, ssaName: 'New Delhi Central', circleId: 11 },
      { ssaId: 201, ssaName: 'Hyderabad', circleId: 21 },
    ])
  })

  it('renders table headers and mock user data correctly', async () => {
    renderUserListPage()

    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByTestId('limitation-note')).toBeInTheDocument()

    // Verify column headers
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('HRMS ID')).toBeInTheDocument()
    expect(screen.getByText('First / Last Name')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Jurisdiction (Zone / Circle / SSA)')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()

    // Verify sample mock users from MOCK_USERS
    await waitFor(() => {
      expect(screen.getByText('admin_dev')).toBeInTheDocument()
      expect(screen.getByText('HRMS1001')).toBeInTheDocument()
      expect(screen.getByText('Dev Admin')).toBeInTheDocument()
      expect(screen.getByText('rajesh.kumar')).toBeInTheDocument()
      expect(screen.getByText('HRMS1048')).toBeInTheDocument()
      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument()
    })

    // Verify status badges
    const activeBadges = screen.getAllByText('Active')
    expect(activeBadges.length).toBeGreaterThan(0)
  })

  it('updates query params and filters table rows when changing status filter', async () => {
    renderUserListPage()

    await waitFor(() => {
      expect(screen.getByText('admin_dev')).toBeInTheDocument()
    })

    const statusFilter = screen.getByTestId('user-status-filter')
    expect(statusFilter).toHaveValue('')

    // Select Pending status
    fireEvent.change(statusFilter, { target: { value: 'Pending' } })

    // Verify query params updated
    expect(currentLocation.search).toContain('status=Pending')
    expect(currentLocation.search).toContain('page=1')

    await waitFor(() => {
      expect(screen.getByText('amit.patel')).toBeInTheDocument()
      expect(screen.getByText('HRMS1134')).toBeInTheDocument()
    })
  })

  it('updates query params and filters table rows when changing role filter', async () => {
    renderUserListPage()

    await waitFor(() => {
      expect(screen.getByText('admin_dev')).toBeInTheDocument()
    })

    const roleFilter = screen.getByTestId('user-role-filter')
    expect(roleFilter).toHaveValue('')

    // Select Finance Officer
    fireEvent.change(roleFilter, { target: { value: 'Finance Officer' } })

    expect(currentLocation.search).toContain('role=Finance+Officer')

    await waitFor(() => {
      expect(screen.getByText('priya.sharma')).toBeInTheDocument()
      expect(screen.getByText('ananya.deshmukh')).toBeInTheDocument()
    })
  })

  it('updates query params when entering a search query', async () => {
    renderUserListPage()

    await waitFor(() => {
      expect(screen.getByText('admin_dev')).toBeInTheDocument()
    })

    const searchInput = screen.getByTestId('search-toolbar-input')
    fireEvent.change(searchInput, { target: { value: 'rajesh' } })
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' })

    expect(currentLocation.search).toContain('q=rajesh')

    await waitFor(() => {
      expect(screen.getByText('rajesh.kumar')).toBeInTheDocument()
      expect(screen.queryByText('priya.sharma')).not.toBeInTheDocument()
    })
  })

  it('opens View User Details modal when View button is clicked', async () => {
    renderUserListPage()

    await waitFor(() => {
      expect(screen.getByText('admin_dev')).toBeInTheDocument()
    })

    const viewButton = screen.getByTestId('user-view-admin_dev')
    fireEvent.click(viewButton)

    // Modal should render
    expect(screen.getByText('User Details')).toBeInTheDocument()
    expect(
      screen.getByText('Account profile and jurisdiction for admin_dev')
    ).toBeInTheDocument()
    expect(
      screen.getByText('North Zone • Delhi • New Delhi Central')
    ).toBeInTheDocument()

    // Close button
    const closeBtn = screen.getByTestId('user-modal-close')
    fireEvent.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByText('User Details')).not.toBeInTheDocument()
    })
  })

  it('renders Access Restricted when user lacks userPermissions', () => {
    useAuthStore.getState().setAuth(
      {
        userId: 99,
        username: 'unprivileged',
        hrmsId: 'HRMS99',
        roleId: 5,
        roleName: 'Restricted User',
      },
      {
        userPermissions: 0, // revoked
      }
    )

    renderUserListPage()

    expect(screen.getByTestId('user-permission-denied')).toBeInTheDocument()
    expect(screen.getByText('Access Restricted')).toBeInTheDocument()
    expect(screen.queryByText('User Management')).not.toBeInTheDocument()
    expect(screen.queryByText('HRMS ID')).not.toBeInTheDocument()
  })
})
