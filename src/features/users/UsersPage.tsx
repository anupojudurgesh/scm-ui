export function UsersPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="users-page">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
          User Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search, configure HRMS accounts, and administer 38-bitmask permission matrix.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        User management modules are configured and ready for integration.
      </div>
    </div>
  )
}
