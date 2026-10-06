// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { BASELINE_CRITERIA, addDays } from './compliance'
import { vendorRecordSchema } from './schemas'
import { buildSampleVendors } from './sample'

describe('buildSampleVendors', () => {
  const now = new Date('2026-01-15T09:00:00Z')
  const vendors = buildSampleVendors(now)

  it('produces schema-valid records with unique ids and newest-first timestamps', () => {
    expect(vendors).toHaveLength(5)
    for (const vendor of vendors) {
      expect(vendorRecordSchema.safeParse(vendor).success).toBe(true)
    }
    expect(new Set(vendors.map((vendor) => vendor.id)).size).toBe(vendors.length)
    expect(vendors[0].updatedAt > vendors[1].updatedAt).toBe(true)
  })

  it('only answers criteria from the baseline checklist', () => {
    const ids = new Set(BASELINE_CRITERIA.map((criterion) => criterion.id))
    for (const vendor of vendors) {
      expect(Object.keys(vendor.compliance).every((id) => ids.has(id))).toBe(true)
    }
  })

  it('dates evidence relative to now and attaches references only to answered items', () => {
    const northlake = vendors.find((vendor) => vendor.vendorName === 'Northlake Systems')!
    expect(northlake.compliance.insurance).toEqual({
      status: 'met',
      evidenceRef: 'evidence/northlake-systems/insurance.pdf',
      evidenceNote: '',
      evidenceDate: addDays('2026-01-15', -350),
    })

    const harbor = vendors.find((vendor) => vendor.vendorName === 'Harbor & Finch Digital')!
    expect(harbor.compliance['modern-slavery']).toEqual({ status: 'unknown', evidenceRef: '', evidenceNote: '' })
  })

  it('defaults to the current time', () => {
    expect(buildSampleVendors()).toHaveLength(5)
  })
})
