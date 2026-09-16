import { useAuthStore } from '@/stores/authStore'
import type { UserPermissions, UserProfile } from '@/stores/authStore'

/**
 * Sample development administrator user profile.
 */
export const DEV_ADMIN_USER: UserProfile = {
  userId: 1,
  username: 'admin_dev',
  hrmsId: 'HRMS0001',
  mobileNumber: '9876543210',
  firstName: 'Admin',
  lastName: 'Developer',
  zoneId: 1,
  circleId: 1,
  ssaId: 1,
  roleId: 1,
  roleName: 'System Administrator',
}

/**
 * Complete set of SCM 38-bitmask permission keys all granted (set to 1).
 */
export const DEV_ADMIN_PERMISSIONS: UserPermissions = {
  dealerPermissions: 1,
  walletPermissions: 1,
  userPermissions: 1,
  commissionPermissions: 1,
  plansNumberpermissions: 1,
  reportsPermissions: 1,
  stockCheck: 1,
  dealerMpinReset: 1,
  franchiseAddBalance: 1,
  bulkRecharge: 1,
  varepReports: 1,
  userActivityReports: 1,
  dealerStatus: 1,
  transactionStatus: 1,
  topupReversal: 1,
  simSaleUpload: 1,
  simInventory: 1,
  pendingClearence: 1,
  inReconsilation: 1,
  mobileApp: 1,
  deferredCommission: 1,
  cbp: 1,
  simUpgrade: 1,
  mnp: 1,
  frcStv: 1,
  bulk_purge: 1,
  e_auction: 1,
  caf_postpaid: 1,
  denominations: 1,
  prepaidCommissions: 1,
  postpaidCommissions: 1,
  landlineCommissions: 1,
  FOSCreation: 1,
}

/**
 * Dev-only mock authentication bootstrap.
 * On app load in development, if no user is authenticated, calls authStore.setAuth()
 * with a sample admin user that has all permissions granted.
 * Statically gated behind import.meta.env.DEV so it is stripped in production builds.
 */
export function bootstrapDevAuth(): boolean {
  if (import.meta.env.DEV) {
    const store = useAuthStore.getState()
    if (!store.user) {
      store.setAuth(DEV_ADMIN_USER, DEV_ADMIN_PERMISSIONS)
      return true
    }
  }
  return false
}
