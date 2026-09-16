import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DataTable, type DataTableColumn } from '@/components/tables/DataTable'
import { SearchToolbar } from '@/components/tables/SearchToolbar'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  useDealersListQuery,
  useDealerTypesQuery,
  type Dealer,
} from '@/api/dealer.api'
import { useAllCirclesQuery } from '@/api/masterdata.api'
import {
  Shield,
  Eye,
  Plus,
  Network,
  Building2,
  Store,
  Briefcase,
} from 'lucide-react'

import { CreateDealerForm } from './CreateDealerForm'

export function DealerListPage() {
  const navigate = useNavigate()

  // Filter States
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all')
  const [selectedType, setSelectedType] = React.useState<string>('all')
  const [selectedCircleId, setSelectedCircleId] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  // Master Data Queries
  const { data: circles = [] } = useAllCirclesQuery()
  const { data: dealerTypes = [] } = useDealerTypesQuery()

  // Dealers Query
  const {
    data: paginatedData,
    isLoading,
    refetch,
  } = useDealersListQuery({
    search: searchQuery,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    dealerType: selectedType !== 'all' ? selectedType : undefined,
    circleId: selectedCircleId !== 'all' ? selectedCircleId : undefined,
    page,
    pageSize,
  })

  const dealers = paginatedData?.dealers ?? []

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStatus('all')
    setSelectedType('all')
    setSelectedCircleId('all')
    setPage(1)
  }

  // Type Badge Helper
  const renderTypeBadge = (typeName?: string, typeId?: string | number) => {
    const name = typeName || `Type ${typeId}`
    const lower = name.toLowerCase()

    if (lower.includes('franchise') && !lower.includes('sub')) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[11px]">
          <Building2 className="h-3 w-3" />
          {name}
        </Badge>
      )
    }
    if (lower.includes('sub-franchise')) {
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1 text-[11px]">
          <Network className="h-3 w-3" />
          {name}
        </Badge>
      )
    }
    if (lower.includes('retailer')) {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px]">
          <Store className="h-3 w-3" />
          {name}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1 text-[11px]">
        <Briefcase className="h-3 w-3" />
        {name}
      </Badge>
    )
  }

  // Columns definition
  const columns: DataTableColumn<Dealer>[] = [
    {
      id: 'dealerCode',
      header: 'Dealer Code',
      cell: (dealer) => (
        <span className="font-mono text-xs font-semibold text-slate-900" data-testid={`dealer-code-${dealer.dealerCode}`}>
          {dealer.dealerCode}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Principal Name',
      cell: (dealer) => (
        <div className="text-xs space-y-0.5">
          <span className="font-medium text-slate-900">
            {dealer.firstName} {dealer.lastName}
          </span>
          <div className="text-[11px] text-slate-500 font-mono">
            {dealer.mobile}
          </div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Tier Classification',
      cell: (dealer) => renderTypeBadge(dealer.dealerTypeName, dealer.dealerType),
    },
    {
      id: 'jurisdiction',
      header: 'Jurisdiction (Circle / SSA)',
      cell: (dealer) => (
        <div className="text-xs text-slate-700">
          <span className="font-medium text-slate-900">{dealer.circleName || `Circle ${dealer.circleId}`}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-500">{dealer.ssaName || `SSA ${dealer.ssaId}`}</span>
        </div>
      ),
    },
    {
      id: 'parent',
      header: 'Parent Distributor',
      cell: (dealer) => (
        <span className="text-xs text-slate-600 truncate max-w-44 block">
          {dealer.parentName || 'None (Direct Circle)'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (dealer) => <StatusBadge status={dealer.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (dealer) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dealers/${dealer.mobile || dealer.scmMsisdn}`)}
            className="h-7 px-2 text-xs text-cyan-700 border-slate-200 hover:bg-cyan-50 hover:border-cyan-300"
            data-testid={`view-dealer-btn-${dealer.mobile}`}
            aria-label={`View dealer ${dealer.dealerCode}`}
          >
            <Eye className="h-3 w-3 mr-1 text-cyan-600" />
            View / Manage
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PermissionGuard
      permission="dealerPermissions"
      fallback={
        <div
          className="p-8 max-w-lg mx-auto mt-12 text-center rounded-lg border border-slate-200 bg-white space-y-3"
          data-testid="dealer-permission-denied"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500">
            You do not possess the required <code className="text-slate-700">dealerPermissions</code> grant to view or administer franchise entities.
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="dealers-page">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Dealer Management
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                Channel Network
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage Franchises, Sub-Franchises, Retailers, tier structures, and KYC credentials.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-8"
            data-testid="create-dealer-btn"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Dealer
          </Button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
          <SearchToolbar
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val)
              setPage(1)
            }}
            placeholder="Search by name, dealer code, mobile, parent..."
            onReset={handleResetFilters}
            showResetButton={Boolean(
              searchQuery ||
                selectedStatus !== 'all' ||
                selectedType !== 'all' ||
                selectedCircleId !== 'all'
            )}
            data-testid="dealer-search-toolbar"
          >
            {/* Status Filter */}
            <div className="w-36">
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val ?? 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger
                  className="h-9 text-xs bg-white border-slate-200 text-slate-800"
                  data-testid="filter-status-select"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="w-40">
              <Select
                value={selectedType}
                onValueChange={(val) => {
                  setSelectedType(val ?? 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger
                  className="h-9 text-xs bg-white border-slate-200 text-slate-800"
                  data-testid="filter-type-select"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {dealerTypes.map((t) => (
                    <SelectItem key={t.dealerTypeId} value={String(t.dealerTypeId)}>
                      {t.dealerTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Circle Filter */}
            <div className="w-44">
              <Select
                value={selectedCircleId}
                onValueChange={(val) => {
                  setSelectedCircleId(val ?? 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger
                  className="h-9 text-xs bg-white border-slate-200 text-slate-800"
                  data-testid="filter-circle-select"
                >
                  <SelectValue placeholder="All Circles" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">All Circles</SelectItem>
                  {circles.map((c) => (
                    <SelectItem key={c.circleId} value={String(c.circleId)}>
                      {c.circleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SearchToolbar>
        </div>

        {/* Dealers DataTable */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={dealers}
            loading={isLoading}
            emptyMessage="No dealer or franchise entities found matching query criteria."
            data-testid="dealers-data-table"
          />
        </div>

        {/* Create Dealer Modal Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent
            className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
            data-testid="create-dealer-dialog"
          >
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Onboard New Channel Dealer
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Complete dealer registration, KYC attachment, and dispatch cryptographic OTP authorization.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <CreateDealerForm
              onSuccess={() => {
                setIsCreateOpen(false)
                refetch()
              }}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  )
}
