import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/**
 * Wraps any route that requires authentication.
 * - If the user is authenticated, renders the matched child route via <Outlet />.
 * - If not, redirects to /login and preserves the intended destination as a
 *   `?redirect=` query parameter so LoginPage can navigate back after sign-in.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }

  return <Outlet />
}
