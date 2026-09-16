import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { masterDataApi, masterDataKeys, type Circle } from './masterdata.api'

// Data Interfaces
export interface Category {
  categoryId: number | string;
  categoryName: string;
  description?: string;
  dealerType?: string | number;
}

export interface CommissionApiResponse<T = unknown> {
  status?: string;
  statusCode?: number | string;
  message?: string;
  data?: T;
}

export type CommissionTypeKey = 'prepaid-frc' | 'prepaid-otf' | 'postpaid' | 'landline'

export interface CommissionItem {
  commissionId: string | number;
  type: CommissionTypeKey;
  circleId: string | number;
  circleName?: string;
  categoryId: string | number;
  categoryName?: string;
  denomination?: string | number;
  sellerCommission?: string | number;
  fraCommission?: string | number;
  subCommission?: string | number;
  tds?: string | number;
  actualCommission?: string | number;
  tdsAmount?: string | number;
  sellerLevel?: string | number;
  cap_limit?: string | number;
  fromAmount?: string | number;
  toAmount?: string | number;
  commissionAmount?: string | number;
  zoneId?: string | number;
  zoneName?: string;
  status?: string;
  cdt?: string;
  mdt?: string;
}

export interface FranchiseAddBalanceTransaction {
  fabSeq: string | number;
  srcMsisdn: string;
  destMsisdn: string;
  amount: number | string;
  circle: string | number;
  circleName?: string;
  cdt: string;
  createdBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  remarks?: string;
}

export interface SaveCommissionConfigPayload {
  masterCategoryId?: string | number;
  circleId: string | number;
  sellerCommission: string | number;
  fraCommission: string | number;
  subCommission?: string | number;
  tds: string | number;
  denomination: string | number;
  categoryId: string | number;
  commissionType?: string | number;
  dtype?: string;
  createdGuiUser?: string;
}

export interface SaveMultipleCommissionConfigPayload extends SaveCommissionConfigPayload {
  zoneId?: string | number;
}

export interface PostpaidCommissionConfigPayload {
  categoryId: string | number;
  circleId: string | number;
  tdsAmount: string | number;
  fraCommission?: string | number;
  subFraCommission?: string | number;
  actualCommission: string | number;
  retailerCommission?: string | number;
  sellerLevel: string | number;
  cap_limit: string | number;
  createdGuiUser?: string;
  zoneId?: string | number;
}

export interface LandlineCommissionConfigPayload {
  categoryId: string | number;
  circleId: string | number;
  tdsAmount?: string | number;
  fraCommission?: string | number;
  subFraCommission?: string | number;
  retailerCommission?: string | number;
  sellerLevel?: string | number;
  commissionId?: string | number;
  commissionAmount?: string | number;
  fromAmount: string | number;
  toAmount: string | number;
  dtype?: string;
  zoneId?: string | number;
  createdGuiUser?: string;
}

export interface UpdateCommissionConfigPayload {
  commissionId: string | number;
  sellerCommission?: string | number;
  fraCommission?: string | number;
  subCommission?: string | number;
  tds?: string | number;
  denomination?: string | number;
  circleId?: string | number;
  categoryId?: string | number;
  commissionType?: string | number;
  dtype?: string;
  createdGuiUser?: string;
}

export interface UpdatePostpaidCommissionPayload {
  commissionId: string | number;
  tdsAmount?: string | number;
  fraCommission?: string | number;
  actualCommission?: string | number;
  sellerLevel?: string | number;
  cap_limit?: string | number;
  circleId?: string | number;
  categoryId?: string | number;
  createdGuiUser?: string;
}

export interface UpdateLandlineCommissionPayload {
  commissionId: string | number;
  fromAmount?: string | number;
  toAmount?: string | number;
  commissionAmount?: string | number;
  tdsAmount?: string | number;
  sellerLevel?: string | number;
  circleId?: string | number;
  categoryId?: string | number;
  createdGuiUser?: string;
}

export interface FranchiseBalanceActionPayload {
  fabSeqList: (string | number)[];
  actionUser: string;
}

