export function CommissionsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="commissions-page">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
          Commission Rules & Approvals
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure Prepaid FRC/OTF formulas, Postpaid tier caps, and Franchise balance approval workflows.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Commission rule matrices and approval modules are configured and ready for integration.
      </div>
    </div>
  )
}
