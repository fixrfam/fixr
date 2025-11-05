import { z } from 'zod'

export const employeeRoles = z.enum([
  'admin',
  'manager',
  'warehouse',
  'financial',
  'technician',
])
