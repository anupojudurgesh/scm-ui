import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { UserPermissions } from '@/stores/authStore'

export interface CreateUserPayload {
  userId?: number | string;
  hrmsId: string;
  username: string;
  mobileNumber: string;
  createdBy?: string;
  firstName: string;
  lastName: string;
  address: string;
  status: string;
  roleId: number;
  zoneId: number;
  circleId: number;
  ssaId: number;
  dob: string;
  password: string;
  userIpAddress?: string;
  expiredate?: string;
  permissions: Record<string, number | boolean>;
}

export interface CreateUserResponse {
  success?: boolean;
  status?: string;
  message?: string;
  userId?: number | string;
  [key: string]: unknown;
}

export interface User {
  userId: number | string;
  username: string;
  hrmsId: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  roleId: number;
  roleName: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Blocked' | string;
  zoneId: number | string;
  zoneName: string;
  circleId: number | string;
  circleName: string;
  ssaId: number | string;
  ssaName: string;
  dob?: string;
  address?: string;
  createdBy?: string;
  createdDate?: string;
  expireDate?: string;
  permissions?: UserPermissions;
}

export interface UserListQueryParams {
  search?: string;
  status?: string;
  roleId?: number | string;
  role?: string;
  zoneId?: number | string;
  circleId?: number | string;
  ssaId?: number | string;
  page?: number;
  pageSize?: number;
}

