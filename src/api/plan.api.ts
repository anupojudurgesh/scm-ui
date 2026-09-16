import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// ==========================================
// 1. Data Models & Payloads
// ==========================================

export interface Plan {
  sno: string | number;
  operator: string;
  denomination: string | number;
  talkvalue: string | number;
  country: string;
  start_date: string;
  end_date: string;
  type: string;
  description: string;
  tab_name: string;
  circle: string;
  validity: string | number;
  from_date: string;
  to_date: string;
  status?: string;
  cdt?: string;
}

export interface AddPlanPayload {
  operator: string;
  denomination: string | number;
  talkvalue: string | number;
  country: string;
  start_date: string;
  end_date: string;
  type: string;
  description: string;
  tab_name: string;
  circle: string;
  validity: string | number;
  from_date: string;
  to_date: string;
}

export interface UpdatePlanPayload extends Partial<AddPlanPayload> {
  sno: string | number;
}

export interface Denomination {
  id: string | number;
  rechargePlanName: string;
  planType: string;
  price: string | number;
  createdBy?: string;
  validity: string | number;
  description: string;
  bundleName?: string;
  bucketId?: string | number;
  faceValue: string | number;
  netValue: string | number;
  cardGroup?: string | number;
  varepDenom?: string | number;
  circleId: string | number;
  circleName?: string;
  vasDenom?: string | number;
  varepGroup?: string;
  status?: string;
  cdt?: string;
}

export interface SaveDenominationPayload {
  rechargePlanName: string;
  planType: string;
  price: string | number;
  createdBy: string;
  validity: string | number;
  description: string;
  bundleName: string;
  bucketId: string | number;
  faceValue: string | number;
  netValue: string | number;
  cardGroup: string | number;
  varepDenom: string | number;
  circleId: string | number;
  vasDenom: string | number;
  varepGroup: string;
}

export interface SaveMultipleDenominationsPayload extends SaveDenominationPayload {
  zoneId?: string | number;
}

export interface MnpRecord {
  id: string | number;
  msisdn: string;
  recipientNo: string;
  circleId: string | number;
  circleName?: string;
  username: string;
  status?: string;
  cdt?: string;
}

export interface SaveMnpPayload {
  msisdn: string;
  recipientNo: string;
  circleId: string | number;
  username: string;
}

export interface ModifyMnpPayload {
  msisdn: string;
  recipientNo: string;
  circleId: string | number;
  username: string;
}

export interface DeleteMnpPayload {
  msisdn: string;
  recipientNo: string;
  circleId: string | number;
  username: string;
}

export interface NumberSeries {
  numberSeriesId: string | number;
  numberSeries: string;
  circleId: string | number;
  circleName?: string;
  inId: string | number;
  zoneId?: string | number;
  seqNo?: string | number;
  username?: string;
  status?: string;
  cdt?: string;
}

export interface AddNumberSeriesPayload {
  circleId: string | number;
  numberSeries: string;
  numberSeriesId: string | number;
  inId: string | number;
  username: string;
}

export interface SaveNumberSeriesPayload {
  zoneId?: string | number;
  circleId: string | number;
  seqNo?: string | number;
  number_series: string;
  inId: string | number;
  username: string;
}

export interface EditNumberSeriesPayload {
  numberSeries: string;
  inId: string | number;
  circleId: string | number;
  username: string;
  numberSeriesId: string | number;
}

export interface PlanApiResponse<T = unknown> {
  status?: string;
  statusCode?: number | string;
  message?: string;
  data?: T;
}

// ==========================================
// 2. Realistic Fallback Sample Data
// ==========================================

