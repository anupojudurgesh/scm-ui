import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DataTable, type DataTableColumn } from '@/components/tables/DataTable'
import { SearchToolbar } from '@/components/tables/SearchToolbar'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { ZoneSelector } from '@/components/forms/ZoneSelector'
import { CircleSelector } from '@/components/forms/CircleSelector'
import { SSASelector } from '@/components/forms/SSASelector'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useUsersListQuery, type User } from '@/api/user.api'
import { Shield, Eye, Edit3, UserCheck, AlertCircle, UserPlus } from 'lucide-react'
import { CreateUserForm } from './CreateUserForm'

export function UserListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreateModal, setShowCreateModal] = React.useState(false)

  // Query parameter state
  const search = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''
  const role = searchParams.get('role') || ''
  const zoneId = searchParams.get('zoneId') || ''
  const circleId = searchParams.get('circleId') || ''
  const ssaId = searchParams.get('ssaId') || ''
  const page = Number(searchParams.get('page')) || 1
  const pageSize = 10

  // Selected user for View/Edit modal
  const [activeUser, setActiveUser] = React.useState<User | null>(null)
  const [modalMode, setModalMode] = React.useState<'view' | 'edit' | null>(null)

  // TanStack Query for User list
  const { data, isLoading, isError, refetch } = useUsersListQuery({
    search,
    status,
    role,
    zoneId,
    circleId,
    ssaId,
    page,
    pageSize,
  })

  // Handlers for URL search params synchronization
  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams)
    if (newQuery) {
      params.set('q', newQuery)
    } else {
      params.delete('q')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val) {
      params.set(key, val)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleZoneChange = (newZone: string) => {
    const params = new URLSearchParams(searchParams)
    if (newZone) {
      params.set('zoneId', newZone)
    } else {
      params.delete('zoneId')
    }
    params.delete('circleId')
    params.delete('ssaId')
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleCircleChange = (newCircle: string) => {
    const params = new URLSearchParams(searchParams)
    if (newCircle) {
      params.set('circleId', newCircle)
    } else {
      params.delete('circleId')
    }
    params.delete('ssaId')
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleSsaChange = (newSsa: string) => {
    const params = new URLSearchParams(searchParams)
    if (newSsa) {
      params.set('ssaId', newSsa)
    } else {
      params.delete('ssaId')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleReset = () => {
    setSearchParams(new URLSearchParams())
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  const columns: DataTableColumn<User>[] = [
    {
      id: 'username',
      header: 'Username',
      cell: (user) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
            {user.username}
          </span>
        </div>
      ),
    },
    {
      id: 'hrmsId',
      header: 'HRMS ID',
      cell: (user) => (
        <span className="text-xs font-medium text-slate-600 font-sans">
          {user.hrmsId}
        </span>
      ),
    },
    {
      id: 'fullName',
      header: 'First / Last Name',
      cell: (user) => (
        <span className="text-xs sm:text-sm text-slate-800">
          {user.firstName} {user.lastName}
        </span>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (user) => (
        <span className="text-xs text-slate-700 font-medium">
          {user.roleName}
        </span>
      ),
    },
    {
      id: 'jurisdiction',
      header: 'Jurisdiction (Zone / Circle / SSA)',
      cell: (user) => (
        <div className="text-xs text-slate-700 leading-tight">
          <span className="font-medium text-slate-900">{user.zoneName}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span>{user.circleName}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-500">{user.ssaName}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (user) => <StatusBadge status={user.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (user) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveUser(user)
              setModalMode('view')
            }}
            className="h-7 px-2 text-xs text-slate-700 border-slate-200 hover:bg-slate-100"
            data-testid={`user-view-${user.username}`}
            aria-label={`View user ${user.username}`}
          >
            <Eye className="h-3 w-3 mr-1 text-slate-400" />
            View
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveUser(user)
              setModalMode('edit')
            }}
            className="h-7 px-2 text-xs text-cyan-700 border-slate-200 hover:bg-cyan-50 hover:border-cyan-300"
            data-testid={`user-edit-${user.username}`}
            aria-label={`Edit user ${user.username}`}
          >
            <Edit3 className="h-3 w-3 mr-1 text-cyan-600" />
            Edit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PermissionGuard
      permission="userPermissions"
      fallback={
        <div
          className="p-8 max-w-lg mx-auto mt-12 text-center rounded-lg border border-slate-200 bg-white space-y-3"
          data-testid="user-permission-denied"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500">
            You do not possess the required <code className="text-slate-700">userPermissions</code> grant to view or administer SCM operator accounts.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="user-list-page">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Search, inspect HRMS operator records, and configure RBAC authorization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5"
              data-testid="limitation-note"
            >
              <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Simulated list query • Awaiting backend count/search API</span>
            </span>

            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="h-8 px-3 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs"
              data-testid="btn-create-user-open"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              <span>Create User</span>
            </Button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
          <SearchToolbar
            onSearch={handleSearch}
            placeholder="Search by username, HRMS, name..."
            defaultValue={search}
            onReset={handleReset}
          >
            {/* Status Filter Dropdown */}
            <select
              value={status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              aria-label="Filter by Status"
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              data-testid="user-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
              <option value="Blocked">Blocked</option>
            </select>

            {/* Role Filter Dropdown */}
            <select
              value={role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              aria-label="Filter by Role"
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              data-testid="user-role-filter"
            >
              <option value="">All Roles</option>
              <option value="System Administrator">System Administrator</option>
              <option value="Circle Manager">Circle Manager</option>
              <option value="Finance Officer">Finance Officer</option>
              <option value="Franchise Auditor">Franchise Auditor</option>
              <option value="Support Operator">Support Operator</option>
            </select>

            {/* Cascading Zone, Circle, SSA Selectors */}
            <div className="w-28 sm:w-32">
              <ZoneSelector
                value={zoneId}
                onChange={handleZoneChange}
                placeholder="All Zones"
                className="h-9 text-xs"
              />
            </div>

            <div className="w-28 sm:w-32">
              <CircleSelector
                zoneId={zoneId}
                value={circleId}
                onChange={handleCircleChange}
                placeholder="All Circles"
                className="h-9 text-xs"
              />
            </div>

            <div className="w-28 sm:w-32">
              <SSASelector
                circleId={circleId}
                value={ssaId}
                onChange={handleSsaChange}
                placeholder="All SSAs"
                className="h-9 text-xs"
              />
            </div>
          </SearchToolbar>
        </div>

        {/* User Data Table */}
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          error={isError ? 'Failed to fetch users. Please retry.' : null}
          onRetry={() => refetch()}
          emptyMessage="No users found matching the selected filters."
          pagination={{
            page: data?.page ?? 1,
            pageSize: data?.pageSize ?? 10,
            totalCount: data?.totalCount ?? 0,
            onPageChange: handlePageChange,
          }}
          className="bg-white rounded-lg border border-slate-200/80 shadow-xs"
        />

        {/* View / Edit User Modal */}
        {activeUser && (
          <Dialog
            open={Boolean(activeUser)}
            onOpenChange={(open) => {
              if (!open) {
                setActiveUser(null)
                setModalMode(null)
              }
            }}
          >
            <DialogContent className="max-w-md bg-white border-slate-200">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-cyan-600" />
                  <DialogTitle className="text-base font-bold font-heading">
                    {modalMode === 'edit' ? 'Modify User Profile' : 'User Details'}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  {modalMode === 'edit'
                    ? `Update settings for ${activeUser.username} (${activeUser.hrmsId})`
                    : `Account profile and jurisdiction for ${activeUser.username}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Username</span>
                    <span className="font-semibold text-slate-900">{activeUser.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">HRMS ID</span>
                    <span className="font-semibold text-slate-900 font-sans">{activeUser.hrmsId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Full Name</span>
                    <span className="text-slate-800">{activeUser.firstName} {activeUser.lastName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Role</span>
                    <span className="text-slate-800">{activeUser.roleName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mobile</span>
                    <span className="text-slate-800">{activeUser.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status</span>
                    <StatusBadge status={activeUser.status} />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="text-slate-400 block mb-1">Assigned Jurisdiction</span>
                  <p className="text-slate-800 font-medium">
                    {activeUser.zoneName} &bull; {activeUser.circleName} &bull; {activeUser.ssaName}
                  </p>
                  {activeUser.address && (
                    <p className="text-slate-500 mt-1">{activeUser.address}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="user-modal-close"
                  onClick={() => {
                    setActiveUser(null)
                    setModalMode(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Create User Dialog */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-600" />
                <DialogTitle className="text-base font-bold font-heading">
                  Create New Operator
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Provision a new administrative or operational account with HRMS credentials and RBAC permissions.
              </DialogDescription>
            </DialogHeader>

            <CreateUserForm
              onSuccess={() => {
                setShowCreateModal(false)
                refetch()
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  )
}
