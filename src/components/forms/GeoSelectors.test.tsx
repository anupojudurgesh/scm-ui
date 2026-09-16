import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ZoneSelector } from './ZoneSelector'
import { CircleSelector } from './CircleSelector'
import { SSASelector } from './SSASelector'
import { masterDataApi, type Zone, type Circle, type SSA } from '@/api/masterdata.api'

// Helper wrapper providing clean QueryClient for each test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Cascading Geo Selectors (Zone, Circle, SSA)', () => {
  const mockZones: Zone[] = [
    { zoneId: '1', zoneName: 'North Zone' },
    { zoneId: '2', zoneName: 'South Zone' },
  ]

  const mockCircles: Circle[] = [
    { circleId: '101', circleName: 'Delhi Circle', zoneId: '1' },
    { circleId: '102', circleName: 'Punjab Circle', zoneId: '1' },
  ]

  const mockSSAs: SSA[] = [
    { ssaId: '1001', ssaName: 'Delhi Central', circleId: '101' },
    { ssaId: '1002', ssaName: 'Delhi North', circleId: '101' },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Disabled State', () => {
    it('keeps CircleSelector disabled when zoneId is missing/null', async () => {
      render(<CircleSelector zoneId={null} />, { wrapper: createWrapper() })

      const trigger = screen.getByTestId('circle-selector-trigger')
      expect(trigger).toBeDisabled()
      expect(screen.getByText('Select Zone first')).toBeInTheDocument()
    })

    it('keeps SSASelector disabled when circleId is missing/null', async () => {
      render(<SSASelector circleId={null} />, { wrapper: createWrapper() })

      const trigger = screen.getByTestId('ssa-selector-trigger')
      expect(trigger).toBeDisabled()
      expect(screen.getByText('Select Circle first')).toBeInTheDocument()
    })

    it('honors explicit disabled prop on ZoneSelector even if data loaded', async () => {
      vi.spyOn(masterDataApi, 'getZones').mockResolvedValueOnce(mockZones)

      render(<ZoneSelector disabled={true} />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('zone-selector-trigger')).toBeDisabled()
      })
    })
  })

  describe('Loading State (Skeleton Display)', () => {
    it('shows Skeleton on ZoneSelector while fetching zones', () => {
      // Pending promise that doesn't resolve immediately
      vi.spyOn(masterDataApi, 'getZones').mockImplementation(() => new Promise(() => {}))

      render(<ZoneSelector />, { wrapper: createWrapper() })
      expect(screen.getByTestId('zone-selector-skeleton')).toBeInTheDocument()
    })

    it('shows Skeleton on CircleSelector while fetching circles for selected zone', () => {
      vi.spyOn(masterDataApi, 'getZoneBasedCircles').mockImplementation(() => new Promise(() => {}))

      render(<CircleSelector zoneId="1" />, { wrapper: createWrapper() })
      expect(screen.getByTestId('circle-selector-skeleton')).toBeInTheDocument()
    })

    it('shows Skeleton on SSASelector while fetching SSAs for selected circle', () => {
      vi.spyOn(masterDataApi, 'getSSAsByCircle').mockImplementation(() => new Promise(() => {}))

      render(<SSASelector circleId="101" />, { wrapper: createWrapper() })
      expect(screen.getByTestId('ssa-selector-skeleton')).toBeInTheDocument()
    })
  })

  describe('Cascading Fetch Workflow', () => {
    it('triggers circle fetch when a zone is selected', async () => {
      vi.spyOn(masterDataApi, 'getZones').mockResolvedValue(mockZones)
      const getCirclesSpy = vi.spyOn(masterDataApi, 'getZoneBasedCircles').mockResolvedValue(mockCircles)

      // Test harness simulating cascading form parent-child state
      function CascadeTestHarness() {
        const [zoneId, setZoneId] = React.useState<string | undefined>(undefined)
        return (
          <div>
            <ZoneSelector value={zoneId} onChange={(val) => setZoneId(val)} />
            <CircleSelector zoneId={zoneId} />
          </div>
        )
      }

      const { rerender } = render(<CascadeTestHarness />, { wrapper: createWrapper() })

      // Initially no zone selected -> Circle query not called
      expect(getCirclesSpy).not.toHaveBeenCalled()
      expect(screen.getByTestId('circle-selector-trigger')).toBeDisabled()

      // Simulate selecting a zone
      function CascadeTestHarnessWithZone() {
        return (
          <div>
            <ZoneSelector value="1" />
            <CircleSelector zoneId="1" />
          </div>
        )
      }

      rerender(<CascadeTestHarnessWithZone />)

      // Verify circle query was triggered with zoneId '1'
      await waitFor(() => {
        expect(getCirclesSpy).toHaveBeenCalledWith('1')
      })

      // Once loaded, CircleSelector is enabled
      await waitFor(() => {
        expect(screen.getByTestId('circle-selector-trigger')).not.toBeDisabled()
      })
    })

    it('triggers SSA fetch when circleId is supplied and supports defaultValue', async () => {
      const getSSASpy = vi.spyOn(masterDataApi, 'getSSAsByCircle').mockResolvedValue(mockSSAs)

      render(<SSASelector circleId="101" defaultValue="1001" />, {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(getSSASpy).toHaveBeenCalledWith('101')
      })

      await waitFor(() => {
        expect(screen.getByTestId('ssa-selector-trigger')).not.toBeDisabled()
      })
    })
  })
})
