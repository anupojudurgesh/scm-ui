import { z } from 'zod'

const indianMobileRegex = /^[6-9]\d{9}$/
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
const aadhaarRegex = /^\d{12}$/
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// -------------------------------------------------------------
// 1. Create Dealer Schema
// -------------------------------------------------------------

export const createDealerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  mobile: z
    .string()
    .trim()
    .regex(indianMobileRegex, 'Please enter a valid 10-digit Indian mobile number (starts with 6-9)'),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((dateStr) => {
      const parsed = new Date(dateStr)
      if (isNaN(parsed.getTime())) return false
      // Must be at least 18 years old
      const today = new Date()
      const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      return parsed <= minAgeDate
    }, {
      message: 'Dealer principal must be at least 18 years of age',
    }),
  address: z
    .string()
    .trim()
    .min(5, 'Physical address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  dealerType: z.string().min(1, 'Please select a Dealer Type'),
  circleId: z.string().min(1, 'Please select a Circle'),
  ssaId: z.string().min(1, 'Please select an SSA'),
  category: z.string().min(1, 'Please select a Category'),
  aadhaarId: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || aadhaarRegex.test(val), {
      message: 'Aadhaar ID must be exactly 12 numeric digits',
    }),
  panId: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .refine((val) => !val || panRegex.test(val), {
      message: 'PAN must follow standard format (e.g., ABCDE1234F)',
    }),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .refine((val) => !val || gstinRegex.test(val), {
      message: 'Invalid GSTIN format (15 characters alphanumeric)',
    }),
  certificate: z
    .any()
    .optional(),
})

export type CreateDealerFormValues = z.infer<typeof createDealerSchema>

// -------------------------------------------------------------
// 2. Update Dealer Schema
// -------------------------------------------------------------

export const updateDealerSchema = z.object({
  dealerId: z.union([z.string(), z.number()]),
  dealerCode: z.string().min(1, 'Dealer code is required'),
  scmMsisdn: z.string().regex(indianMobileRegex, 'Valid 10-digit mobile number required'),
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().trim().optional(),
  address: z.string().trim().min(5, 'Address must be at least 5 characters').optional(),
  dob: z.string().optional(),
  status: z.string().optional(),
})

export type UpdateDealerFormValues = z.infer<typeof updateDealerSchema>

// -------------------------------------------------------------
// 3. Change Hierarchy Schema
// -------------------------------------------------------------

export const changeHierarchySchema = z.object({
  srcMsisdn: z
    .string()
    .trim()
    .regex(indianMobileRegex, 'Source dealer mobile must be a valid 10-digit Indian number'),
  parentMsisdn: z
    .string()
    .trim()
    .regex(indianMobileRegex, 'Target parent mobile must be a valid 10-digit Indian number'),
  type: z.string().min(1, 'Please specify transfer tier type'),
}).refine((data) => data.srcMsisdn !== data.parentMsisdn, {
  message: 'Source and target parent MSISDN cannot be identical',
  path: ['parentMsisdn'],
})

export type ChangeHierarchyFormValues = z.infer<typeof changeHierarchySchema>
