import { describe, it, expect } from 'vitest'
import { createUserSchema, PERMISSION_KEYS, PERMISSION_GROUPS } from './user.schema'

describe('User Schema Validation (createUserSchema)', () => {
  const validUser = {
    hrmsId: 'HRMS1048',
    username: 'rajesh.kumar',
    mobileNumber: '9848022334',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    address: 'Telecom Bhavan, Saifabad, Hyderabad',
    dob: '1990-05-15',
    roleId: 2,
    zoneId: 2,
    circleId: 21,
    ssaId: 201,
    password: 'SecurePassword123',
    status: 'Active' as const,
    permissions: {
      userPermissions: true,
      dealerPermissions: true,
    },
  }

  it('validates a complete, compliant usercreation payload', () => {
    const result = createUserSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })

  it('fails when required basic fields are missing or empty', () => {
    const invalid = { ...validUser, hrmsId: '', firstName: '', lastName: '' }
    const result = createUserSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.hrmsId).toBeDefined()
      expect(fieldErrors.firstName).toBeDefined()
      expect(fieldErrors.lastName).toBeDefined()
    }
  })

  it('enforces Indian 10-digit mobile number format starting with 6-9', () => {
    // Too short
    expect(createUserSchema.safeParse({ ...validUser, mobileNumber: '12345' }).success).toBe(false)
    // Starts with invalid digit
    expect(createUserSchema.safeParse({ ...validUser, mobileNumber: '2848022334' }).success).toBe(false)
    // Contains non-digits
    expect(createUserSchema.safeParse({ ...validUser, mobileNumber: '98480abc34' }).success).toBe(false)
    // Valid 10-digit
    expect(createUserSchema.safeParse({ ...validUser, mobileNumber: '9848022334' }).success).toBe(true)
  })

  it('enforces password strength requirements (min 8 chars, uppercase, lowercase, digit)', () => {
    // Too short (< 8 chars)
    expect(createUserSchema.safeParse({ ...validUser, password: 'Pass1' }).success).toBe(false)
    // No uppercase
    expect(createUserSchema.safeParse({ ...validUser, password: 'password123' }).success).toBe(false)
    // No lowercase
    expect(createUserSchema.safeParse({ ...validUser, password: 'PASSWORD123' }).success).toBe(false)
    // No digit
    expect(createUserSchema.safeParse({ ...validUser, password: 'PasswordNoDigit' }).success).toBe(false)
    // Compliant password
    expect(createUserSchema.safeParse({ ...validUser, password: 'ValidPassword1' }).success).toBe(true)
  })

  it('validates date of birth and ensures user is at least 18 years old', () => {
    // Malformed date
    expect(createUserSchema.safeParse({ ...validUser, dob: 'not-a-date' }).success).toBe(false)

    // User is 5 years old (born recently)
    const recentYear = new Date().getFullYear() - 5
    expect(createUserSchema.safeParse({ ...validUser, dob: `${recentYear}-01-01` }).success).toBe(false)

    // User is 25 years old
    const validYear = new Date().getFullYear() - 25
    expect(createUserSchema.safeParse({ ...validUser, dob: `${validYear}-01-01` }).success).toBe(true)
  })

  it('enforces location selection (zoneId, circleId, ssaId)', () => {
    expect(createUserSchema.safeParse({ ...validUser, zoneId: 0 }).success).toBe(false)
    expect(createUserSchema.safeParse({ ...validUser, circleId: 0 }).success).toBe(false)
    expect(createUserSchema.safeParse({ ...validUser, ssaId: 0 }).success).toBe(false)
  })

  it('contains all 32 required permission keys grouped across categories', () => {
    expect(PERMISSION_KEYS.length).toBe(32)
    expect(PERMISSION_KEYS).toContain('userPermissions')
    expect(PERMISSION_KEYS).toContain('dealerPermissions')
    expect(PERMISSION_KEYS).toContain('commissionPermissions')
    expect(PERMISSION_KEYS).toContain('plansNumberpermissions')
    expect(PERMISSION_KEYS).toContain('dealerMpinReset')

    const totalGroupedKeys = PERMISSION_GROUPS.reduce(
      (acc, group) => acc + group.keys.length,
      0
    )
    expect(totalGroupedKeys).toBe(32)
  })

  it('tests zodResolver directly', async () => {
    const { zodResolver } = await import('@hookform/resolvers/zod')
    const resolver = zodResolver(createUserSchema)
    const result = await resolver(validUser, {}, { fields: {} } as any)
    expect(result.errors).toEqual({})
    expect(result.values).toBeDefined()
  })
})
