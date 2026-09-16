import { z } from 'zod'

// ==========================================
// 1. Plan Schema
// ==========================================

export const planSchema = z
  .object({
    operator: z
      .string()
      .trim()
      .min(1, 'Operator is required (e.g., BSNL)'),
    denomination: z
      .string()
      .trim()
      .min(1, 'Denomination is required')
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Denomination must be a positive number',
      }),
    talkvalue: z
      .string()
      .trim()
      .min(1, 'Talk value is required')
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Talk value must be a non-negative number',
      }),
    country: z
      .string()
      .trim()
      .min(1, 'Country is required'),
    start_date: z
      .string()
      .trim()
      .min(1, 'Start date is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date format (YYYY-MM-DD)',
      }),
    end_date: z
      .string()
      .trim()
      .min(1, 'End date is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid end date format (YYYY-MM-DD)',
      }),
    type: z
      .string()
      .trim()
      .min(1, 'Plan type is required (e.g., STV, Unlimited, TopUp)'),
    description: z
      .string()
      .trim()
      .min(3, 'Description must be at least 3 characters'),
    tab_name: z
      .string()
      .trim()
      .min(1, 'Tab designation is required (e.g., STV, PV, TopUp)'),
    circle: z
      .string()
      .trim()
      .min(1, 'Telecom circle is required'),
    validity: z
      .string()
      .trim()
      .min(1, 'Validity in days is required')
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Validity must be a non-negative integer (days)',
      }),
    from_date: z
      .string()
      .trim()
      .min(1, 'From date is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid from date format (YYYY-MM-DD)',
      }),
    to_date: z
      .string()
      .trim()
      .min(1, 'To date is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid to date format (YYYY-MM-DD)',
      }),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date)
      }
      return true
    },
    {
      message: 'End date cannot be prior to start date',
      path: ['end_date'],
    }
  )

export type PlanFormValues = z.infer<typeof planSchema>

// ==========================================
// 2. Denomination Schema
// ==========================================

export const denominationSchema = z.object({
  rechargePlanName: z
    .string()
    .trim()
    .min(2, 'Plan name must be at least 2 characters'),
  planType: z
    .string()
    .trim()
    .min(1, 'Plan type is required'),
  price: z
    .string()
    .trim()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Price must be greater than 0',
    }),
  createdBy: z
    .string()
    .trim(),
  validity: z
    .string()
    .trim()
    .min(1, 'Validity is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Validity must be non-negative',
    }),
  description: z
    .string()
    .trim()
    .min(3, 'Description must be at least 3 characters'),
  bundleName: z
    .string()
    .trim()
    .min(1, 'Bundle name is required'),
  bucketId: z
    .string()
    .trim()
    .min(1, 'Bucket ID is required'),
  faceValue: z
    .string()
    .trim()
    .min(1, 'Face value is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Face value must be a valid number',
    }),
  netValue: z
    .string()
    .trim()
    .min(1, 'Net value is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Net value must be a valid number',
    }),
  cardGroup: z
    .string()
    .trim(),
  varepDenom: z
    .string()
    .trim(),
  circleId: z
    .union([z.string(), z.number()])
    .refine((val) => String(val).trim() !== '' && Number(val) > 0, {
      message: 'A valid circle must be selected',
    }),
  vasDenom: z
    .string()
    .trim(),
  varepGroup: z
    .string()
    .trim(),
})

export type DenominationFormValues = z.infer<typeof denominationSchema>

// ==========================================
// 3. MNP Schema
// ==========================================

export const mnpSchema = z.object({
  msisdn: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number starting with 6-9'),
  recipientNo: z
    .string()
    .trim()
    .min(2, 'Recipient routing number must be at least 2 characters')
    .max(15, 'Recipient routing number cannot exceed 15 characters'),
  circleId: z
    .union([z.string(), z.number()])
    .refine((val) => String(val).trim() !== '' && Number(val) > 0, {
      message: 'A valid circle must be selected',
    }),
  username: z
    .string()
    .trim(),
})

export type MnpFormValues = z.infer<typeof mnpSchema>

// ==========================================
// 4. Number Series Schema
// ==========================================

export const numberSeriesSchema = z.object({
  numberSeries: z
    .string()
    .trim()
    .regex(/^\d{3,10}$/, 'Series prefix must be between 3 and 10 digits (e.g., 94400)'),
  circleId: z
    .union([z.string(), z.number()])
    .refine((val) => String(val).trim() !== '' && Number(val) > 0, {
      message: 'A valid circle must be selected',
    }),
  inId: z
    .string()
    .trim()
    .min(1, 'IN Platform ID is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'IN Platform ID must be a positive integer',
    }),
  numberSeriesId: z
    .string()
    .trim(),
  username: z
    .string()
    .trim(),
})

export type NumberSeriesFormValues = z.infer<typeof numberSeriesSchema>
