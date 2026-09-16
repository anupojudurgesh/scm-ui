import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export interface Zone {
  zoneId: number | string;
  zoneName: string;
}

export interface Circle {
  circleId: number | string;
  circleName: string;
  zoneId?: number | string;
}

export interface SSA {
  ssaId: number | string;
  ssaName: string;
  circleId?: number | string;
}

// API Service Functions
export const masterDataApi = {
  getZones: async (): Promise<Zone[]> => {
    return apiClient<Zone[]>('/scm-db-api/masterdata-db-api/zones')
  },

  getZoneBasedCircles: async (zoneId: number | string): Promise<Circle[]> => {
    return apiClient<Circle[]>(
      `/scm-db-api/masterdata-db-api/zonebasedcircles?zoneId=${encodeURIComponent(zoneId)}`
    )
  },

  getAllCircles: async (): Promise<Circle[]> => {
    return apiClient<Circle[]>('/scm-db-api/masterdata-db-api/circles')
  },

  getSSAsByCircle: async (circleId: number | string): Promise<SSA[]> => {
    return apiClient<SSA[]>(
      `/scm-db-api/masterdata-db-api/ssas?circleId=${encodeURIComponent(circleId)}`
    )
  },
}

// TanStack Query Cache Keys
export const masterDataKeys = {
  all: ['masterdata'] as const,
  zones: () => [...masterDataKeys.all, 'zones'] as const,
  circlesByZone: (zoneId?: number | string | null) =>
    [...masterDataKeys.all, 'circles', { zoneId: zoneId ?? null }] as const,
  allCircles: () => [...masterDataKeys.all, 'circles', 'all'] as const,
  ssasByCircle: (circleId?: number | string | null) =>
    [...masterDataKeys.all, 'ssas', { circleId: circleId ?? null }] as const,
}

// TanStack Query Hooks
export function useZonesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: masterDataKeys.zones(),
    queryFn: () => masterDataApi.getZones(),
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    ...options,
  })
}

export function useCirclesByZoneQuery(
  zoneId?: number | string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: masterDataKeys.circlesByZone(zoneId),
    queryFn: () => masterDataApi.getZoneBasedCircles(zoneId!),
    enabled: Boolean(zoneId) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 30,
  })
}

export function useSSAsByCircleQuery(
  circleId?: number | string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: masterDataKeys.ssasByCircle(circleId),
    queryFn: () => masterDataApi.getSSAsByCircle(circleId!),
    enabled: Boolean(circleId) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 30,
  })
}