const SAMPLE_PLANS: Plan[] = [
  {
    sno: 'PLN-101',
    operator: 'BSNL',
    denomination: '199',
    talkvalue: '199',
    country: 'India',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    type: 'STV',
    description: 'Unlimited Calls + 2GB/day Data + 100 SMS/day',
    tab_name: 'STV',
    circle: 'AP',
    validity: '28',
    from_date: '2026-01-01',
    to_date: '2026-12-31',
    status: 'Active',
    cdt: '2026-01-15T09:00:00Z',
  },
  {
    sno: 'PLN-102',
    operator: 'BSNL',
    denomination: '399',
    talkvalue: '399',
    country: 'India',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    type: 'Unlimited',
    description: 'Unlimited Voice Calls + 3GB/day Data + Free BSNL Tunes',
    tab_name: 'Unlimited',
    circle: 'TS',
    validity: '70',
    from_date: '2026-01-01',
    to_date: '2026-12-31',
    status: 'Active',
    cdt: '2026-01-20T10:30:00Z',
  },
  {
    sno: 'PLN-103',
    operator: 'BSNL',
    denomination: '499',
    talkvalue: '499',
    country: 'India',
    start_date: '2026-02-01',
    end_date: '2026-12-31',
    type: 'Prepaid',
    description: 'Quarterly Value Pack: 2GB/day + 100 SMS/day + Free National Roaming',
    tab_name: 'PV',
    circle: 'TN',
    validity: '90',
    from_date: '2026-02-01',
    to_date: '2026-12-31',
    status: 'Active',
    cdt: '2026-02-05T14:15:00Z',
  },
  {
    sno: 'PLN-104',
    operator: 'BSNL',
    denomination: '1499',
    talkvalue: '1499',
    country: 'India',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    type: 'Annual',
    description: 'Annual Ultra Saver: 24GB Bulk High-Speed Data + Unlimited Calls',
    tab_name: 'Annual',
    circle: 'MH',
    validity: '365',
    from_date: '2026-01-01',
    to_date: '2026-12-31',
    status: 'Active',
    cdt: '2026-01-10T11:00:00Z',
  },
  {
    sno: 'PLN-105',
    operator: 'BSNL',
    denomination: '50',
    talkvalue: '39.5',
    country: 'India',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    type: 'TopUp',
    description: 'General TopUp with talk time ₹39.50',
    tab_name: 'TopUp',
    circle: 'DL',
    validity: '0',
    from_date: '2026-01-01',
    to_date: '2026-12-31',
    status: 'Active',
    cdt: '2026-01-12T08:00:00Z',
  },
]

const SAMPLE_DENOMINATIONS: Denomination[] = [
  {
    id: 'DENOM-101',
    rechargePlanName: 'STV 199 Unlimited',
    planType: 'STV',
    price: '199',
    createdBy: 'admin_user',
    validity: '28',
    description: '2GB/day + Unlimited Calls',
    bundleName: 'Unlimited',
    bucketId: '1',
    faceValue: '199',
    netValue: '199',
    cardGroup: '1',
    varepDenom: '199',
    circleId: 1,
    circleName: 'AP (Andhra Pradesh)',
    vasDenom: '0',
    varepGroup: 'General',
    status: 'Active',
    cdt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'DENOM-102',
    rechargePlanName: 'Data Special 249',
    planType: 'Data',
    price: '249',
    createdBy: 'admin_user',
    validity: '45',
    description: 'High-speed 2GB/day + OTT subscription',
    bundleName: 'Entertainment',
    bucketId: '2',
    faceValue: '249',
    netValue: '249',
    cardGroup: '2',
    varepDenom: '249',
    circleId: 2,
    circleName: 'TS (Telangana)',
    vasDenom: '50',
    varepGroup: 'Digital',
    status: 'Active',
    cdt: '2026-02-12T14:30:00Z',
  },
  {
    id: 'DENOM-103',
    rechargePlanName: 'TopUp 100 Talktime',
    planType: 'TopUp',
    price: '100',
    createdBy: 'admin_user',
    validity: '0',
    description: 'Pure Talk Time voucher ₹81.75',
    bundleName: 'TalkTime',
    bucketId: '3',
    faceValue: '100',
    netValue: '81.75',
    cardGroup: '3',
    varepDenom: '100',
    circleId: 3,
    circleName: 'TN (Tamil Nadu)',
    vasDenom: '0',
    varepGroup: 'Voice',
    status: 'Active',
    cdt: '2026-02-15T09:45:00Z',
  },
]