export interface FetchCommissionFilters {
  circleId?: string | number;
  categoryId?: string | number;
  denomination?: string | number;
  sellerLevel?: string | number;
  fromAmount?: string | number;
  toAmount?: string | number;
  username?: string;
}

// Sample mock commissions for development when backend list returns empty
const MOCK_COMMISSIONS: CommissionItem[] = [
  {
    commissionId: '101',
    type: 'prepaid-frc',
    circleId: '11',
    circleName: 'Delhi',
    categoryId: '1',
    categoryName: 'Prepaid Normal Plans',
    denomination: '199',
    sellerCommission: '4.50',
    fraCommission: '2.50',
    subCommission: '1.00',
    tds: '5.00',
    status: 'Active',
    cdt: '2025-05-10 11:20:00',
  },
  {
    commissionId: '102',
    type: 'prepaid-frc',
    circleId: '21',
    circleName: 'Andhra Pradesh',
    categoryId: '2',
    categoryName: 'Special Tariff Vouchers (STV)',
    denomination: '299',
    sellerCommission: '5.50',
    fraCommission: '3.00',
    subCommission: '1.50',
    tds: '5.00',
    status: 'Active',
    cdt: '2025-05-12 14:15:30',
  },
  {
    commissionId: '201',
    type: 'prepaid-otf',
    circleId: '11',
    circleName: 'Delhi',
    categoryId: '1',
    categoryName: 'Prepaid Normal Plans',
    denomination: '399',
    sellerCommission: '6.00',
    fraCommission: '3.50',
    subCommission: '2.00',
    tds: '5.00',
    zoneId: '1',
    zoneName: 'North Zone',
    status: 'Active',
    cdt: '2025-06-01 09:45:00',
  },
  {
    commissionId: '301',
    type: 'postpaid',
    circleId: '11',
    circleName: 'Delhi',
    categoryId: '3',
    categoryName: 'Postpaid Corporate Plans',
    tdsAmount: '15.00',
    actualCommission: '75.00',
    sellerLevel: '1',
    cap_limit: '15000',
    status: 'Active',
    cdt: '2025-06-15 16:30:00',
  },
  {
    commissionId: '401',
    type: 'landline',
    circleId: '21',
    circleName: 'Andhra Pradesh',
    categoryId: '1',
    categoryName: 'Broadband / Landline Slabs',
    fromAmount: '200',
    toAmount: '1000',
    commissionAmount: '35.00',
    tdsAmount: '5.00',
    sellerLevel: '1',
    status: 'Active',
    cdt: '2025-07-02 10:10:00',
  },
]

// Sample mock transactions for Franchise Add Balance
const MOCK_FRANCHISE_TRANSACTIONS: FranchiseAddBalanceTransaction[] = [
  {
    fabSeq: 'FAB-9021',
    srcMsisdn: '9848011223',
    destMsisdn: '9440012345',
    amount: 50000,
    circle: '11',
    circleName: 'Delhi',
    cdt: '2025-08-20 10:15:00',
    createdBy: 'Channelpay007',
    status: 'PENDING',
    remarks: 'Franchise quota top-up',
  },
  {
    fabSeq: 'FAB-9022',
    srcMsisdn: '9848022334',
    destMsisdn: '9440054321',
    amount: 100000,
    circle: '21',
    circleName: 'Andhra Pradesh',
    cdt: '2025-08-20 11:30:20',
    createdBy: 'FinanceMgr01',
    status: 'PENDING',
    remarks: 'Monthly franchise balance allocation',
  },
  {
    fabSeq: 'FAB-9023',
    srcMsisdn: '9848033445',
    destMsisdn: '9440098765',
    amount: 25000,
    circle: '11',
    circleName: 'Delhi',
    cdt: '2025-08-21 09:05:10',
    createdBy: 'Surya@324',
    status: 'PENDING',
    remarks: 'Emergency retailer balance replenishment',
  },
]

