import { z } from 'zod'

export const PERMISSION_KEYS = [
  'dealerPermissions',
  'walletPermissions',
  'userPermissions',
  'commissionPermissions',
  'plansNumberpermissions',
  'reportsPermissions',
  'stockCheck',
  'dealerMpinReset',
  'franchiseAddBalance',
  'bulkRecharge',
  'varepReports',
  'userActivityReports',
  'dealerStatus',
  'transactionStatus',
  'topupReversal',
  'simSaleUpload',
  'simInventory',
  'pendingClearence',
  'inReconsilation',
  'mobileApp',
  'deferredCommission',
  'cbp',
  'simUpgrade',
  'mnp',
  'frcStv',
  'bulk_purge',
  'e_auction',
  'denominations',
  'prepaidCommissions',
  'postpaidCommissions',
  'landlineCommissions',
  'FOSCreation',
] as const

export type UserPermissionField = (typeof PERMISSION_KEYS)[number]

export interface PermissionGroupConfig {
  title: string;
  description: string;
  keys: {
    key: UserPermissionField;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroupConfig[] = [
  {
    title: 'Core Administration',
    description: 'System-wide administrative privileges and entity management',
    keys: [
      {
        key: 'userPermissions',
        label: 'User Management',
        description: 'Create, modify, and assign permissions for SCM operator accounts',
      },
      {
        key: 'dealerPermissions',
        label: 'Dealer Administration',
        description: 'Franchise and retailer onboarding, hierarchy, and scoping',
      },
      {
        key: 'dealerStatus',
        label: 'Dealer Status Control',
        description: 'Activate, suspend, or block dealer and franchise access',
      },
      {
        key: 'dealerMpinReset',
        label: 'Dealer MPIN Reset',
        description: 'Initiate OTP-gated security MPIN resets for POS terminals',
      },
      {
        key: 'plansNumberpermissions',
        label: 'Plans & Numbers',
        description: 'Manage tariff plans, denominations, and MSISDN series',
      },
      {
        key: 'FOSCreation',
        label: 'FOS Creation',
        description: 'Onboard and assign Field Operations Staff to territories',
      },
    ],
  },
  {
    title: 'Dealer & Wallet Operations',
    description: 'Franchise balance, wallet clearance, and reconciliation',
    keys: [
      {
        key: 'walletPermissions',
        label: 'Wallet Access',
        description: 'View and manage dealer C-TOPUP wallet accounts',
      },
      {
        key: 'franchiseAddBalance',
        label: 'Franchise Balance Top-Up',
        description: 'Approve or reject franchise credit top-up requests',
      },
      {
        key: 'bulkRecharge',
        label: 'Bulk Recharge',
        description: 'Execute automated bulk CTOPUP airtime transactions',
      },
      {
        key: 'topupReversal',
        label: 'Top-Up Reversal',
        description: 'Authorize chargeback and erroneous recharge reversals',
      },
      {
        key: 'pendingClearence',
        label: 'Pending Clearance',
        description: 'Audit and release held or flagged dealer transactions',
      },
      {
        key: 'inReconsilation',
        label: 'In-Reconciliation',
        description: 'Bank payment and wallet reconciliation workflow',
      },
    ],
  },
  {
    title: 'Commission Types',
    description: 'Commission calculation rules and tariff matrices',
    keys: [
      {
        key: 'commissionPermissions',
        label: 'Master Commissions',
        description: 'Configure global franchise and dealer commission structures',
      },
      {
        key: 'prepaidCommissions',
        label: 'Prepaid FRC & OTF',
        description: 'Define First Recharge and On-The-Fly incentives',
      },
      {
        key: 'postpaidCommissions',
        label: 'Postpaid Commission',
        description: 'Manage postpaid postpaid activation and bill payout rules',
      },
      {
        key: 'landlineCommissions',
        label: 'Landline Commission',
        description: 'Configure FTTH and landline connection payout tables',
      },
      {
        key: 'deferredCommission',
        label: 'Deferred Commission',
        description: 'Configure milestone-based staggered payout schedules',
      },
      {
        key: 'denominations',
        label: 'Denomination Configuration',
        description: 'Map recharge face values to dealer incentive slabs',
      },
    ],
  },
  {
    title: 'SIM & Inventory',
    description: 'SIM card stock, provisioning, and logistics workflows',
    keys: [
      {
        key: 'stockCheck',
        label: 'Stock Inquiry',
        description: 'Real-time inventory levels across regional warehouses',
      },
      {
        key: 'simSaleUpload',
        label: 'SIM Sale Upload',
        description: 'Batch upload ICCID and IMSI allocation manifests',
      },
      {
        key: 'simInventory',
        label: 'SIM Inventory',
        description: 'Track SIM lifecycle from warehouse dispatch to retail activation',
      },
      {
        key: 'simUpgrade',
        label: 'SIM Upgrade',
        description: 'Process 3G to 4G/5G swap requests and paired IMSI updates',
      },
      {
        key: 'mnp',
        label: 'MNP Processing',
        description: 'Process port-in and port-out UPC clearance requests',
      },
      {
        key: 'frcStv',
        label: 'FRC & STV Allocation',
        description: 'Authorize special tariff bundle provisioning on new SIMs',
      },
    ],
  },
  {
    title: 'Reports & Activity',
    description: 'Telemetry, compliance audit feeds, and analytics',
    keys: [
      {
        key: 'reportsPermissions',
        label: 'Reports Dashboard',
        description: 'Generate operational, sales, and activation reports',
      },
      {
        key: 'varepReports',
        label: 'VAREP Compliance',
        description: 'Generate regulatory audit logs for statutory compliance',
      },
      {
        key: 'userActivityReports',
        label: 'User Activity Logs',
        description: 'Inspect detailed operator audit trails and timestamped actions',
      },
      {
        key: 'transactionStatus',
        label: 'Transaction Telemetry',
        description: 'Real-time transaction status inquiry across backend gateways',
      },
    ],
  },
  {
    title: 'Advanced & System Tools',
    description: 'Billing interface, number allocation, and batch maintenance',
    keys: [
      {
        key: 'mobileApp',
        label: 'Mobile App Gateway',
        description: 'Configure API endpoints for retail agent mobile app',
      },
      {
        key: 'cbp',
        label: 'Core Billing (CBP)',
        description: 'Direct interface with Core Billing Platform for account queries',
      },
      {
        key: 'bulk_purge',
        label: 'Bulk Purge',
        description: 'Purge expired, reserved, or churned numbers in bulk',
      },
      {
        key: 'e_auction',
        label: 'E-Auction Numbers',
        description: 'Manage premium and vanity number allocation auctions',
      },
    ],
  },
]

export const createUserSchema = z.object({
  hrmsId: z
    .string()
    .trim()
    .min(3, 'HRMS ID must be at least 3 characters')
    .max(20, 'HRMS ID cannot exceed 20 characters')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'HRMS ID must contain only alphanumeric characters, dashes, or underscores'
    ),

  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(
      /^[A-Za-z0-9_@.-]+$/,
      'Username must contain only alphanumeric characters, dots, dashes, or underscores'
    ),

  mobileNumber: z
    .string()
    .trim()
    .regex(
      /^[6-9]\d{9}$/,
      'Mobile number must be a valid 10-digit Indian number starting with 6-9'
    ),

  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters'),

  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),

  address: z
    .string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(250, 'Address cannot exceed 250 characters'),

  dob: z
    .string()
    .trim()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const parts = val.split('-')
      if (parts.length !== 3) return false
      const date = new Date(val)
      if (isNaN(date.getTime())) return false
      // User must be at least 18 years old
      const today = new Date()
      const minAgeDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      )
      return date <= minAgeDate
    }, 'User must be at least 18 years of age (valid YYYY-MM-DD date)'),

  roleId: z
    .number({
      message: 'Role is required',
    })
    .min(1, 'Please select a valid role'),

  zoneId: z
    .number({
      message: 'Zone is required',
    })
    .min(1, 'Please select a valid zone'),

  circleId: z
    .number({
      message: 'Circle is required',
    })
    .min(1, 'Please select a valid circle'),

  ssaId: z
    .number({
      message: 'SSA is required',
    })
    .min(1, 'Please select a valid SSA'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password cannot exceed 50 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  status: z
    .enum(['Active', 'Inactive', 'Pending', 'Blocked'], {
      message: 'Please select a valid status',
    })
    .default('Active'),

  permissions: z
    .record(z.string(), z.boolean().optional())
    .default(() => ({})),
})

export type CreateUserFormValues = z.input<typeof createUserSchema>
export type CreateUserOutput = z.output<typeof createUserSchema>