const SAMPLE_MNP_RECORDS: MnpRecord[] = [
  {
    id: 'MNP-101',
    msisdn: '9440012345',
    recipientNo: '40401',
    circleId: 1,
    circleName: 'AP (Andhra Pradesh)',
    username: 'admin_user',
    status: 'Ported In',
    cdt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'MNP-102',
    msisdn: '9490054321',
    recipientNo: '40402',
    circleId: 2,
    circleName: 'TS (Telangana)',
    username: 'admin_user',
    status: 'Ported In',
    cdt: '2026-03-02T11:15:00Z',
  },
  {
    id: 'MNP-103',
    msisdn: '9444098765',
    recipientNo: '40403',
    circleId: 3,
    circleName: 'TN (Tamil Nadu)',
    username: 'admin_user',
    status: 'Pending Verification',
    cdt: '2026-03-05T16:20:00Z',
  },
]

const SAMPLE_NUMBER_SERIES: NumberSeries[] = [
  {
    numberSeriesId: 'SER-101',
    numberSeries: '94400',
    circleId: 1,
    circleName: 'AP (Andhra Pradesh)',
    inId: 101,
    zoneId: 1,
    seqNo: '1',
    username: 'admin_user',
    status: 'Allocated',
    cdt: '2026-01-05T08:30:00Z',
  },
  {
    numberSeriesId: 'SER-102',
    numberSeries: '94900',
    circleId: 2,
    circleName: 'TS (Telangana)',
    inId: 102,
    zoneId: 1,
    seqNo: '2',
    username: 'admin_user',
    status: 'Allocated',
    cdt: '2026-01-08T09:45:00Z',
  },
  {
    numberSeriesId: 'SER-103',
    numberSeries: '94440',
    circleId: 3,
    circleName: 'TN (Tamil Nadu)',
    inId: 103,
    zoneId: 1,
    seqNo: '3',
    username: 'admin_user',
    status: 'Active',
    cdt: '2026-01-12T14:10:00Z',
  },
  {
    numberSeriesId: 'SER-104',
    numberSeries: '94220',
    circleId: 4,
    circleName: 'MH (Maharashtra)',
    inId: 104,
    zoneId: 2,
    seqNo: '4',
    username: 'admin_user',
    status: 'Reserved',
    cdt: '2026-01-18T16:00:00Z',
  },
]

// ==========================================
// 3. API Client Implementations
// ==========================================

