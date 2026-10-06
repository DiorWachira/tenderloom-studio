// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  ABNORMALLY_LOW_RATIO,
  BASELINE_CRITERIA,
  EXPIRY_WARNING_DAYS,
  addDays,
  assessTender,
  assessVendor,
  criterionResponseSchema,
  criterionSchema,
  detectAbnormallyLowBids,
  effectiveExpiry,
  median,
  riskLevelFor,
  toIsoDay,
} from './compliance'
import type { ComplianceCriterion, CriterionResponse, Finding, ResponseStatus } from './compliance'

const NOW = new Date('2026-10-06T12:00:00Z')
const TODAY = '2026-10-06'

const crit = (overrides: Partial<ComplianceCriterion> = {}): ComplianceCriterion => ({
  id: 'c1',
  label: 'Criterion one',
  category: 'legal',
  kind: 'scored',
  weight: 50,
  evidenceRequired: false,
  ...overrides,
})

const resp = (status: ResponseStatus, extra: Partial<CriterionResponse> = {}): CriterionResponse => ({
  status,
  evidenceRef: 'ref.pdf',
  evidenceNote: '',
  ...extra,
})

const codes = (findings: Finding[]) => findings.map((finding) => finding.code)

describe('date helpers', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('formats a Date as a UTC calendar day', () => {
    expect(toIsoDay(new Date('2026-10-06T23:59:59Z'))).toBe('2026-10-06')
  })
})

describe('effectiveExpiry', () => {
  it('prefers an explicit expiry date', () => {
    expect(
      effectiveExpiry(crit({ validityDays: 30 }), resp('met', { evidenceDate: '2026-01-01', expiresAt: '2026-12-31' })),
    ).toBe('2026-12-31')
  })

  it('derives expiry from evidence date plus validity', () => {
    expect(effectiveExpiry(crit({ validityDays: 30 }), resp('met', { evidenceDate: '2026-01-01' }))).toBe('2026-01-31')
  })

  it('returns null without enough information', () => {
    expect(effectiveExpiry(crit(), resp('met', { evidenceDate: '2026-01-01' }))).toBeNull()
    expect(effectiveExpiry(crit({ validityDays: 30 }), resp('met'))).toBeNull()
  })
})

describe('median', () => {
  it.each([
    [[5, 1, 3], 3],
    [[4, 1, 3, 2], 2.5],
  ])('median of %j is %d', (values, expected) => {
    expect(median(values)).toBe(expected)
  })
})

describe('detectAbnormallyLowBids', () => {
  const bids = (...amounts: number[]) => amounts.map((bidAmount, i) => ({ id: `v${i}`, bidAmount }))

  it('needs at least three bids', () => {
    expect(detectAbnormallyLowBids(bids(10, 100)).size).toBe(0)
  })

  it('does not flag a bid at exactly the threshold', () => {
    expect(detectAbnormallyLowBids(bids(100 * ABNORMALLY_LOW_RATIO, 100, 120)).size).toBe(0)
  })

  it('flags a bid just below the threshold with its ratio and the median', () => {
    const flagged = detectAbnormallyLowBids(bids(79.9, 100, 120))
    expect([...flagged.keys()]).toEqual(['v0'])
    expect(flagged.get('v0')).toEqual({ ratio: 0.799, median: 100 })
  })

  it('uses the mean of the middle two bids for an even count', () => {
    const flagged = detectAbnormallyLowBids(bids(50, 100, 120, 200))
    expect(flagged.get('v0')?.median).toBe(110)
  })
})

