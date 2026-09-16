import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, ShieldCheck, Radio, ArrowRight, Loader2 } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    // Simulate brief network authentication roundtrip
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Grant all 33 operator permissions on login for admin/operator access
    setAuth(
      {
        userId: 1001,
        username: data.username,
        hrmsId: data.username.toUpperCase(),
        mobileNumber: '9876543210',
        firstName: 'System',
        lastName: 'Operator',
        roleId: 1,
        roleName: 'System Administrator',
        zoneId: 1,
        circleId: 1,
        ssaId: 1,
      },
      {
        dealerPermissions: 1,
        walletPermissions: 1,
        userPermissions: 1,
        commissionPermissions: 1,
        plansNumberpermissions: 1,
        reportsPermissions: 1,
        stockCheck: 1,
        dealerMpinReset: 1,
        franchiseAddBalance: 1,
        bulkRecharge: 1,
        varepReports: 1,
        userActivityReports: 1,
        dealerStatus: 1,
        transactionStatus: 1,
        topupReversal: 1,
        simSaleUpload: 1,
        simInventory: 1,
        pendingClearence: 1,
        inReconsilation: 1,
        mobileApp: 1,
        deferredCommission: 1,
        cbp: 1,
        simUpgrade: 1,
        mnp: 1,
        frcStv: 1,
        bulk_purge: 1,
        e_auction: 1,
        caf_postpaid: 1,
        denominations: 1,
        prepaidCommissions: 1,
        postpaidCommissions: 1,
        landlineCommissions: 1,
        FOSCreation: 1,
      }
    )

    setIsSubmitting(false)
    navigate('/dashboard')
  }

  const fillDemoCredentials = () => {
    setValue('username', 'admin_dev')
    setValue('password', 'Admin@12345')
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#F8F9FB] font-sans antialiased" data-testid="login-page">
      {/* Left Column: Form Area (5 cols on lg) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white border-r border-slate-200/90 shadow-sm z-10">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F172A] text-white shadow-xs">
              <Radio className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[#0F172A] font-heading">
                SCM Portal
              </span>
              <span className="block text-[10px] font-medium text-slate-400 -mt-0.5">
                Telecom Operations Platform
              </span>
            </div>
          </div>
        </div>

        {/* Main Sign-In Form */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto">
          <div className="space-y-1.5 mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-heading">
              Operator Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Enter your authorized HRMS ID and credentials to access network operations.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
            {/* Username / HRMS ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 font-heading"
              >
                Username or HRMS ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. admin_dev or HRMS20914"
                  data-testid="input-username"
                  className={cn(
                    'w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors duration-150',
                    errors.username
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                  )}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="text-[11px] text-rose-600 mt-1" data-testid="error-username">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 font-heading"
                >
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Min 6 characters
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="input-password"
                  className={cn(
                    'w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-lg border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors duration-150',
                    errors.password
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 mt-1" data-testid="error-password">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  {...register('rememberMe')}
                />
                <span className="text-xs text-slate-600">Keep session active</span>
              </label>

              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none"
                data-testid="quick-fill-btn"
              >
                Fill demo login
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#090D16] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm transition-colors duration-150 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              All operational mutations require cryptographic two-factor OTP authorization on registered MSISDN.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Enterprise NOC v0.1.0</span>
          <span>Restricted Telecom Access</span>
        </div>
      </div>

      {/* Right Column: Visual Hero Panel (7 cols on lg) */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-10 xl:p-14 bg-[#0B1120] text-white relative overflow-hidden">
        {/* Subtle Background Geometric Grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#38BDF8 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Eyebrow & Status */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] tracking-wider uppercase font-semibold text-emerald-400 font-heading">
              National Core Network
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            GATEWAY NODE: 10069
          </div>
        </div>

        {/* Central Architectural SVG Diagram: Zone -> Circle -> SSA Hierarchy */}
        <div className="relative z-10 my-auto py-6 max-w-xl mx-auto w-full">
          <div className="text-center mb-6">
            <span className="inline-block text-[10px] font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 border border-cyan-800/50 px-2.5 py-1 rounded-full mb-3">
              Topology Hierarchy
            </span>
            <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-slate-100 font-heading">
              Supply Chain & Channel Governance
            </h2>
            <p className="text-xs xl:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Unified operations console for dealer networks, multi-tier commission management, and subscriber provisioning across circles.
            </p>
          </div>

          {/* SVG Diagram: Connected Nodes representing Zone -> Circle -> SSA */}
          <div className="relative rounded-xl border border-slate-800/80 bg-[#0F172A]/70 p-6 backdrop-blur-xs shadow-2xl">
            <svg
              viewBox="0 0 540 220"
              className="w-full h-auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Connection Lines with Pulsing Gradients */}
              <path
                d="M270 45 L110 115"
                stroke="#1E3A8A"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d="M270 45 L270 115"
                stroke="#2563EB"
                strokeWidth="2"
              />
              <path
                d="M270 45 L430 115"
                stroke="#1E3A8A"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Sub-connections to SSAs */}
              <path d="M110 135 L65 185" stroke="#334155" strokeWidth="1.5" />
              <path d="M110 135 L145 185" stroke="#334155" strokeWidth="1.5" />
              <path d="M270 135 L230 185" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="2 2" />
              <path d="M270 135 L310 185" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="2 2" />
              <path d="M430 135 L395 185" stroke="#334155" strokeWidth="1.5" />
              <path d="M430 135 L475 185" stroke="#334155" strokeWidth="1.5" />

              {/* Central Zone Node (National Core) */}
              <circle cx="270" cy="45" r="24" fill="#1E293B" stroke="#3B82F6" strokeWidth="2.5" />
              <circle cx="270" cy="45" r="32" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.3" />
              <circle cx="270" cy="45" r="8" fill="#60A5FA" />
              <text x="270" y="24" textAnchor="middle" fill="#93C5FD" fontSize="10" fontWeight="700" letterSpacing="0.5">
                NATIONAL ZONE CORE
              </text>

              {/* Circle Gateways (Regional Tier) */}
              {/* West Circle */}
              <circle cx="110" cy="125" r="16" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
              <circle cx="110" cy="125" r="5" fill="#94A3B8" />
              <text x="110" y="102" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="600">
                West Circle
              </text>

              {/* North Circle (Active Hub) */}
              <circle cx="270" cy="125" r="18" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" />
              <circle cx="270" cy="125" r="6" fill="#38BDF8" />
              <text x="270" y="102" textAnchor="middle" fill="#38BDF8" fontSize="10" fontWeight="700">
                North Circle (Primary)
              </text>

              {/* South Circle */}
              <circle cx="430" cy="125" r="16" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
              <circle cx="430" cy="125" r="5" fill="#94A3B8" />
              <text x="430" y="102" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="600">
                South Circle
              </text>

              {/* SSA Distribution Nodes */}
              <rect x="50" y="185" width="30" height="16" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <text x="65" y="196" textAnchor="middle" fill="#94A3B8" fontSize="8">SSA-1</text>

              <rect x="130" y="185" width="30" height="16" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <text x="145" y="196" textAnchor="middle" fill="#94A3B8" fontSize="8">SSA-2</text>

              <rect x="215" y="185" width="32" height="16" rx="3" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="1" />
              <text x="231" y="196" textAnchor="middle" fill="#93C5FD" fontSize="8" fontWeight="600">SSA-DEL</text>

              <rect x="295" y="185" width="32" height="16" rx="3" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="1" />
              <text x="311" y="196" textAnchor="middle" fill="#93C5FD" fontSize="8" fontWeight="600">SSA-HR</text>

              <rect x="380" y="185" width="30" height="16" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <text x="395" y="196" textAnchor="middle" fill="#94A3B8" fontSize="8">SSA-4</text>

              <rect x="460" y="185" width="30" height="16" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <text x="475" y="196" textAnchor="middle" fill="#94A3B8" fontSize="8">SSA-5</text>
            </svg>

            {/* Architecture Highlights */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-sm xl:text-base font-extrabold text-slate-100 font-sans">
                  28
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Operating Circles
                </span>
              </div>
              <div>
                <span className="block text-sm xl:text-base font-extrabold text-slate-100 font-sans">
                  33
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  RBAC Bitmasks
                </span>
              </div>
              <div>
                <span className="block text-sm xl:text-base font-extrabold text-emerald-400 font-sans">
                  100%
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  OTP Governed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Footnote */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500">
          <span>Telecommunication Network Operations System</span>
          <span>Security Level: Operational Core</span>
        </div>
      </div>
    </div>
  )
}
