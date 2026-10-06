// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { BASELINE_CRITERIA, assessVendor } from './compliance'
import type { ComplianceCriterion } from './compliance'
import { MIGRATION_NOTE, migrateV1toV2, parseLegacyVendors } from './migrations'
import { vendorRecordSchema } from './schemas'
import type { LegacyVendorRecord } from './schemas'

const legacy = (id: string, compliant: 'yes' | 'no'): LegacyVendorRecord => ({
  id,
  vendorName: `Vendor ${id}`,
  serviceCategory: 'Hosting',
  contactEmail: `${id}@example.com`,
  bidAmount: 1000,
  deliveryDays: 10,
  compliant,
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('parseLegacyVendors', () => {
  it.each([
    ['missing', null],
    ['invalid JSON', '{nope'],
    ['wrong shape', '[{"id":1}]'],
  ])('returns [] for %s data', (_label, raw) => {
    expect(parseLegacyVendors(raw)).toEqual([])
  })

  it('parses valid v1 records', () => {
    const records = [legacy('a', 'yes')]
    expect(parseLegacyVendors(JSON.stringify(records))).toEqual(records)
  })
})

describe('migrateV1toV2', () => {
  it('marks every criterion met for compliant vendors and drops the old flag', () => {
    const [vendor] = migrateV1toV2([legacy('a', 'yes')], BASELINE_CRITERIA)

    expect(vendor).not.toHaveProperty('compliant')
    expect(Object.keys(vendor.compliance)).toEqual(BASELINE_CRITERIA.map((c) => c.id))
    expect(Object.values(vendor.compliance).every((r) => r.status === 'met' && r.evidenceNote === MIGRATION_NOTE)).toBe(true)
    expect(vendorRecordSchema.safeParse(vendor).success).toBe(true)
  })

  it('fails only the first mandatory criterion for non-compliant vendors', () => {
    const [vendor] = migrateV1toV2([legacy('b', 'no')], BASELINE_CRITERIA)
    const firstMandatory = BASELINE_CRITERIA.find((c) => c.kind === 'mandatory')!

    expect(vendor.compliance).toEqual({
      [firstMandatory.id]: { status: 'not-met', evidenceRef: '', evidenceNote: MIGRATION_NOTE },
    })
  })

  it('keeps the old outcome: compliant stays eligible at 100, non-compliant is disqualified', () => {
    const now = new Date('2026-10-06T00:00:00Z')
    const [yes, no] = migrateV1toV2([legacy('a', 'yes'), legacy('b', 'no')], BASELINE_CRITERIA)

    const yesResult = assessVendor(yes.id, BASELINE_CRITERIA, yes.compliance, now)
    expect(yesResult).toMatchObject({ eligible: true, complianceScore: 100 })
    // Migrated "met" answers carry no evidence reference, so they are flagged for follow-up.
    expect(yesResult.findings.every((f) => f.code === 'evidence-missing')).toBe(true)

    expect(assessVendor(no.id, BASELINE_CRITERIA, no.compliance, now).eligible).toBe(false)
  })

  it('leaves non-compliant vendors unanswered when no mandatory criterion exists', () => {
    const scoredOnly: ComplianceCriterion[] = BASELINE_CRITERIA.filter((c) => c.kind === 'scored')
    const [vendor] = migrateV1toV2([legacy('c', 'no')], scoredOnly)
    expect(vendor.compliance).toEqual({})
  })
})
