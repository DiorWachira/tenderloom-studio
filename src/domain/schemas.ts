import { z } from 'zod'
import { criterionResponseSchema } from './compliance'

export const STORAGE_KEYS = {
  vendors: 'tenderloom.vendors.v2',
  /** Read-only after migration; kept as a backup of pre-compliance data. */
  legacyVendors: 'tenderloom.vendors.v1',
  criteria: 'tenderloom.criteria.v1',
  audit: 'tenderloom.audit.v1',
} as const

export const vendorSchema = z.object({
  vendorName: z.string().min(2, 'Vendor name must be at least 2 characters.'),
  serviceCategory: z.string().min(2, 'Service category is required.'),
  contactEmail: z.email('Enter a valid contact email.'),
  bidAmount: z.coerce.number().positive('Bid amount must be greater than zero.'),
  deliveryDays: z.coerce
    .number()
    .int('Delivery days must be a whole number.')
    .positive('Delivery days must be above zero.')
    .max(365, 'Delivery days cannot exceed 365.'),
  notes: z
    .string()
    .max(220, 'Notes should stay under 220 characters.')
    .optional()
    .or(z.literal('')),
})

const recordMeta = {
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}

export const vendorRecordSchema = vendorSchema.extend({
  ...recordMeta,
  compliance: z.record(z.string(), criterionResponseSchema),
})

/** Shape stored under `tenderloom.vendors.v1` before the compliance engine existed. */
export const legacyVendorRecordSchema = vendorSchema.extend({
  ...recordMeta,
  compliant: z.enum(['yes', 'no']),
})

export const auditEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.string(),
  detail: z.string(),
})

export type VendorInput = z.infer<typeof vendorSchema>
export type VendorFormValues = z.input<typeof vendorSchema>
export type VendorRecord = z.infer<typeof vendorRecordSchema>
export type LegacyVendorRecord = z.infer<typeof legacyVendorRecordSchema>
export type AuditEvent = z.infer<typeof auditEventSchema>

export const emptyVendorForm: VendorFormValues = {
  vendorName: '',
  serviceCategory: '',
  contactEmail: '',
  bidAmount: 0,
  deliveryDays: 14,
  notes: '',
}
