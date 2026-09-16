/**
 * Dashboard API Service
 *
 * NOTE: The Postman collection currently does not expose dedicated count/summary
 * endpoints for dashboard KPI metrics or an audit/activity log feed.
 *
 * TODO: Replace with real endpoints once count/summary APIs are provisioned by the backend:
 * e.g., GET /scm-db-api/masterdata-db-api/dashboard-summary or similar.
 */

export interface DashboardKpis {
  totalUsers: number;
  activeUsers: number;
  totalDealers: number;
  activeDealers: number;
  pendingActions: number;
  commissionConfigurations: number;
  plans: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  type: 'user' | 'dealer' | 'commission' | 'plan' | 'franchise';
  status?: 'success' | 'pending' | 'failed';
}

export const dashboardApi = {
  /**
   * Fetches high-level SCM system metrics.
   * TODO: Replace with real backend summary endpoint when available.
   */
  getKpis: async (): Promise<DashboardKpis> => {
    // Stubbed KPI data representing current SCM production state
    return {
      totalUsers: 1420,
      activeUsers: 1285,
      totalDealers: 8560,
      activeDealers: 7912,
      pendingActions: 24,
      commissionConfigurations: 18,
      plans: 42,
    }
  },

  /**
   * Fetches recent administrative actions across the platform.
   * Known limitation: The Postman collection lacks a dedicated activity feed endpoint.
   */
  getRecentActivities: async (): Promise<ActivityItem[]> => {
    return [
      {
        id: 'act-01',
        action: 'New Franchise Dealer Created: DL-North-889',
        actor: 'Admin (HRMS1048)',
        timestamp: '10 minutes ago',
        type: 'dealer',
        status: 'success',
      },
      {
        id: 'act-02',
        action: 'Modified User Permissions for Circle Manager: AP_CIRCLE_02',
        actor: 'SuperAdmin (HRMS1001)',
        timestamp: '35 minutes ago',
        type: 'user',
        status: 'success',
      },
      {
        id: 'act-03',
        action: 'Prepaid FRC Commission Config Updated: Tier-A (Zone North)',
        actor: 'FinanceManager (HRMS1092)',
        timestamp: '1 hour ago',
        type: 'commission',
        status: 'success',
      },
      {
        id: 'act-04',
        action: 'Pending Review: Wallet Topup Reversal #TX-48912',
        actor: 'Auditor (HRMS1055)',
        timestamp: '2 hours ago',
        type: 'franchise',
        status: 'pending',
      },
      {
        id: 'act-05',
        action: 'New Data Plan Published: 5G Unlimited Promo 299',
        actor: 'ProductTeam (HRMS1134)',
        timestamp: '4 hours ago',
        type: 'plan',
        status: 'success',
      },
    ]
  },
}
