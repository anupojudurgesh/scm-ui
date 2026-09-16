import { Routes, Route, Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { DashboardPage } from '@/features/dashboard'
import { UsersPage } from '@/features/users/UsersPage'
import { DealerListPage, DealerDetailPage } from '@/features/dealers'
import {
  CommissionConfigPage,
  CommissionSearchPage,
  FranchiseAddBalancePage,
} from '@/features/commissions'
import { PlansPage } from '@/features/plans/PlansPage'

export const routesConfig: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'dealers',
        element: <DealerListPage />,
      },
      {
        path: 'dealers/:msisdn',
        element: <DealerDetailPage />,
      },
      {
        path: 'commissions',
        element: <CommissionConfigPage />,
      },
      {
        path: 'commissions/search',
        element: <CommissionSearchPage />,
      },
      {
        path: 'commissions/franchise-balance',
        element: <FranchiseAddBalancePage />,
      },
      {
        path: 'plans',
        element: <PlansPage />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="dealers" element={<DealerListPage />} />
        <Route path="dealers/:msisdn" element={<DealerDetailPage />} />
        <Route path="commissions" element={<CommissionConfigPage />} />
        <Route path="commissions/search" element={<CommissionSearchPage />} />
        <Route path="commissions/franchise-balance" element={<FranchiseAddBalancePage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}


