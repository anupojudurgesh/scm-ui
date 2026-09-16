import { create } from 'zustand'

export interface UserPermissions {
  dealerPermissions?: number | boolean;
  walletPermissions?: number | boolean;
  userPermissions?: number | boolean;
  commissionPermissions?: number | boolean;
  plansNumberpermissions?: number | boolean;
  reportsPermissions?: number | boolean;
  stockCheck?: number | boolean;
  dealerMpinReset?: number | boolean;
  franchiseAddBalance?: number | boolean;
  bulkRecharge?: number | boolean;
  varepReports?: number | boolean;
  userActivityReports?: number | boolean;
  dealerStatus?: number | boolean;
  transactionStatus?: number | boolean;
  topupReversal?: number | boolean;
  simSaleUpload?: number | boolean;
  simInventory?: number | boolean;
  pendingClearence?: number | boolean;
  inReconsilation?: number | boolean;
  mobileApp?: number | boolean;
  deferredCommission?: number | boolean;
  cbp?: number | boolean;
  simUpgrade?: number | boolean;
  mnp?: number | boolean;
  frcStv?: number | boolean;
  bulk_purge?: number | boolean;
  e_auction?: number | boolean;
  caf_postpaid?: number | boolean | null;
  denominations?: number | boolean;
  prepaidCommissions?: number | boolean;
  postpaidCommissions?: number | boolean;
  landlineCommissions?: number | boolean;
  FOSCreation?: number | boolean;
  [key: string]: unknown;
}

export type PermissionKey = keyof UserPermissions

export interface UserProfile {
  userId: number | string;
  username: string;
  hrmsId: string;
  mobileNumber?: string;
  firstName?: string;
  lastName?: string;
  zoneId?: number;
  circleId?: number;
  ssaId?: number;
  roleId: number;
  roleName?: string | null;
}

export interface AuthState {
  user: UserProfile | null;
  role: number | null;
  roleName: string | null;
  permissions: UserPermissions | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: UserProfile, permissions?: UserPermissions) => void;
  setPermissions: (permissions: UserPermissions) => void;
  clearAuth: () => void;
  hasPermission: (key: PermissionKey | string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  roleName: null,
  permissions: null,
  isAuthenticated: false,

  setAuth: (user: UserProfile, permissions?: UserPermissions) =>
    set({
      user,
      role: user.roleId,
      roleName: user.roleName ?? null,
      permissions: permissions ?? null,
      isAuthenticated: true,
    }),

  setPermissions: (permissions: UserPermissions) =>
    set({ permissions }),

  clearAuth: () =>
    set({
      user: null,
      role: null,
      roleName: null,
      permissions: null,
      isAuthenticated: false,
    }),

  hasPermission: (key: PermissionKey | string): boolean => {
    const { permissions, isAuthenticated } = get()
    if (!isAuthenticated || !permissions) {
      return false
    }

    const value = permissions[key]
    // Handles numeric bitmask flags (1 = allowed, 0 = denied) and boolean flags
    return value === 1 || value === true
  },
}))
