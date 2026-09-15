import { ShieldCheck, Network, Layers, Users, PhoneCall, RefreshCw } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">SCM Portal</h1>
              <p className="text-xs font-medium text-slate-500">Supply Chain & Dealer Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Enterprise Administration</h2>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Integrated administration platform for User Access, Multi-tier Dealer Networks, Product Plans & Denominations, and Commission Matrix rules.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Security OTP Guard
              </button>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: User Management */}
          <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500/50 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">User Management</h3>
            <p className="mt-1 text-sm text-slate-500">
              HRMS authentication, 38-bitmask permission matrix, status, and zone/circle access control.
            </p>
          </div>

          {/* Card 2: Dealer Management */}
          <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Network className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Dealer Hierarchy</h3>
            <p className="mt-1 text-sm text-slate-500">
              Franchise, Sub-Franchise, and Retailer onboarding, tree hierarchy reassignment, and MPIN reset.
            </p>
          </div>

          {/* Card 3: Plan & Number Config */}
          <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-purple-500/50 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Plans & Number Series</h3>
            <p className="mt-1 text-sm text-slate-500">
              Product catalog, zone-scoped denominations, MNP routing, and telecom number series registry.
            </p>
          </div>

          {/* Card 4: Commission Matrix */}
          <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-500/50 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Commission Rules</h3>
            <p className="mt-1 text-sm text-slate-500">
              Prepaid FRC/OTF formulas, Postpaid tier caps, Landline brackets, and Franchise balance approvals.
            </p>
          </div>
        </div>

        {/* System Architecture Quick Banner */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              <div>
                <h4 className="text-sm font-semibold">Geographic Scoping Active</h4>
                <p className="text-xs text-slate-400">Zone → Circle → SSA hierarchical dependency cascade enabled.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="rounded bg-slate-800 px-2 py-1">React 19</span>
              <span className="rounded bg-slate-800 px-2 py-1">Tailwind v4</span>
              <span className="rounded bg-slate-800 px-2 py-1">TanStack Query v5</span>
              <span className="rounded bg-slate-800 px-2 py-1">TypeScript 6</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
