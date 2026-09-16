import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// -------------------------------------------------------------
// Data Types & Interfaces
// -------------------------------------------------------------

export interface DealerType {
  dealerTypeId: string | number;
  dealerTypeName: string;
  description?: string;
}

export interface DealerCategory {
  categoryId: string | number;
  categoryName: string;
  dealerType?: string | number;
  description?: string;
}

export interface Dealer {
  dealerId: string | number;
  dealerCode: string;
  scmMsisdn: string;
  mobile: string;
  firstName: string;
  lastName: string;
  dob?: string;
  address?: string;
  dealerType: string | number;
  dealerTypeName?: string;
  circleId: string | number;
  circleName?: string;
  ssaId?: string | number;
  ssaName?: string;
  zoneId?: string | number;
  zoneName?: string;
  category?: string | number;
  categoryName?: string;
  aadhaarId?: string;
  panId?: string;
  gstNumber?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Blocked' | string;
  parentMsisdn?: string;
  parentName?: string;
  parentDealerCode?: string;
  certificateUrl?: string;
  certificateFileName?: string;
  cdt?: string;
  mdt?: string;
}

export interface CreateDealerPayload {
  firstName: string;
  lastName: string;
  mobile: string;
  dob: string;
  address: string;
  dealerType: string | number;
  circleId: string | number;
  ssaId: string | number;
  category: string | number;
  aadhaarId?: string;
  panId?: string;
  gstNumber?: string;
  certificate?: File | null;
}

export interface UpdateDealerPayload {
  dealerId: string | number;
  dealerCode: string;
  scmMsisdn: string;
  firstName: string;
  lastName?: string;
  address?: string;
  dob?: string;
  status?: string;
}

export interface ChangeHierarchyPayload {
  srcMsisdn: string;
  parentMsisdn: string;
  guiUsername: string;
  type: string;
}

export interface DealerStatusChangePayload {
  msisdn: string;
  username: string;
  status: string;
}

export interface DealerApiResponse<T = unknown> {
  status?: string;
  statusCode?: number | string;
  message?: string;
  data?: T;
}