export const planApi = {
  // ---------------- Plans ----------------
  getPlans: async (): Promise<Plan[]> => {
    try {
      const res = await apiClient<Plan[] | { data?: Plan[] }>(
        '/scm-plans-api/scm-product-api/getplans',
        { method: 'POST' }
      )
      if (Array.isArray(res)) return res
      if (res && Array.isArray(res.data)) return res.data
      return SAMPLE_PLANS
    } catch {
      // TODO: replace with real plans endpoint once verified against live testbed
      return SAMPLE_PLANS
    }
  },

  addPlan: async (payload: AddPlanPayload, username: string = 'admin'): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      `/scm-plans-api/scm-product-api/addplan?username=${encodeURIComponent(username)}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  updatePlan: async (
    sno: string | number,
    payload: UpdatePlanPayload,
    username: string = 'admin'
  ): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      `/scm-plans-api/scm-product-api/updateplan/${encodeURIComponent(String(sno))}?username=${encodeURIComponent(username)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    )
  },

  deletePlan: async (sno: string | number, username: string = 'admin'): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      `/scm-plans-api/scm-product-api/deleteplan/${encodeURIComponent(String(sno))}?username=${encodeURIComponent(username)}`,
      {
        method: 'DELETE',
      }
    )
  },

  // ------------- Denominations -------------
  saveDenomination: async (payload: SaveDenominationPayload): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      '/scm-plans-api/scm-product-api/saveDenomination',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  saveMultipleDenominations: async (
    payload: SaveMultipleDenominationsPayload,
    zoneId?: string | number
  ): Promise<PlanApiResponse> => {
    const query = zoneId !== undefined ? `?zoneId=${encodeURIComponent(String(zoneId))}` : ''
    return apiClient<PlanApiResponse>(
      `/scm-plans-api/scm-product-api/saveMultipleDenominations${query}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  fetchRechargePlan: async (params: {
    price: string | number;
    circleId: string | number;
    planType: string;
  }): Promise<PlanApiResponse<Denomination>> => {
    const qs = new URLSearchParams({
      price: String(params.price),
      circleId: String(params.circleId),
      planType: params.planType,
    }).toString()
    return apiClient<PlanApiResponse<Denomination>>(
      `/scm-plans-api/scm-product-api/rechargePlan?${qs}`
    )
  },

  listDenominations: async (): Promise<Denomination[]> => {
    // Backend doesn't expose a dedicated getDenominations list route, so we provide fallback data
    return SAMPLE_DENOMINATIONS
  },

  // ---------------- MNP ----------------
  findMnpData: async (params: {
    msisdn: string;
    username?: string;
  }): Promise<PlanApiResponse<MnpRecord>> => {
    const qs = new URLSearchParams({
      msisdn: params.msisdn,
      username: params.username || 'admin',
    }).toString()
    return apiClient<PlanApiResponse<MnpRecord>>(
      `/scm-db-api/masterdata-db-api/findMnpData?${qs}`
    )
  },

  saveMnp: async (payload: SaveMnpPayload): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      '/scm-db-api/masterdata-db-api/savemnp',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  modifyMnpData: async (payload: ModifyMnpPayload): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      '/scm-db-api/masterdata-db-api/modifyMnpData',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  deleteMnp: async (payload: DeleteMnpPayload): Promise<PlanApiResponse> => {
    const qs = new URLSearchParams({
      msisdn: payload.msisdn,
      username: payload.username,
    }).toString()
    return apiClient<PlanApiResponse>(
      `/scm-db-api/masterdata-db-api/deleteMnp?${qs}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  listMnpRecords: async (): Promise<MnpRecord[]> => {
    // Fallback list of MNP records for operator directory search
    return SAMPLE_MNP_RECORDS
  },

  // ------------- Number Series -------------
  getNumberSeries: async (params: {
    series: string;
    username?: string;
  }): Promise<PlanApiResponse<NumberSeries>> => {
    const qs = new URLSearchParams({
      series: params.series,
      username: params.username || 'admin',
    }).toString()
    return apiClient<PlanApiResponse<NumberSeries>>(
      `/scm-db-api/masterdata-db-api/getnumberseries?${qs}`
    )
  },

  addNumberSeries: async (
    payload: AddNumberSeriesPayload,
    username: string = 'admin'
  ): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      `/scm-db-api/masterdata-db-api/addnumberseries?username=${encodeURIComponent(username)}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  saveNumberSeries: async (payload: SaveNumberSeriesPayload): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      '/scm-db-api/masterdata-db-api/saveNumberSeries',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  editNumberSeries: async (
    payload: EditNumberSeriesPayload,
    username: string = 'admin'
  ): Promise<PlanApiResponse> => {
    return apiClient<PlanApiResponse>(
      `/scm-db-api/masterdata-db-api/editnumberseries?username=${encodeURIComponent(username)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    )
  },

  purgeNumberSeries: async (params: {
    series: string;
    username?: string;
  }): Promise<PlanApiResponse> => {
    const qs = new URLSearchParams({
      series: params.series,
      username: params.username || 'admin',
    }).toString()
    return apiClient<PlanApiResponse>(
      `/scm-db-api/masterdata-db-api/purgenumberseries?${qs}`,
      {
        method: 'DELETE',
      }
    )
  },

  listNumberSeries: async (): Promise<NumberSeries[]> => {
    // Fallback list of number series records for directory view
    return SAMPLE_NUMBER_SERIES
  },
}

