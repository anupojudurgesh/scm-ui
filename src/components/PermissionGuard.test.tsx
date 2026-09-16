import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermissionGuard } from './PermissionGuard'
import { useAuthStore } from '@/stores/authStore'

describe('PermissionGuard Component', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('renders nothing when user is unauthenticated', () => {
    render(
      <PermissionGuard permission="dealerPermissions">
        <div data-testid="guarded-content">Protected Content</div>
      </PermissionGuard>
    )

    expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
  })

  it('renders children when user has the specified permission', () => {
    useAuthStore.getState().setAuth(
      {
        userId: 1,
        username: 'admin',
        hrmsId: 'HRMS100',
        roleId: 1,
      },
      {
        dealerPermissions: 1,
        walletPermissions: 0,
      }
    )

    render(
      <PermissionGuard permission="dealerPermissions">
        <div data-testid="guarded-content">Dealer Management Panel</div>
      </PermissionGuard>
    )

    expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    expect(screen.getByText('Dealer Management Panel')).toBeInTheDocument()
  })

  it('hides children when permission is 0 or not granted', () => {
    useAuthStore.getState().setAuth(
      {
        userId: 2,
        username: 'agent',
        hrmsId: 'HRMS200',
        roleId: 2,
      },
      {
        dealerPermissions: 1,
        walletPermissions: 0,
      }
    )

    render(
      <PermissionGuard permission="walletPermissions">
        <div data-testid="wallet-content">Wallet Balance Controls</div>
      </PermissionGuard>
    )

    expect(screen.queryByTestId('wallet-content')).not.toBeInTheDocument()
  })

  it('renders optional fallback when permission is denied', () => {
    useAuthStore.getState().setAuth(
      {
        userId: 3,
        username: 'staff',
        hrmsId: 'HRMS300',
        roleId: 3,
      },
      {
        bulk_purge: 0,
      }
    )

    render(
      <PermissionGuard
        permission="bulk_purge"
        fallback={<p data-testid="fallback-notice">Access Restricted</p>}
      >
        <div data-testid="purge-content">Purge Records</div>
      </PermissionGuard>
    )

    expect(screen.queryByTestId('purge-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('fallback-notice')).toBeInTheDocument()
    expect(screen.getByText('Access Restricted')).toBeInTheDocument()
  })
})