export interface UserListResponse {
  items: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Realistic Mock SCM Users Dataset
 *
 * KNOWN LIMITATION:
 * The Postman collection does not expose a dedicated endpoint for paginated user listing
 * (only individual fetch by username/hrmsId exists).
 *
 * TODO: Replace with real list endpoint when backend provisions:
 * GET /scm-user-api/scm-user-api/users or POST /scm-user-api/scm-user-api/searchUsers
 */
export const MOCK_USERS: User[] = [
  {
    userId: 1001,
    username: 'admin_dev',
    hrmsId: 'HRMS1001',
    firstName: 'Dev',
    lastName: 'Admin',
    mobileNumber: '9876543210',
    email: 'admin.dev@telecom.internal',
    roleId: 1,
    roleName: 'System Administrator',
    status: 'Active',
    zoneId: 1,
    zoneName: 'North Zone',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 101,
    ssaName: 'New Delhi Central',
    dob: '1985-04-12',
    address: 'Telecom HQ, Barakhamba Road, New Delhi',
    createdBy: 'SYSTEM_BOOTSTRAP',
    createdDate: '2025-01-10T08:00:00Z',
  },
  {
    userId: 1002,
    username: 'rajesh.kumar',
    hrmsId: 'HRMS1048',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    mobileNumber: '9848022334',
    email: 'rajesh.kumar@telecom.internal',
    roleId: 2,
    roleName: 'Circle Manager',
    status: 'Active',
    zoneId: 2,
    zoneName: 'South Zone',
    circleId: 21,
    circleName: 'Andhra Pradesh',
    ssaId: 201,
    ssaName: 'Hyderabad',
    dob: '1988-09-24',
    address: 'Telecom Bhavan, Saifabad, Hyderabad',
    createdBy: 'admin_dev',
    createdDate: '2025-02-14T10:30:00Z',
  },
  {
    userId: 1003,
    username: 'priya.sharma',
    hrmsId: 'HRMS1092',
    firstName: 'Priya',
    lastName: 'Sharma',
    mobileNumber: '9811099881',
    email: 'priya.sharma@telecom.internal',
    roleId: 3,
    roleName: 'Finance Officer',
    status: 'Active',
    zoneId: 1,
    zoneName: 'North Zone',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 102,
    ssaName: 'South Delhi',
    dob: '1991-03-15',
    address: 'Regional Accounts Wing, Nehru Place, New Delhi',
    createdBy: 'admin_dev',
    createdDate: '2025-02-20T11:15:00Z',
  },
  {
    userId: 1004,
    username: 'amit.patel',
    hrmsId: 'HRMS1134',
    firstName: 'Amit',
    lastName: 'Patel',
    mobileNumber: '9822011223',
    email: 'amit.patel@telecom.internal',
    roleId: 4,
    roleName: 'Franchise Auditor',
    status: 'Pending',
    zoneId: 3,
    zoneName: 'West Zone',
    circleId: 31,
    circleName: 'Maharashtra',
    ssaId: 301,
    ssaName: 'Pune',
    dob: '1989-11-05',
    address: 'Shivajinagar Exchange Complex, Pune',
    createdBy: 'admin_dev',
    createdDate: '2025-03-01T09:45:00Z',
  },
  {
    userId: 1005,
    username: 'sneha.reddy',
    hrmsId: 'HRMS1188',
    firstName: 'Sneha',
    lastName: 'Reddy',
    mobileNumber: '9849033445',
    email: 'sneha.reddy@telecom.internal',
    roleId: 2,
    roleName: 'Circle Manager',
    status: 'Inactive',
    zoneId: 2,
    zoneName: 'South Zone',
    circleId: 21,
    circleName: 'Andhra Pradesh',
    ssaId: 202,
    ssaName: 'Vijayawada',
    dob: '1990-07-19',
    address: 'Circle Operations Wing, Governorpet, Vijayawada',
    createdBy: 'rajesh.kumar',
    createdDate: '2025-03-05T14:20:00Z',
  },
  {
    userId: 1006,
    username: 'vikram.singh',
    hrmsId: 'HRMS1245',
    firstName: 'Vikram',
    lastName: 'Singh',
    mobileNumber: '9818044556',
    email: 'vikram.singh@telecom.internal',
    roleId: 5,
    roleName: 'Support Operator',
    status: 'Blocked',
    zoneId: 1,
    zoneName: 'North Zone',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 103,
    ssaName: 'North Delhi',
    dob: '1993-12-01',
    address: 'Customer Care & Dispatch Cell, Rohini, New Delhi',
    createdBy: 'priya.sharma',
    createdDate: '2025-03-10T16:00:00Z',
  },
  {
    userId: 1007,
    username: 'ananya.deshmukh',
    hrmsId: 'HRMS1310',
    firstName: 'Ananya',
    lastName: 'Deshmukh',
    mobileNumber: '9820055667',
    email: 'ananya.deshmukh@telecom.internal',
    roleId: 3,
    roleName: 'Finance Officer',
    status: 'Active',
    zoneId: 3,
    zoneName: 'West Zone',
    circleId: 31,
    circleName: 'Maharashtra',
    ssaId: 302,
    ssaName: 'Mumbai',
    dob: '1987-05-30',
    address: 'Fort Central Telegraph Office, Mumbai',
    createdBy: 'admin_dev',
    createdDate: '2025-03-12T08:30:00Z',
  },
  {
    userId: 1008,
    username: 'karthik.nair',
    hrmsId: 'HRMS1382',
    firstName: 'Karthik',
    lastName: 'Nair',
    mobileNumber: '9845066778',
    email: 'karthik.nair@telecom.internal',
    roleId: 2,
    roleName: 'Circle Manager',
    status: 'Active',
    zoneId: 2,
    zoneName: 'South Zone',
    circleId: 22,
    circleName: 'Karnataka',
    ssaId: 203,
    ssaName: 'Bangalore Urban',
    dob: '1986-08-14',
    address: 'Halasuru Telecom Complex, Bangalore',
    createdBy: 'admin_dev',
    createdDate: '2025-03-14T11:00:00Z',
  },
  {
    userId: 1009,
    username: 'pooja.verma',
    hrmsId: 'HRMS1425',
    firstName: 'Pooja',
    lastName: 'Verma',
    mobileNumber: '9810077889',
    email: 'pooja.verma@telecom.internal',
    roleId: 5,
    roleName: 'Support Operator',
    status: 'Active',
    zoneId: 1,
    zoneName: 'North Zone',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 104,
    ssaName: 'East Delhi',
    dob: '1995-02-18',
    address: 'Laxmi Nagar Hub, East Delhi',
    createdBy: 'priya.sharma',
    createdDate: '2025-03-15T09:10:00Z',
  },
  {
    userId: 1010,
    username: 'suresh.babu',
    hrmsId: 'HRMS1512',
    firstName: 'Suresh',
    lastName: 'Babu',
    mobileNumber: '9849088990',
    email: 'suresh.babu@telecom.internal',
    roleId: 4,
    roleName: 'Franchise Auditor',
    status: 'Inactive',
    zoneId: 2,
    zoneName: 'South Zone',
    circleId: 21,
    circleName: 'Andhra Pradesh',
    ssaId: 204,
    ssaName: 'Visakhapatnam',
    dob: '1984-10-22',
    address: 'Daba Gardens Main Exchange, Visakhapatnam',
    createdBy: 'rajesh.kumar',
    createdDate: '2025-03-16T13:45:00Z',
  },
]

// Real Endpoints and Mock List Service
export const userApi = {
  /**
   * Real endpoint: Fetch user details by username
   * GET /scm-user-api/scm-user-api/getUser/{username}
   */
  getUser: async (username: string): Promise<User> => {
    return apiClient<User>(
      `/scm-user-api/scm-user-api/getUser/${encodeURIComponent(username)}`
    )
  },

  /**
   * Real endpoint: Get user with HRMS and username
   * GET /scm-user-api/scm-user-api/getUserwithHrmsIdandUsername?hrmsId={}&username={}&guiUsername={}
   */
  getUserWithHrmsAndUsername: async (params: {
    hrmsId: string;
    username: string;
    guiUsername?: string;
  }): Promise<User> => {
    const query = new URLSearchParams({
      hrmsId: params.hrmsId,
      username: params.username,
      guiUsername: params.guiUsername ?? params.username,
    })
    return apiClient<User>(
      `/scm-user-api/scm-user-api/getUserwithHrmsIdandUsername?${query.toString()}`
    )
  },

  /**
   * Real endpoint: Check username availability
   * GET /scm-user-api/scm-user-api/fetchusername?username={}
   */
  checkUsernameAvailability: async (username: string): Promise<{ available: boolean }> => {
    return apiClient<{ available: boolean }>(
      `/scm-user-api/scm-user-api/fetchusername?username=${encodeURIComponent(username)}`
    )
  },

  /**
   * Real endpoint: User status check
   * GET /scm-user-api/scm-user-api/userStatusCheck?username={}
   */
  checkUserStatus: async (username: string): Promise<{ status: string }> => {
    return apiClient<{ status: string }>(
      `/scm-user-api/scm-user-api/userStatusCheck?username=${encodeURIComponent(username)}`
    )
  },

  /**
   * Real endpoint: Get user permissions
   * GET /scm-user-api/scm-user-api/getUserPermissionwithHrmsIdandUsername
   */
  getUserPermissions: async (params: {
    hrmsId: string;
    username: string;
    guiUsername?: string;
  }): Promise<UserPermissions> => {
    const query = new URLSearchParams({
      hrmsId: params.hrmsId,
      username: params.username,
      guiUsername: params.guiUsername ?? params.username,
    })
    return apiClient<UserPermissions>(
      `/scm-user-api/scm-user-api/getUserPermissionwithHrmsIdandUsername?${query.toString()}`
    )
  },

  /**
   * Lists SCM users with in-memory filtering and pagination.
   *
   * KNOWN LIMITATION: The Postman collection does not currently expose a dedicated
   * endpoint for paginated user listing.
   *
   * TODO: Replace with real backend user list/search endpoint when available:
   * e.g. GET /scm-user-api/scm-user-api/users
   */
  listUsers: async (params?: UserListQueryParams): Promise<UserListResponse> => {
    const {
      search = '',
      status = '',
      role = '',
      roleId,
      zoneId,
      circleId,
      ssaId,
      page = 1,
      pageSize = 10,
    } = params ?? {}

    let filtered = [...MOCK_USERS]

    // Text search over username, hrmsId, firstName, lastName, mobileNumber
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.hrmsId.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.mobileNumber.includes(q)
      )
    }