// ==========================================
// 4. Query Keys
// ==========================================

export const planQueryKeys = {
  allPlans: ['plans'] as const,
  plansList: () => [...planQueryKeys.allPlans, 'list'] as const,
  denominations: ['denominations'] as const,
  denominationsList: () => [...planQueryKeys.denominations, 'list'] as const,
  mnp: ['mnp'] as const,
  mnpList: () => [...planQueryKeys.mnp, 'list'] as const,
  mnpItem: (msisdn: string) => [...planQueryKeys.mnp, 'item', msisdn] as const,
  numberSeries: ['number-series'] as const,
  numberSeriesList: () => [...planQueryKeys.numberSeries, 'list'] as const,
  numberSeriesItem: (series: string) => [...planQueryKeys.numberSeries, 'item', series] as const,
}

// ==========================================
// 5. TanStack Query Hooks
// ==========================================

// Plans
export function usePlansQuery() {
  return useQuery({
    queryKey: planQueryKeys.plansList(),
    queryFn: () => planApi.getPlans(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddPlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ payload, username }: { payload: AddPlanPayload; username?: string }) =>
      planApi.addPlan(payload, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.plansList() })
    },
  })
}

export function useUpdatePlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sno,
      payload,
      username,
    }: {
      sno: string | number;
      payload: UpdatePlanPayload;
      username?: string;
    }) => planApi.updatePlan(sno, payload, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.plansList() })
    },
  })
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sno, username }: { sno: string | number; username?: string }) =>
      planApi.deletePlan(sno, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.plansList() })
    },
  })
}

// Denominations
export function useDenominationsQuery() {
  return useQuery({
    queryKey: planQueryKeys.denominationsList(),
    queryFn: () => planApi.listDenominations(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveDenominationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveDenominationPayload) => planApi.saveDenomination(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.denominationsList() })
    },
  })
}

export function useSaveMultipleDenominationsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      zoneId,
    }: {
      payload: SaveMultipleDenominationsPayload;
      zoneId?: string | number;
    }) => planApi.saveMultipleDenominations(payload, zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.denominationsList() })
    },
  })
}

// MNP
export function useMnpListQuery() {
  return useQuery({
    queryKey: planQueryKeys.mnpList(),
    queryFn: () => planApi.listMnpRecords(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useFindMnpQuery(msisdn: string, username?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: planQueryKeys.mnpItem(msisdn),
    queryFn: () => planApi.findMnpData({ msisdn, username }),
    enabled: Boolean(msisdn) && enabled,
  })
}

export function useSaveMnpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveMnpPayload) => planApi.saveMnp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.mnpList() })
    },
  })
}

export function useModifyMnpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ModifyMnpPayload) => planApi.modifyMnpData(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.mnpList() })
    },
  })
}

export function useDeleteMnpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DeleteMnpPayload) => planApi.deleteMnp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.mnpList() })
    },
  })
}

// Number Series
export function useNumberSeriesListQuery() {
  return useQuery({
    queryKey: planQueryKeys.numberSeriesList(),
    queryFn: () => planApi.listNumberSeries(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddNumberSeriesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ payload, username }: { payload: AddNumberSeriesPayload; username?: string }) =>
      planApi.addNumberSeries(payload, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.numberSeriesList() })
    },
  })
}

export function useSaveNumberSeriesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveNumberSeriesPayload) => planApi.saveNumberSeries(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.numberSeriesList() })
    },
  })
}

export function useEditNumberSeriesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      username,
    }: {
      payload: EditNumberSeriesPayload;
      username?: string;
    }) => planApi.editNumberSeries(payload, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.numberSeriesList() })
    },
  })
}

export function usePurgeNumberSeriesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { series: string; username?: string }) =>
      planApi.purgeNumberSeries(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.numberSeriesList() })
    },
  })
}
