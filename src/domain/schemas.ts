import { z } from 'zod'

export const STORAGE_KEYS = {
  vendors: 'tenderloom.vendors.v1',
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
  compliant: z.enum(['yes', 'no']),
  notes: z
    .string()
    .max(220, 'Notes should stay under 220 characters.')
    .optional()
    .or(z.literal('')),
})

export const vendorRecordSchema = vendorSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
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
export type AuditEvent = z.infer<typeof auditEventSchema>

export const emptyVendorForm: VendorFormValues = {
  vendorName: '',
  serviceCategory: '',
  contactEmail: '',
  bidAmount: 0,
  deliveryDays: 14,
  compliant: 'yes',
  notes: '',
}