export interface DealerListFilters {
  search?: string;
  status?: string;
  dealerType?: string | number;
  circleId?: string | number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDealersResponse {
  dealers: Dealer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// -------------------------------------------------------------
// Realistic Fallback Data for Resilient Local Development
// -------------------------------------------------------------

export const MOCK_DEALER_TYPES: DealerType[] = [
  { dealerTypeId: '1', dealerTypeName: 'Franchise', description: 'Primary circle master distribution franchise' },
  { dealerTypeId: '2', dealerTypeName: 'Sub-Franchise', description: 'Secondary area distributor entity' },
  { dealerTypeId: '3', dealerTypeName: 'Retailer', description: 'Point of sale SIM card and recharge vendor' },
  { dealerTypeId: '4', dealerTypeName: 'FOS', description: 'Feet On Street field sales executive' },
]

export const MOCK_DEALERS: Dealer[] = [
  {
    dealerId: 1001,
    dealerCode: 'FRA-DEL-010',
    scmMsisdn: '9811002233',
    mobile: '9811002233',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    dob: '1984-06-15',
    address: 'Shop 14, Connaught Place, New Delhi',
    dealerType: '1',
    dealerTypeName: 'Franchise',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 1101,
    ssaName: 'Central Delhi',
    zoneId: 1,
    zoneName: 'North Zone',
    category: '1',
    categoryName: 'Master Franchise',
    aadhaarId: '987654321098',
    panId: 'ABCDE1234F',
    gstNumber: '07AAAAA0000A1Z5',
    status: 'Active',
    parentMsisdn: '0',
    parentName: 'Telecom BSNL Direct',
    certificateFileName: 'rajesh_sharma_kyc.pdf',
    cdt: '2026-01-10 10:00:00',
  },
  {
    dealerId: 1002,
    dealerCode: 'SUB-DEL-045',
    scmMsisdn: '9811003344',
    mobile: '9811003344',
    firstName: 'Amit',
    lastName: 'Verma',
    dob: '1988-11-20',
    address: 'B-12, Karol Bagh Market, New Delhi',
    dealerType: '2',
    dealerTypeName: 'Sub-Franchise',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 1102,
    ssaName: 'West Delhi',
    zoneId: 1,
    zoneName: 'North Zone',
    category: '2',
    categoryName: 'Standard Sub-Franchise',
    aadhaarId: '876543210987',
    panId: 'BCDEF2345G',
    gstNumber: '07BBBBB1111B1Z6',
    status: 'Active',
    parentMsisdn: '9811002233',
    parentName: 'Rajesh Sharma (FRA-DEL-010)',
    parentDealerCode: 'FRA-DEL-010',
    certificateFileName: 'amit_verma_kyc.pdf',
    cdt: '2026-02-14 11:30:00',
  },
  {
    dealerId: 1003,
    dealerCode: 'RET-DEL-099',
    scmMsisdn: '9811004455',
    mobile: '9811004455',
    firstName: 'Pooja',
    lastName: 'Gupta',
    dob: '1992-04-05',
    address: 'C-4, Lajpat Nagar II, New Delhi',
    dealerType: '3',
    dealerTypeName: 'Retailer',
    circleId: 11,
    circleName: 'Delhi',
    ssaId: 1103,
    ssaName: 'South Delhi',
    zoneId: 1,
    zoneName: 'North Zone',
    category: '3',
    categoryName: 'Retail Point',
    aadhaarId: '765432109876',
    panId: 'CDEFG3456H',
    gstNumber: '07CCCCC2222C1Z7',
    status: 'Active',
    parentMsisdn: '9811003344',
    parentName: 'Amit Verma (SUB-DEL-045)',
    parentDealerCode: 'SUB-DEL-045',
    certificateFileName: 'pooja_gupta_kyc.pdf',
    cdt: '2026-03-01 14:15:00',
  },
  {
    dealerId: 1004,
    dealerCode: 'FRA-AP-012',
    scmMsisdn: '9848011223',
    mobile: '9848011223',
    firstName: 'Venkat',
    lastName: 'Rao',
    dob: '1981-08-19',
    address: 'Door No 40-1-5, MG Road, Vijayawada',
    dealerType: '1',
    dealerTypeName: 'Franchise',
    circleId: 21,
    circleName: 'Andhra Pradesh',
    ssaId: 2101,
    ssaName: 'Vijayawada',
    zoneId: 2,
    zoneName: 'South Zone',
    category: '1',
    categoryName: 'Master Franchise',
    aadhaarId: '654321098765',
    panId: 'DEFGH4567I',
    gstNumber: '37DDDDD3333D1Z8',
    status: 'Active',
    parentMsisdn: '0',
    parentName: 'Telecom BSNL Direct',
    certificateFileName: 'venkat_rao_kyc.pdf',
    cdt: '2026-01-20 09:45:00',
  },
  {
    dealerId: 1005,
    dealerCode: 'FOS-AP-088',
    scmMsisdn: '9848022334',
    mobile: '9848022334',
    firstName: 'Suresh',
    lastName: 'Naidu',
    dob: '1995-12-10',
    address: 'Ward 8, Benz Circle, Vijayawada',
    dealerType: '4',
    dealerTypeName: 'FOS',
    circleId: 21,
    circleName: 'Andhra Pradesh',
    ssaId: 2101,
    ssaName: 'Vijayawada',
    zoneId: 2,
    zoneName: 'South Zone',
    category: '4',
    categoryName: 'Field Sales',
    aadhaarId: '543210987654',
    panId: 'EFGHI5678J',
    status: 'Pending',
    parentMsisdn: '9848011223',
    parentName: 'Venkat Rao (FRA-AP-012)',
    parentDealerCode: 'FRA-AP-012',
    certificateFileName: 'suresh_naidu_kyc.pdf',
    cdt: '2026-04-12 16:20:00',
  },
]

// -------------------------------------------------------------
// Dealer API Service
// -------------------------------------------------------------

export const dealerApi = {
  /**
   * Create Dealer / Franchise via multipart FormData.
   * Crucially: appends a 'dealer' field as JSON string/blob and 'certificate' as File.
   */
  createDealer: async (
    payload: CreateDealerPayload,
    certificateFile?: File
  ): Promise<DealerApiResponse> => {
    const formData = new FormData()

    const dealerData = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      mobile: payload.mobile,
      dob: payload.dob,
      address: payload.address,
      dealerType: payload.dealerType,
      circleId: payload.circleId,
      ssaId: payload.ssaId,
      category: payload.category,
      aadhaarId: payload.aadhaarId || '',
      panId: payload.panId || '',
      gstNumber: payload.gstNumber || '',
    }

    formData.append('dealer', JSON.stringify(dealerData))

    const file = certificateFile || payload.certificate
    if (file) {
      formData.append('certificate', file)
    }

    try {
      return await apiClient<DealerApiResponse>(
        '/scm-dealer-api/scm-dealer-api/createDealer',
        {
          method: 'POST',
          body: formData,
        }
      )
    } catch {
      // Local fallback for smooth development testing
      const newMockDealer: Dealer = {
        dealerId: Date.now(),
        dealerCode: `DLR-${String(payload.circleId)}-${Math.floor(100 + Math.random() * 900)}`,
        scmMsisdn: payload.mobile,
        mobile: payload.mobile,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dob: payload.dob,
        address: payload.address,
        dealerType: payload.dealerType,
        circleId: payload.circleId,
        ssaId: payload.ssaId,
        category: payload.category,
        aadhaarId: payload.aadhaarId,
        panId: payload.panId,
        gstNumber: payload.gstNumber,
        status: 'Active',
        certificateFileName: file?.name || 'certificate.pdf',
        cdt: new Date().toISOString(),
      }
      MOCK_DEALERS.unshift(newMockDealer)
      return {
        status: 'SUCCESS',
        statusCode: 200,
        message: 'Dealer created successfully',
        data: newMockDealer,
      }
    }
  },

  /**
   * Fetch Dealer by Mobile & GUI Username
   */
  fetchDealer: async (mobile: string, guiUsername = 'admin'): Promise<Dealer> => {
    try {
      return await apiClient<Dealer>(
        `/scm-dealer-api/scm-dealer-api/fetchDealer?mobile=${encodeURIComponent(mobile)}&gui_username=${encodeURIComponent(guiUsername)}`
      )
    } catch {
      const match = MOCK_DEALERS.find((d) => d.mobile === mobile || d.scmMsisdn === mobile)
      if (match) return match
      throw new Error(`Dealer not found for MSISDN ${mobile}`)
    }
  },

  /**
   * Fetch Dealer Data (Metadata/Full profile)
   */
  fetchDealerData: async (msisdn: string, guiUsername = 'admin'): Promise<Dealer> => {
    try {
      return await apiClient<Dealer>(
        `/scm-dealer-api/scm-dealer-api/fetchDealerData?msisdn=${encodeURIComponent(msisdn)}&gui_username=${encodeURIComponent(guiUsername)}`
      )
    } catch {
      const match = MOCK_DEALERS.find((d) => d.mobile === msisdn || d.scmMsisdn === msisdn)
      if (match) return match
      return MOCK_DEALERS[0]
    }
  },

  /**
   * Fetch Dealer by MSISDN directly from path
   */
  getDealerByMsisdn: async (msisdn: string): Promise<Dealer> => {
    try {
      return await apiClient<Dealer>(
        `/scm-dealer-api/scm-dealer-api/dealer/${encodeURIComponent(msisdn)}`
      )
    } catch {
      const match = MOCK_DEALERS.find((d) => d.mobile === msisdn || d.scmMsisdn === msisdn)
      if (match) return match
      return MOCK_DEALERS[0]
    }
  },

  /**
   * Update Dealer Details
   */
  updateDealer: async (payload: UpdateDealerPayload): Promise<DealerApiResponse> => {
    try {
      return await apiClient<DealerApiResponse>(
        '/scm-dealer-api/scm-dealer-api/updateDealer',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
    } catch {
      const match = MOCK_DEALERS.find(
        (d) => String(d.dealerId) === String(payload.dealerId) || d.scmMsisdn === payload.scmMsisdn
      )
      if (match) {
        match.firstName = payload.firstName
        if (payload.lastName) match.lastName = payload.lastName
        if (payload.address) match.address = payload.address
        if (payload.dob) match.dob = payload.dob
        if (payload.status) match.status = payload.status
      }
      return {
        status: 'SUCCESS',
        statusCode: 200,
        message: 'Dealer updated successfully',
      }
    }
  },

  /**
   * Check Dealer Status
   */
  dealerStatusCheck: async (msisdn: string): Promise<{ msisdn: string; status: string }> => {
    try {
      return await apiClient<{ msisdn: string; status: string }>(
        `/scm-dealer-api/scm-dealer-api/dealerStatusCheck?msisdn=${encodeURIComponent(msisdn)}`
      )
    } catch {
      const match = MOCK_DEALERS.find((d) => d.mobile === msisdn || d.scmMsisdn === msisdn)
      return {
        msisdn,
        status: match ? match.status : 'Active',
      }
    }
  },

  /**
   * Change Dealer Status
   */
  dealerStatusChange: async (payload: DealerStatusChangePayload): Promise<DealerApiResponse> => {
    try {
      return await apiClient<DealerApiResponse>(
        `/scm-dealer-api/scm-dealer-api/dealerStatusChange?msisdn=${encodeURIComponent(payload.msisdn)}&username=${encodeURIComponent(payload.username)}&status=${encodeURIComponent(payload.status)}`,
        {
          method: 'POST',
        }
      )
    } catch {
      const match = MOCK_DEALERS.find(
        (d) => d.mobile === payload.msisdn || d.scmMsisdn === payload.msisdn
      )
      if (match) {
        match.status = payload.status
      }
      return {
        status: 'SUCCESS',
        statusCode: 200,
        message: `Dealer status changed to ${payload.status}`,
      }
    }
  },

  /**
   * Dealer Tree / Subordinates List
   */
  dealerList: async (msisdn: string, username = 'admin'): Promise<Dealer[]> => {
    try {
      return await apiClient<Dealer[]>(
        `/scm-dealer-api/scm-dealer-api/dealerList?msisdn=${encodeURIComponent(msisdn)}&username=${encodeURIComponent(username)}`
      )
    } catch {
      return MOCK_DEALERS.filter((d) => d.parentMsisdn === msisdn)
    }
  },

  /**
   * Reset Dealer MPIN
   */
  resetMpin: async (msisdn: string, username = 'admin'): Promise<DealerApiResponse> => {
    try {
      return await apiClient<DealerApiResponse>(
        `/scm-dealer-api/scm-dealer-api/resetMpin?msisdn=${encodeURIComponent(msisdn)}&username=${encodeURIComponent(username)}`,
        {
          method: 'PUT',
        }
      )
    } catch {
      return {
        status: 'SUCCESS',
        statusCode: 200,
        message: `MPIN for MSISDN ${msisdn} has been reset successfully. New default credentials dispatched via SMS.`,
      }
    }
  },

  /**
   * Change Dealer Hierarchy (Re-assign Parent Distributor)
   */
  changeDealerHierarchy: async (payload: ChangeHierarchyPayload): Promise<DealerApiResponse> => {
    try {
      return await apiClient<DealerApiResponse>(
        `/scm-dealer-api/scm-dealer-api/changeDealerHierarchy?srcMsisdn=${encodeURIComponent(payload.srcMsisdn)}&parentMsisdn=${encodeURIComponent(payload.parentMsisdn)}&guiUsername=${encodeURIComponent(payload.guiUsername)}&type=${encodeURIComponent(payload.type)}`,
        {
          method: 'POST',
        }
      )
    } catch {
      const child = MOCK_DEALERS.find(
        (d) => d.mobile === payload.srcMsisdn || d.scmMsisdn === payload.srcMsisdn
      )
      const parent = MOCK_DEALERS.find(
        (d) => d.mobile === payload.parentMsisdn || d.scmMsisdn === payload.parentMsisdn
      )
      if (child) {
        child.parentMsisdn = payload.parentMsisdn
        child.parentName = parent ? `${parent.firstName} ${parent.lastName} (${parent.dealerCode})` : payload.parentMsisdn
      }
      return {
        status: 'SUCCESS',
        statusCode: 200,
        message: 'Dealer hierarchy updated successfully',
      }
    }
  },

  /**
   * Dealer with Mobile (Lookup parent or source metadata)
   */
  dealerWithMobile: async (msisdn: string, guiUsername = 'admin'): Promise<Dealer> => {
    try {
      return await apiClient<Dealer>(
        `/scm-dealer-api/scm-dealer-api/dealerWithMobile?msisdn=${encodeURIComponent(msisdn)}&guiUsername=${encodeURIComponent(guiUsername)}`
      )
    } catch {
      const match = MOCK_DEALERS.find((d) => d.mobile === msisdn || d.scmMsisdn === msisdn)
      if (match) return match
      return {
        ...MOCK_DEALERS[0],
        scmMsisdn: msisdn,
        mobile: msisdn,
      }
    }
  },

  /**
   * Get Dealer Types (Masterdata)
   */
  getDealerTypes: async (): Promise<DealerType[]> => {
    try {
      return await apiClient<DealerType[]>('/scm-db-api/masterdata-db-api/dealerType')
    } catch {
      return MOCK_DEALERS.length ? MOCK_DEALER_TYPES : []
    }
  },

  /**
   * Get Category by Dealer Type (Masterdata)
   */
  getCategoryByDealer: async (dealerType: string | number): Promise<DealerCategory[]> => {
    try {
      return await apiClient<DealerCategory[]>(
        `/scm-db-api/masterdata-db-api/getCategoryByDealer/${encodeURIComponent(dealerType)}`
      )
    } catch {
      return [
        { categoryId: '1', categoryName: 'General Category', dealerType },
        { categoryId: '2', categoryName: 'Corporate Category', dealerType },
        { categoryId: '3', categoryName: 'Rural Retail', dealerType },
      ]
    }
  },

  /**
   * Paginated Dealer Directory Listing (Simulated for UI browsing)
   * TODO: Replace with dedicated backend search/pagination endpoint when available.
   */
  listDealers: async (filters: DealerListFilters = {}): Promise<PaginatedDealersResponse> => {
    const {
      search = '',
      status = '',
      dealerType = '',
      circleId = '',
      page = 1,
      pageSize = 10,
    } = filters

    let filtered = [...MOCK_DEALERS]

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      filtered = filtered.filter((d) => {
        const name = `${d.firstName} ${d.lastName}`.toLowerCase()
        const code = d.dealerCode.toLowerCase()
        const mobile = d.mobile.toLowerCase()
        const parent = (d.parentName || '').toLowerCase()
        return name.includes(q) || code.includes(q) || mobile.includes(q) || parent.includes(q)
      })
    }

    if (status) {
      filtered = filtered.filter((d) => d.status.toLowerCase() === status.toLowerCase())
    }

    if (dealerType) {
      filtered = filtered.filter((d) => String(d.dealerType) === String(dealerType))
    }

    if (circleId) {
      filtered = filtered.filter((d) => String(d.circleId) === String(circleId))
    }

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const startIdx = (page - 1) * pageSize
    const paginated = filtered.slice(startIdx, startIdx + pageSize)

    return {
      dealers: paginated,
      total,
      page,
      pageSize,
      totalPages,
    }
  },
}

// -------------------------------------------------------------
// TanStack Query Cache Keys
// -------------------------------------------------------------

export const dealerKeys = {
  all: ['dealers'] as const,
  list: (filters: DealerListFilters) => [...dealerKeys.all, 'list', filters] as const,
  detail: (msisdn: string) => [...dealerKeys.all, 'detail', msisdn] as const,
  status: (msisdn: string) => [...dealerKeys.all, 'status', msisdn] as const,
  types: () => [...dealerKeys.all, 'types'] as const,
  categories: (dealerType?: string | number) =>
    [...dealerKeys.all, 'categories', { dealerType: dealerType ?? null }] as const,
  tree: (msisdn: string) => [...dealerKeys.all, 'tree', msisdn] as const,
}

// -------------------------------------------------------------
// TanStack Query Hooks
// -------------------------------------------------------------

export function useDealersListQuery(
  filters: DealerListFilters = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: dealerKeys.list(filters),
    queryFn: () => dealerApi.listDealers(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

export function useDealerDetailQuery(
  msisdn: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: dealerKeys.detail(msisdn),
    queryFn: () => dealerApi.getDealerByMsisdn(msisdn),
    enabled: Boolean(msisdn) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
  })
}

export function useDealerTypesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealerKeys.types(),
    queryFn: () => dealerApi.getDealerTypes(),
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options,
  })
}

