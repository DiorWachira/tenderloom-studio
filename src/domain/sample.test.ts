import { describe, expect, it } from 'vitest'
import { vendorRecordSchema } from './schemas'
import { buildSampleVendors } from './sample'
import { calculateWeightedScores } from './scoring'

describe('buildSampleVendors', () => {
  it('produces schema-valid records with unique ids', () => {
    const vendors = buildSampleVendors(new Date('2026-01-01T00:00:00Z'))

    expect(vendors).toHaveLength(4)
    for (const vendor of vendors) {
      expect(vendorRecordSchema.safeParse(vendor).success).toBe(true)
    }
    expect(new Set(vendors.map((vendor) => vendor.id)).size).toBe(vendors.length)
  })

  it('gives the demo a compliant leader and a cheaper non-compliant bid', () => {
    const vendors = buildSampleVendors()
    const rows = calculateWeightedScores(vendors, { cost: 45, speed: 30, compliance: 25 })
    const cheapest = [...vendors].sort((a, b) => a.bidAmount - b.bidAmount)[0]

    expect(cheapest.compliant).toBe('no')
    expect(rows[0].vendorName).not.toBe(cheapest.vendorName)
  })
})
