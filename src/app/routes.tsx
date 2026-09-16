import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
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

export function AppRoutes() {
  return (
    <Routes>
      {/* /login — redirect to /dashboard if already authenticated */}
      <Route path="/login" element={<LoginPage />} />

      {/* All app routes are protected — unauthenticated users are sent to /login */}
      <Route element={<ProtectedRoute />}>
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
      </Route>
    </Routes>
  )
}
