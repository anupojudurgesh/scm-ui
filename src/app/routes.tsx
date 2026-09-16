import { Routes, Route, Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { UsersPage } from '@/features/users/UsersPage'
import { DealerListPage, DealerDetailPage } from '@/features/dealers'
import {
  CommissionConfigPage,
  CommissionSearchPage,
  FranchiseAddBalancePage,
} from '@/features/commissions'
import {
  PlanListPage,
  DenominationConfigPage,
  MnpConfigPage,
  NumberSeriesPage,
} from '@/features/plans'

export const routesConfig: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
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
        element: <PlanListPage />,
      },
      {
        path: 'plans/denominations',
        element: <DenominationConfigPage />,
      },
      {
        path: 'plans/mnp',
        element: <MnpConfigPage />,
      },
      {
        path: 'plans/number-series',
        element: <NumberSeriesPage />,
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="dealers" element={<DealerListPage />} />
        <Route path="dealers/:msisdn" element={<DealerDetailPage />} />
        <Route path="commissions" element={<CommissionConfigPage />} />
        <Route path="commissions/search" element={<CommissionSearchPage />} />
        <Route path="commissions/franchise-balance" element={<FranchiseAddBalancePage />} />
        <Route path="plans" element={<PlanListPage />} />
        <Route path="plans/denominations" element={<DenominationConfigPage />} />
        <Route path="plans/mnp" element={<MnpConfigPage />} />
        <Route path="plans/number-series" element={<NumberSeriesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