describe('assessVendor - mandatory gates', () => {
  const mandatory = crit({ id: 'm', label: 'Insurance', kind: 'mandatory', weight: 0 })

  it('passes when every criterion is met with evidence', () => {
    const result = assessVendor('v', [mandatory, crit()], { m: resp('met'), c1: resp('met') }, NOW)

    expect(result).toMatchObject({ vendorId: 'v', eligible: true, complianceScore: 100, riskLevel: 'low', findings: [] })
  })

  it('disqualifies a vendor that fails a mandatory criterion', () => {
    const result = assessVendor('v', [mandatory], { m: resp('not-met') }, NOW)

    expect(result.eligible).toBe(false)
    expect(result.riskLevel).toBe('critical')
    expect(result.findings).toEqual([
      { code: 'mandatory-failed', severity: 'critical', criterionId: 'm', message: 'Mandatory criterion "Insurance" is not met.' },
    ])
  })

  it('disqualifies on expired mandatory evidence without a duplicate failure finding', () => {
    const result = assessVendor(
      'v',
      [{ ...mandatory, validityDays: 10 }],
      { m: resp('met', { evidenceDate: addDays(TODAY, -11) }) },
      NOW,
    )

    expect(result.eligible).toBe(false)
    expect(codes(result.findings)).toEqual(['mandatory-expired'])
    expect(result.results.m).toMatchObject({ status: 'met', effectiveStatus: 'not-met', expiryState: 'expired' })
  })

  it.each([
    ['partial', 'only partially met'],
    ['unknown', 'not yet confirmed'],
  ] as const)('keeps a %s mandatory criterion eligible but high risk', (status, wording) => {
    const result = assessVendor('v', [mandatory], { m: resp(status) }, NOW)

    expect(result.eligible).toBe(true)
    expect(result.riskLevel).toBe('high')
    expect(result.findings[0]).toMatchObject({ code: 'mandatory-unconfirmed', severity: 'high' })
    expect(result.findings[0].message).toContain(wording)
  })

  it('treats a missing response as unknown', () => {
    const result = assessVendor('v', [mandatory], {}, NOW)
    expect(result.results.m.status).toBe('unknown')
    expect(codes(result.findings)).toEqual(['mandatory-unconfirmed'])
  })
})

describe('assessVendor - scored criteria', () => {
  it.each([
    ['met', 100, []],
    ['partial', 50, ['criterion-partial']],
    ['not-met', 0, ['criterion-not-met']],
    ['unknown', 0, ['evidence-gap']],
  ] as const)('%s scores %d', (status, score, expectedCodes) => {
    const result = assessVendor('v', [crit()], { c1: resp(status) }, NOW)
    expect(result.complianceScore).toBe(score)
    expect(codes(result.findings)).toEqual(expectedCodes)
  })

  it('weights scored criteria by their weight', () => {
    const result = assessVendor(
      'v',
      [crit({ id: 'a', weight: 75 }), crit({ id: 'b', weight: 25 })],
      { a: resp('met'), b: resp('not-met') },
      NOW,
    )
    expect(result.complianceScore).toBe(75)
  })

  it('counts scored criteria equally when all their weights are zero', () => {
    const result = assessVendor(
      'v',
      [crit({ id: 'a', weight: 0 }), crit({ id: 'b', weight: 0 })],
      { a: resp('met'), b: resp('not-met') },
      NOW,
    )
    expect(result.complianceScore).toBe(50)
  })

  it('scores 100 when there are only mandatory criteria', () => {
    const result = assessVendor('v', [crit({ kind: 'mandatory' })], { c1: resp('met') }, NOW)
    expect(result.complianceScore).toBe(100)
  })

  it('scores expired scored evidence as zero with one high finding', () => {
    const result = assessVendor('v', [crit({ validityDays: 5 })], { c1: resp('met', { evidenceDate: addDays(TODAY, -6) }) }, NOW)

    expect(result.complianceScore).toBe(0)
    expect(result.findings).toEqual([
      expect.objectContaining({ code: 'evidence-expired', severity: 'high', message: expect.stringContaining(addDays(TODAY, -1)) }),
    ])
  })
})

describe('assessVendor - evidence expiry window', () => {
  const at = (daysFromToday: number) =>
    assessVendor('v', [crit()], { c1: resp('met', { expiresAt: addDays(TODAY, daysFromToday) }) }, NOW)

  it('warns on the last day of the window', () => {
    const result = at(EXPIRY_WARNING_DAYS)
    expect(result.results.c1.expiryState).toBe('expiring')
    expect(result.findings[0].message).toContain(`in ${EXPIRY_WARNING_DAYS} days`)
    expect(result.riskLevel).toBe('medium')
  })

  it('is valid one day beyond the window', () => {
    const result = at(EXPIRY_WARNING_DAYS + 1)
    expect(result.results.c1.expiryState).toBe('valid')
    expect(result.findings).toEqual([])
  })

  it('uses singular and same-day wording', () => {
    expect(at(1).findings[0].message).toContain('in 1 day ')
    expect(at(0).findings[0].message).toContain('expires today')
  })

  it('expires the day after the expiry date', () => {
    expect(at(-1).results.c1.expiryState).toBe('expired')
  })

  it('ignores expiry for responses that are not met', () => {
    const result = assessVendor('v', [crit()], { c1: resp('not-met', { expiresAt: addDays(TODAY, -100) }) }, NOW)
    expect(result.results.c1).toMatchObject({ expiry: null, expiryState: 'none' })
  })
})

