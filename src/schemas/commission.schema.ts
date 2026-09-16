import { z } from 'zod'

const numericString = (fieldLabel: string) =>
  z
    .string()
    .min(1, `${fieldLabel} is required`)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: `${fieldLabel} must be a valid positive number`,
    })

// 1. Prepaid FRC Schema
export const prepaidFrcSchema = z.object({
  categoryId: z.string().min(1, 'Please select a Category'),
  zoneId: z.string().optional(),
  circleId: z.string().min(1, 'Please select a Circle'),
  denomination: z
    .string()
    .min(1, 'Denomination is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Denomination must be greater than 0',
    }),
  sellerCommission: numericString('Seller Commission'),
  fraCommission: numericString('FRA Commission'),
  subCommission: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Sub Commission must be a valid positive number',
    }),
  tds: numericString('TDS'),
  masterCategoryId: z.string().optional(),
  commissionType: z.string().optional(),
  dtype: z.string().optional(),
})

export type PrepaidFrcFormValues = z.infer<typeof prepaidFrcSchema>

// 2. Prepaid OTF Schema
export const prepaidOtfSchema = z.object({
  categoryId: z.string().min(1, 'Please select a Category'),
  zoneId: z.string().min(1, 'Please select a Zone'),
  circleId: z.string().min(1, 'Please select a Circle'),
  denomination: z
    .string()
    .min(1, 'Denomination is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Denomination must be greater than 0',
    }),
  sellerCommission: numericString('Seller Commission'),
  fraCommission: numericString('FRA Commission'),
  subCommission: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Sub Commission must be a valid positive number',
    }),
  tds: numericString('TDS'),
  masterCategoryId: z.string().optional(),
  commissionType: z.string().optional(),
  dtype: z.string().optional(),
})

export type PrepaidOtfFormValues = z.infer<typeof prepaidOtfSchema>

// 3. Postpaid Schema
export const postpaidCommissionSchema = z.object({
  categoryId: z.string().min(1, 'Please select a Category'),
  zoneId: z.string().optional(),
  circleId: z.string().min(1, 'Please select a Circle'),
  tdsAmount: numericString('TDS Amount'),
  actualCommission: numericString('Actual Commission'),
  sellerLevel: z.string().min(1, 'Seller Level is required'),
  cap_limit: numericString('Cap Limit'),
  fraCommission: z.string().optional(),
  subFraCommission: z.number().optional(),
  retailerCommission: z.number().optional(),
})

export type PostpaidCommissionFormValues = z.infer<typeof postpaidCommissionSchema>

// 4. Landline Schema
export const landlineCommissionSchema = z
  .object({
    categoryId: z.string().min(1, 'Please select a Category'),
    zoneId: z.string().optional(),
    circleId: z.string().min(1, 'Please select a Circle'),
    fromAmount: numericString('From Amount'),
    toAmount: numericString('To Amount'),
    tdsAmount: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: 'TDS Amount must be a valid number',
      }),
    commissionAmount: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: 'Commission Amount must be a valid number',
      }),
    fraCommission: z.number().optional(),
    subFraCommission: z.number().optional(),
    retailerCommission: z.number().optional(),
    sellerLevel: z.string().optional(),
  })
  .refine(
    (data) => {
      const from = Number(data.fromAmount)
      const to = Number(data.toAmount)
      if (isNaN(from) || isNaN(to)) return true
      return to >= from
    },
    {
      message: 'To Amount must be greater than or equal to From Amount',
      path: ['toAmount'],
    }
  )

export type LandlineCommissionFormValues = z.infer<typeof landlineCommissionSchema>