    // Status filter
    if (status) {
      filtered = filtered.filter(
        (u) => u.status.toLowerCase() === status.toLowerCase()
      )
    }

    // Role filter (by role name or roleId)
    if (role) {
      filtered = filtered.filter(
        (u) => u.roleName.toLowerCase() === role.toLowerCase()
      )
    }
    if (roleId !== undefined && roleId !== '') {
      filtered = filtered.filter((u) => String(u.roleId) === String(roleId))
    }

    // Cascading geographic filters
    if (zoneId !== undefined && zoneId !== '') {
      filtered = filtered.filter((u) => String(u.zoneId) === String(zoneId))
    }
    if (circleId !== undefined && circleId !== '') {
      filtered = filtered.filter((u) => String(u.circleId) === String(circleId))
    }
    if (ssaId !== undefined && ssaId !== '') {
      filtered = filtered.filter((u) => String(u.ssaId) === String(ssaId))
    }

    const totalCount = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const startIndex = (safePage - 1) * pageSize
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize)

    return {
      items: paginatedItems,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  /**
   * Real endpoint: Create User (OTP Protected: UserCreation)
   * POST /scm-user-api/scm-user-api/usercreation
   */
  createUser: async (payload: CreateUserPayload): Promise<CreateUserResponse> => {
    return apiClient<CreateUserResponse>(
      '/scm-user-api/scm-user-api/usercreation',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },
}

// TanStack Query Cache Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: UserListQueryParams) => [...userKeys.lists(), params ?? {}] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (username: string) => [...userKeys.details(), username] as const,
  detailWithHrms: (hrmsId: string, username: string) =>
    [...userKeys.details(), { hrmsId, username }] as const,
}

// TanStack Query Hooks
export function useUserQuery(username: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.detail(username),
    queryFn: () => userApi.getUser(username),
    enabled: Boolean(username) && (options?.enabled ?? true),
  })
}

export function useUserWithHrmsAndUsernameQuery(
  params: { hrmsId: string; username: string; guiUsername?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: userKeys.detailWithHrms(params.hrmsId, params.username),
    queryFn: () => userApi.getUserWithHrmsAndUsername(params),
    enabled: Boolean(params.hrmsId && params.username) && (options?.enabled ?? true),
  })
}

export function useUsersListQuery(
  params?: UserListQueryParams,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.listUsers(params),
    staleTime: options?.staleTime ?? 1000 * 60 * 2,
    ...options,
  })
}

export function useCreateUserMutation(options?: {
  onSuccess?: (data: CreateUserResponse, variables: CreateUserPayload) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userApi.createUser(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      options?.onSuccess?.(data, variables)
    },
    onError: (error: Error) => {
      options?.onError?.(error)
    },
  })
}
