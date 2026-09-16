import { z } from 'zod'

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username or HRMS ID is required')
    .max(50, 'Username must be at most 50 characters')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
})

export type LoginFormData = z.infer<typeof loginSchema>