describe('assessVendor - evidence references', () => {
  it('warns when required evidence has no reference', () => {
    const result = assessVendor('v', [crit({ evidenceRequired: true })], { c1: resp('met', { evidenceRef: '  ' }) }, NOW)
    expect(codes(result.findings)).toEqual(['evidence-missing'])
  })

  it('does not warn when evidence is optional', () => {
    const result = assessVendor('v', [crit()], { c1: resp('partial', { evidenceRef: '' }) }, NOW)
    expect(codes(result.findings)).toEqual(['criterion-partial'])
  })

  it('does not double-report missing evidence on expired items', () => {
    const result = assessVendor(
      'v',
      [crit({ evidenceRequired: true })],
      { c1: resp('met', { evidenceRef: '', expiresAt: addDays(TODAY, -1) }) },
      NOW,
    )
    expect(codes(result.findings)).toEqual(['evidence-expired'])
  })
})

describe('assessVendor - price risk and ordering', () => {
  it('adds a high price-risk finding and sorts findings by severity', () => {
    const result = assessVendor(
      'v',
      [crit({ id: 'a' }), crit({ id: 'b' })],
      { a: resp('partial'), b: resp('unknown') },
      NOW,
      { ratio: 0.7, median: 50000 },
    )

    expect(result.findings.map((f) => f.severity)).toEqual(['high', 'warning', 'info'])
    expect(result.findings[0]).toMatchObject({
      code: 'price-risk',
      message: 'Bid is 70% of the median bid ($50,000); confirm it is sustainable.',
    })
    expect(result.riskLevel).toBe('high')
  })
})

describe('riskLevelFor', () => {
  const finding = (severity: Finding['severity']): Finding => ({ code: 'evidence-gap', severity, message: '' })

  it.each([
    [false, 100, [], 'critical'],
    [true, 49.9, [], 'high'],
    [true, 90, [finding('high')], 'high'],
    [true, 50, [], 'medium'],
    [true, 90, [finding('warning')], 'medium'],
    [true, 75, [finding('info')], 'low'],
  ] as const)('eligible=%s score=%d -> %s', (eligible, score, findings, expected) => {
    expect(riskLevelFor(eligible, score, [...findings])).toBe(expected)
  })
})

describe('assessTender', () => {
  it('assesses every vendor and applies price risk only to the outlier', () => {
    const vendors = [
      { id: 'a', bidAmount: 100, compliance: { c1: resp('met') } },
      { id: 'b', bidAmount: 110, compliance: { c1: resp('met') } },
      { id: 'c', bidAmount: 50, compliance: { c1: resp('met') } },
    ]
    const result = assessTender(vendors, [crit()], NOW)

    expect(Object.keys(result)).toEqual(['a', 'b', 'c'])
    expect(codes(result.c.findings)).toEqual(['price-risk'])
    expect(result.a.findings).toEqual([])
  })
})

describe('schemas and baseline', () => {
  it('ships a valid baseline whose scored weights total 100', () => {
    for (const criterion of BASELINE_CRITERIA) {
      expect(criterionSchema.safeParse(criterion).success).toBe(true)
    }
    const scoredTotal = BASELINE_CRITERIA.filter((c) => c.kind === 'scored').reduce((sum, c) => sum + c.weight, 0)
    expect(scoredTotal).toBe(100)
    expect(new Set(BASELINE_CRITERIA.map((c) => c.id)).size).toBe(BASELINE_CRITERIA.length)
  })

  it('rejects malformed evidence dates', () => {
    expect(criterionResponseSchema.safeParse(resp('met', { evidenceDate: '06/10/2026' })).success).toBe(false)
    expect(criterionResponseSchema.safeParse(resp('met', { evidenceDate: '2026-10-06' })).success).toBe(true)
  })
})
