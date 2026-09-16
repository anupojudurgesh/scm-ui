import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, type UserProfile, type UserPermissions } from './authStore'

describe('authStore', () => {
  const mockUser: UserProfile = {
    userId: 101,
    username: 'admin@scm.telecom',
    hrmsId: 'HRMS10029',
    roleId: 2,
    roleName: 'Circle Admin',
    circleId: 10,
    zoneId: 1,
  }

  const mockPermissions: UserPermissions = {
    dealerPermissions: 1,
    userPermissions: 1,
    walletPermissions: 0,
    commissionPermissions: true,
    plansNumberpermissions: false,
    bulkRecharge: 1,
    dealerMpinReset: 0,
    caf_postpaid: null,
  }

  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('initializes with unauthenticated empty state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.role).toBeNull()
    expect(state.permissions).toBeNull()
  })

  it('sets user, role, and permissions on setAuth', () => {
    useAuthStore.getState().setAuth(mockUser, mockPermissions)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
    expect(state.role).toBe(2)
    expect(state.roleName).toBe('Circle Admin')
    expect(state.permissions).toEqual(mockPermissions)
  })

  it('clears state on clearAuth / logout', () => {
    useAuthStore.getState().setAuth(mockUser, mockPermissions)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.permissions).toBeNull()
  })

  describe('hasPermission logic', () => {
    it('returns false when user is unauthenticated', () => {
      expect(useAuthStore.getState().hasPermission('dealerPermissions')).toBe(false)
    })

    it('returns true for numeric bitmask 1', () => {
      useAuthStore.getState().setAuth(mockUser, mockPermissions)
      expect(useAuthStore.getState().hasPermission('dealerPermissions')).toBe(true)
      expect(useAuthStore.getState().hasPermission('bulkRecharge')).toBe(true)
    })

    it('returns true for boolean true', () => {
      useAuthStore.getState().setAuth(mockUser, mockPermissions)
      expect(useAuthStore.getState().hasPermission('commissionPermissions')).toBe(true)
    })

    it('returns false for numeric bitmask 0', () => {
      useAuthStore.getState().setAuth(mockUser, mockPermissions)
      expect(useAuthStore.getState().hasPermission('walletPermissions')).toBe(false)
      expect(useAuthStore.getState().hasPermission('dealerMpinReset')).toBe(false)
    })

    it('returns false for boolean false', () => {
      useAuthStore.getState().setAuth(mockUser, mockPermissions)
      expect(useAuthStore.getState().hasPermission('plansNumberpermissions')).toBe(false)
    })

    it('returns false for null, undefined, or missing permission keys', () => {
      useAuthStore.getState().setAuth(mockUser, mockPermissions)
      expect(useAuthStore.getState().hasPermission('caf_postpaid')).toBe(false)
      expect(useAuthStore.getState().hasPermission('nonExistentPermission')).toBe(false)
    })

    it('allows updating permissions independently via setPermissions', () => {
      useAuthStore.getState().setAuth(mockUser, mockPermissions)
      expect(useAuthStore.getState().hasPermission('walletPermissions')).toBe(false)

      useAuthStore.getState().setPermissions({
        ...mockPermissions,
        walletPermissions: 1,
      })

      expect(useAuthStore.getState().hasPermission('walletPermissions')).toBe(true)
    })
  })
})
