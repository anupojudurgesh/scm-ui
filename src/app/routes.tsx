import { Routes, Route, Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { DashboardPage } from '@/features/dashboard'
import { UsersPage } from '@/features/users/UsersPage'
import { DealersPage } from '@/features/dealers/DealersPage'
import { CommissionsPage } from '@/features/commissions/CommissionsPage'
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
        element: <DealersPage />,
      },
      {
        path: 'commissions',
        element: <CommissionsPage />,
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
        <Route path="dealers" element={<DealersPage />} />
        <Route path="commissions" element={<CommissionsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
