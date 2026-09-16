import type { ReactNode } from 'react'
import { useAuthStore, type PermissionKey } from '@/stores/authStore'

export interface PermissionGuardProps {
  /** Permission key to evaluate against authStore */
  permission: PermissionKey | string;
  /** Content rendered when the user has the required permission */
  children: ReactNode;
  /** Optional fallback content rendered when permission is denied */
  fallback?: ReactNode;
}

/**
 * Conditional wrapper that renders its children only if the authenticated user
 * has the required permission in authStore.
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const isAllowed = hasPermission(permission)

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