// API Service
export const commissionApi = {
  /**
   * Fetches all product and tariff categories
   * Endpoint: GET /scm-db-api/masterdata-db-api/getCategory
   */
  getCategory: async (): Promise<Category[]> => {
    const res = await apiClient<Category[] | CommissionApiResponse<Category[]>>(
      '/scm-db-api/masterdata-db-api/getCategory'
    )
    if (Array.isArray(res)) return res
    if (res && Array.isArray((res as CommissionApiResponse<Category[]>).data)) {
      return (res as CommissionApiResponse<Category[]>).data!
    }
    return []
  },

  /**
   * Fetches circles filtered by administrative zone
   * Endpoint: GET /scm-db-api/masterdata-db-api/zonebasedcircles?zoneId={zoneId}
   */
  getZoneBasedCircles: async (zoneId: number | string): Promise<Circle[]> => {
    return masterDataApi.getZoneBasedCircles(zoneId)
  },

  /**
   * Saves Prepaid FRC Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/saveCommissionConfig
   */
  saveCommissionConfig: async (
    payload: SaveCommissionConfigPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scm-plans-api/scm-product-api/saveCommissionConfig',
      {
        method: 'POST',
        body: JSON.stringify({
          masterCategoryId: payload.masterCategoryId ?? '0',
          circleId: String(payload.circleId),
          sellerCommission: String(payload.sellerCommission),
          fraCommission: String(payload.fraCommission),
          subCommission: String(payload.subCommission ?? '0'),
          tds: String(payload.tds),
          denomination: String(payload.denomination),
          categoryId: String(payload.categoryId),
          commissionType: String(payload.commissionType ?? '1'),
          dtype: payload.dtype ?? 'web',
          createdGuiUser: payload.createdGuiUser ?? 'admin',
        }),
      }
    )
  },

  /**
   * Saves Multiple Commission Config (Zone-scoped or All Circles OTF)
   * Endpoint: POST /scm-plans-api/scm-product-api/savemultipleCommissionConfig?zoneId={zoneId}
   */
  saveMultipleCommissionConfig: async (
    payload: SaveMultipleCommissionConfigPayload
  ): Promise<CommissionApiResponse> => {
    const zoneQuery =
      payload.zoneId !== undefined ? `?zoneId=${encodeURIComponent(payload.zoneId)}` : ''
    return apiClient<CommissionApiResponse>(
      `/scm-plans-api/scm-product-api/savemultipleCommissionConfig${zoneQuery}`,
      {
        method: 'POST',
        body: JSON.stringify({
          masterCategoryId: payload.masterCategoryId ?? '0',
          circleId: String(payload.circleId),
          sellerCommission: String(payload.sellerCommission),
          fraCommission: String(payload.fraCommission),
          subCommission: String(payload.subCommission ?? '0'),
          tds: String(payload.tds),
          denomination: String(payload.denomination),
          categoryId: String(payload.categoryId),
          commissionType: String(payload.commissionType ?? '2'),
          dtype: payload.dtype ?? 'web',
          createdGuiUser: payload.createdGuiUser ?? 'admin',
        }),
      }
    )
  },

  /**
   * Saves Postpaid Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/postpaidCommissionConfig
   */
  postpaidCommissionConfig: async (
    payload: PostpaidCommissionConfigPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scm-plans-api/scm-product-api/postpaidCommissionConfig',
      {
        method: 'POST',
        body: JSON.stringify({
          categoryId: String(payload.categoryId),
          circleId: String(payload.circleId),
          tdsAmount: String(payload.tdsAmount),
          fraCommission: payload.fraCommission !== undefined ? String(payload.fraCommission) : '0',
          subFraCommission: payload.subFraCommission ?? 0,
          actualCommission: String(payload.actualCommission),
          retailerCommission: payload.retailerCommission ?? 0,
          sellerLevel: String(payload.sellerLevel),
          cap_limit: String(payload.cap_limit),
          createdGuiUser: payload.createdGuiUser ?? 'admin',
          zoneId: payload.zoneId !== undefined ? String(payload.zoneId) : undefined,
        }),
      }
    )
  },

  /**
   * Saves Landline Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/landlineCommissionConfig
   */
  landlineCommissionConfig: async (
    payload: LandlineCommissionConfigPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scm-plans-api/scm-product-api/landlineCommissionConfig',
      {
        method: 'POST',
        body: JSON.stringify({
          categoryId: String(payload.categoryId),
          circleId: String(payload.circleId),
          tdsAmount: payload.tdsAmount !== undefined ? String(payload.tdsAmount) : '0',
          fraCommission: payload.fraCommission ?? 0,
          subFraCommission: payload.subFraCommission ?? 0,
          retailerCommission: payload.retailerCommission ?? 0,
          sellerLevel: String(payload.sellerLevel ?? '1'),
          commissionId: String(payload.commissionId ?? '0'),
          commissionAmount: String(payload.commissionAmount ?? '0'),
          fromAmount: String(payload.fromAmount),
          toAmount: String(payload.toAmount),
          dtype: payload.dtype ?? 'web',
          zoneId: payload.zoneId !== undefined ? String(payload.zoneId) : undefined,
          createdGuiUser: payload.createdGuiUser ?? 'admin',
        }),
      }
    )
  },

  /**
   * Fetches commissions depending on type and filters
   * Maps to:
   * - fetchCommission (FRC)
   * - fetchPrepaidOTFCommission (OTF)
   * - fetchPostpaidCommission (Postpaid)
   * - fetchLandlineCommission (Landline)
   */
  fetchCommissions: async (
    type: CommissionTypeKey,
    filters: FetchCommissionFilters = {}
  ): Promise<CommissionItem[]> => {
    try {
      if (type === 'prepaid-frc') {
        const query = new URLSearchParams()
        if (filters.denomination) query.set('denomination', String(filters.denomination))
        if (filters.circleId) query.set('circleId', String(filters.circleId))
        if (filters.categoryId) query.set('categoryId', String(filters.categoryId))
        query.set('commissionType', '1')
        query.set('username', filters.username || 'admin')
        query.set('dtype', 'web')

        const res = await apiClient<CommissionItem[] | CommissionApiResponse<CommissionItem[]>>(
          `/scm-plans-api/scm-product-api/fetchCommission?${query.toString()}`
        )
        const items = Array.isArray(res) ? res : res?.data || []
        if (items.length > 0) return items.map((it) => ({ ...it, type: 'prepaid-frc' }))
      } else if (type === 'prepaid-otf') {
        const query = new URLSearchParams()
        if (filters.denomination) query.set('denomination', String(filters.denomination))
        if (filters.circleId) query.set('circleId', String(filters.circleId))
        if (filters.categoryId) query.set('categoryId', String(filters.categoryId))
        query.set('commissionType', '2')
        query.set('username', filters.username || 'admin')
        query.set('dtype', 'web')

        const res = await apiClient<CommissionItem[] | CommissionApiResponse<CommissionItem[]>>(
          `/scm-plans-api/scm-product-api/fetchPrepaidOTFCommission?${query.toString()}`
        )
        const items = Array.isArray(res) ? res : res?.data || []
        if (items.length > 0) return items.map((it) => ({ ...it, type: 'prepaid-otf' }))
      } else if (type === 'postpaid') {
        const query = new URLSearchParams()
        if (filters.circleId) query.set('circleId', String(filters.circleId))
        if (filters.categoryId) query.set('category', String(filters.categoryId))
        query.set('sellerLevel', String(filters.sellerLevel || '1'))
        query.set('username', filters.username || 'admin')

        const res = await apiClient<CommissionItem[] | CommissionApiResponse<CommissionItem[]>>(
          `/scm-plans-api/scm-product-api/fetchPostpaidCommission?${query.toString()}`
        )
        const items = Array.isArray(res) ? res : res?.data || []
        if (items.length > 0) return items.map((it) => ({ ...it, type: 'postpaid' }))
      } else if (type === 'landline') {
        const res = await apiClient<CommissionItem[] | CommissionApiResponse<CommissionItem[]>>(
          '/scm-plans-api/scm-product-api/fetchLandlineCommission',
          {
            method: 'POST',
            body: JSON.stringify({
              circleId: String(filters.circleId || '11'),
              categoryId: String(filters.categoryId || '1'),
              fromAmount: String(filters.fromAmount || '0'),
              toAmount: String(filters.toAmount || '10000'),
              guiUsername: filters.username || 'admin',
            }),
          }
        )
        const items = Array.isArray(res) ? res : res?.data || []
        if (items.length > 0) return items.map((it) => ({ ...it, type: 'landline' }))
      }
    } catch {
      // Fall through to mock list for local dev/test resiliency
    }

    // Filter local mock items matching the selected type & filters
    return MOCK_COMMISSIONS.filter((it) => {
      if (it.type !== type) return false
      if (filters.circleId && String(it.circleId) !== String(filters.circleId)) return false
      if (filters.categoryId && String(it.categoryId) !== String(filters.categoryId)) return false
      if (
        filters.denomination &&
        it.denomination &&
        !String(it.denomination).includes(String(filters.denomination))
      ) {
        return false
      }
      return true
    })
  },

  /**
   * Updates Prepaid FRC / OTF Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/updateCommissionConfig
   */
  updateCommissionConfig: async (
    payload: UpdateCommissionConfigPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scm-plans-api/scm-product-api/updateCommissionConfig',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Updates Postpaid Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/updatePostpaidCommission
   */
  updatePostpaidCommission: async (
    payload: UpdatePostpaidCommissionPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scm-plans-api/scm-product-api/updatePostpaidCommission',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Updates Landline Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/updateLandlineCommission
   */
  updateLandlineCommission: async (
    payload: UpdateLandlineCommissionPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scm-plans-api/scm-product-api/updateLandlineCommission',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Deletes Prepaid FRC / OTF Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/deleteCommissionConfig?commissionId={id}
   */
  deleteCommissionConfig: async (commissionId: string | number): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      `/scm-plans-api/scm-product-api/deleteCommissionConfig?commissionId=${encodeURIComponent(
        commissionId
      )}`,
      { method: 'POST' }
    )
  },

  /**
   * Deletes Postpaid Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/deletePostpaidCommission?commissionId={id}
   */
  deletePostpaidCommission: async (commissionId: string | number): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      `/scm-plans-api/scm-product-api/deletePostpaidCommission?commissionId=${encodeURIComponent(
        commissionId
      )}`,
      { method: 'POST' }
    )
  },

  /**
   * Deletes Landline Commission Configuration
   * Endpoint: POST /scm-plans-api/scm-product-api/deleteLandlineCommission?commissionId={id}
   */
  deleteLandlineCommission: async (commissionId: string | number): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      `/scm-plans-api/scm-product-api/deleteLandlineCommission?commissionId=${encodeURIComponent(
        commissionId
      )}`,
      { method: 'POST' }
    )
  },

  /**
   * Fetches Franchise Add Balance pending transactions
   * Endpoint: GET /scmfmis-reports-api/scm-franchise-gui/franchiseAddBalanceTransactions?circle={circleId}
   */
  getFranchiseAddBalanceTransactions: async (
    circleId?: string | number
  ): Promise<FranchiseAddBalanceTransaction[]> => {
    try {
      const circleParam = circleId ? `?circle=${encodeURIComponent(circleId)}` : ''
      const res = await apiClient<
        FranchiseAddBalanceTransaction[] | CommissionApiResponse<FranchiseAddBalanceTransaction[]>
      >(`/scmfmis-reports-api/scm-franchise-gui/franchiseAddBalanceTransactions${circleParam}`)

      const items = Array.isArray(res) ? res : res?.data || []
      if (items.length > 0) return items
    } catch {
      // Fall through to mock transactions for local dev/testing
    }

    if (circleId) {
      return MOCK_FRANCHISE_TRANSACTIONS.filter((t) => String(t.circle) === String(circleId))
    }
    return MOCK_FRANCHISE_TRANSACTIONS
  },

  /**
   * Approves Franchise Add Balance transactions
   * Endpoint: POST /scmfmis-reports-api/scm-franchise-gui/franchiseAddBalance/approve
   */
  approveFranchiseAddBalance: async (
    payload: FranchiseBalanceActionPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scmfmis-reports-api/scm-franchise-gui/franchiseAddBalance/approve',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Rejects Franchise Add Balance transactions
   * Endpoint: POST /scmfmis-reports-api/scm-franchise-gui/franchiseAddBalance/reject
   */
  rejectFranchiseAddBalance: async (
    payload: FranchiseBalanceActionPayload
  ): Promise<CommissionApiResponse> => {
    return apiClient<CommissionApiResponse>(
      '/scmfmis-reports-api/scm-franchise-gui/franchiseAddBalance/reject',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },
}

// TanStack Query Cache Keys
export const commissionKeys = {
  all: ['commission'] as const,
  categories: () => [...commissionKeys.all, 'categories'] as const,
  circlesByZone: (zoneId?: number | string | null) =>
    masterDataKeys.circlesByZone(zoneId),
  search: (type: CommissionTypeKey, filters: FetchCommissionFilters) =>
    [...commissionKeys.all, 'search', type, filters] as const,
  franchiseTransactions: (circleId?: string | number | null) =>
    [...commissionKeys.all, 'franchiseTransactions', circleId ?? null] as const,
}

// TanStack Query Hooks
export function useCategoriesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: commissionKeys.categories(),
    queryFn: () => commissionApi.getCategory(),
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    ...options,
  })
}