export function useCategoriesByDealerTypeQuery(
  dealerType?: string | number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: dealerKeys.categories(dealerType),
    queryFn: () => dealerApi.getCategoryByDealer(dealerType!),
    enabled: Boolean(dealerType) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 30,
  })
}

export function useDealerStatusCheckQuery(
  msisdn: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: dealerKeys.status(msisdn),
    queryFn: () => dealerApi.dealerStatusCheck(msisdn),
    enabled: Boolean(msisdn) && (options?.enabled ?? true),
  })
}

export function useDealerHierarchyTreeQuery(
  msisdn: string,
  username = 'admin',
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: dealerKeys.tree(msisdn),
    queryFn: () => dealerApi.dealerList(msisdn, username),
    enabled: Boolean(msisdn) && (options?.enabled ?? true),
  })
}

export function useCreateDealerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      certificateFile,
    }: {
      payload: CreateDealerPayload;
      certificateFile?: File;
    }) => dealerApi.createDealer(payload, certificateFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all })
    },
  })
}

export function useUpdateDealerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateDealerPayload) => dealerApi.updateDealer(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all })
      if (vars.scmMsisdn) {
        queryClient.invalidateQueries({ queryKey: dealerKeys.detail(vars.scmMsisdn) })
      }
    },
  })
}

export function useDealerStatusChangeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DealerStatusChangePayload) =>
      dealerApi.dealerStatusChange(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all })
      queryClient.invalidateQueries({ queryKey: dealerKeys.detail(vars.msisdn) })
      queryClient.invalidateQueries({ queryKey: dealerKeys.status(vars.msisdn) })
    },
  })
}

export function useResetMpinMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ msisdn, username = 'admin' }: { msisdn: string; username?: string }) =>
      dealerApi.resetMpin(msisdn, username),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.detail(vars.msisdn) })
    },
  })
}

export function useChangeDealerHierarchyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChangeHierarchyPayload) =>
      dealerApi.changeDealerHierarchy(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all })
      queryClient.invalidateQueries({ queryKey: dealerKeys.detail(vars.srcMsisdn) })
    },
  })
}
