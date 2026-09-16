import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import {
  bootstrapDevAuth,
  DEV_ADMIN_USER,
  DEV_ADMIN_PERMISSIONS,
} from './mockAuth'

describe('bootstrapDevAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('authenticates sample admin user when unauthenticated in development', () => {
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    const didBootstrap = bootstrapDevAuth()
    expect(didBootstrap).toBe(true)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(DEV_ADMIN_USER)
    expect(state.roleName).toBe('System Administrator')
    expect(state.role).toBe(1)
  })

  it('grants all permissions (returns true for hasPermission across all keys)', () => {
    bootstrapDevAuth()
    const state = useAuthStore.getState()

    // Test essential portal feature permissions
    expect(state.hasPermission('userPermissions')).toBe(true)
    expect(state.hasPermission('dealerPermissions')).toBe(true)
    expect(state.hasPermission('commissionPermissions')).toBe(true)
    expect(state.hasPermission('plansNumberpermissions')).toBe(true)
    expect(state.hasPermission('walletPermissions')).toBe(true)
    expect(state.hasPermission('reportsPermissions')).toBe(true)
    expect(state.hasPermission('stockCheck')).toBe(true)
    expect(state.hasPermission('dealerMpinReset')).toBe(true)
    expect(state.hasPermission('franchiseAddBalance')).toBe(true)

    // Test all keys in DEV_ADMIN_PERMISSIONS
    Object.keys(DEV_ADMIN_PERMISSIONS).forEach((key) => {
      expect(state.hasPermission(key)).toBe(true)
    })
  })

  it('does not overwrite an existing authenticated user session', () => {
    const existingUser = {
      userId: 999,
      username: 'custom_operator',
      hrmsId: 'HRMS999',
      roleId: 2,
      roleName: 'Standard Operator',
    }
    useAuthStore.getState().setAuth(existingUser, { userPermissions: 1 })

    const didBootstrap = bootstrapDevAuth()
    expect(didBootstrap).toBe(false)

    const state = useAuthStore.getState()
    expect(state.user?.username).toBe('custom_operator')
    expect(state.roleName).toBe('Standard Operator')
    expect(state.hasPermission('userPermissions')).toBe(true)
    expect(state.hasPermission('dealerPermissions')).toBe(false)
  })
})