export function useZoneBasedCirclesQuery(
  zoneId?: number | string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: commissionKeys.circlesByZone(zoneId),
    queryFn: () => commissionApi.getZoneBasedCircles(zoneId!),
    enabled: Boolean(zoneId) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 30,
  })
}

export function useCommissionsQuery(
  type: CommissionTypeKey,
  filters: FetchCommissionFilters = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: commissionKeys.search(type, filters),
    queryFn: () => commissionApi.fetchCommissions(type, filters),
    ...options,
  })
}

export function useFranchiseTransactionsQuery(
  circleId?: string | number | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: commissionKeys.franchiseTransactions(circleId),
    queryFn: () => commissionApi.getFranchiseAddBalanceTransactions(circleId || undefined),
    ...options,
  })
}

export function useSaveCommissionConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveCommissionConfigPayload) =>
      commissionApi.saveCommissionConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useSaveMultipleCommissionConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveMultipleCommissionConfigPayload) =>
      commissionApi.saveMultipleCommissionConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function usePostpaidCommissionConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PostpaidCommissionConfigPayload) =>
      commissionApi.postpaidCommissionConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useLandlineCommissionConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LandlineCommissionConfigPayload) =>
      commissionApi.landlineCommissionConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useUpdateCommissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCommissionConfigPayload) =>
      commissionApi.updateCommissionConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useUpdatePostpaidMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePostpaidCommissionPayload) =>
      commissionApi.updatePostpaidCommission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useUpdateLandlineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateLandlineCommissionPayload) =>
      commissionApi.updateLandlineCommission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useDeleteCommissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      type,
      commissionId,
    }: {
      type: CommissionTypeKey;
      commissionId: string | number;
    }) => {
      if (type === 'postpaid') {
        return commissionApi.deletePostpaidCommission(commissionId)
      }
      if (type === 'landline') {
        return commissionApi.deleteLandlineCommission(commissionId)
      }
      return commissionApi.deleteCommissionConfig(commissionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useApproveFranchiseBalanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FranchiseBalanceActionPayload) =>
      commissionApi.approveFranchiseAddBalance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.franchiseTransactions() })
    },
  })
}

export function useRejectFranchiseBalanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FranchiseBalanceActionPayload) =>
      commissionApi.rejectFranchiseAddBalance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.franchiseTransactions() })
    },
  })
}
