// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildMemoText, describeSensitivity } from './memo'
import type { SensitivityResult, VendorScore } from './scoring'

const weights = { cost: 45, speed: 30, compliance: 25 }
const none: SensitivityResult = { leaderId: null, shifts: [], minimumShift: null, fragile: false }

const row = (rank: number, id: string, vendorName: string, totalScore: number): VendorScore => ({
  id,
  vendorName,
  rank,
  totalScore,
  costScore: 0,
  speedScore: 0,
  complianceScore: 0,
  contributions: { cost: 0, speed: 0, compliance: 0 },
})

describe('describeSensitivity', () => {
  it('says nothing without a leader', () => {
    expect(describeSensitivity(none)).toBeNull()
  })

  it('reports a leader that no single weight change can unseat', () => {
    expect(describeSensitivity({ ...none, leaderId: 'a' })).toBe(
      'Stable: no single weight change within 0-100 changes the leader.',
    )
  })

  it.each([
    [true, 1, 'Fragile: if the cost weight rises by 1 point, Beacon becomes the leader.'],
    [false, -12, 'Stable: if the cost weight falls by 12 points, Beacon becomes the leader.'],
  ])('fragile=%s delta=%i', (fragile, delta, expected) => {
    const shift = { weight: 'cost' as const, delta, newLeaderId: 'b', newLeaderName: 'Beacon' }
    expect(describeSensitivity({ leaderId: 'a', shifts: [shift], minimumShift: shift, fragile })).toBe(expected)
  })
})

describe('buildMemoText', () => {
  it('states that no recommendation exists for an empty tender', () => {
    const memo = buildMemoText({
      scoreRows: [],
      weights,
      generatedAt: 'now',
      disqualified: [],
      sensitivity: none,
      riskById: {},
    })

    expect(memo).toContain('Recommended vendor: not available yet.')
    expect(memo).toContain('No eligible vendor scores available.')
    expect(memo).toContain('- None')
    expect(memo).not.toContain('Lead margin')
    expect(memo).not.toContain('Sensitivity:')
  })

  it('reports leader risk, margin, sensitivity, shortlist, and disqualifications', () => {
    const scoreRows = [
      row(1, '1', 'Atlas', 80.3),
      row(2, '2', 'Beacon', 70.1),
      row(3, '3', 'Cinder', 60),
      row(4, '4', 'Delta', 50),
    ]
    const shift = { weight: 'speed' as const, delta: 4, newLeaderId: '2', newLeaderName: 'Beacon' }
    const memo = buildMemoText({
      scoreRows,
      weights,
      generatedAt: '6 Oct 2026',
      disqualified: [{ vendorName: 'Echo', reasons: ['Mandatory criterion "Insurance cover" is not met.'] }],
      sensitivity: { leaderId: '1', shifts: [shift], minimumShift: shift, fragile: true },
      riskById: { '1': 'medium', '2': 'low' },
    })

    expect(memo).toContain('Generated: 6 Oct 2026')
    expect(memo).toContain('Recommended vendor: Atlas (weighted score 80.3, medium risk)')
    expect(memo).toContain('Lead margin vs Beacon: 10.2 points')
    expect(memo).toContain('Sensitivity: Fragile: if the speed weight rises by 4 points, Beacon becomes the leader.')
    expect(memo).toContain('2. Beacon | total 70.1 | cost 0 | speed 0 | compliance 0 | risk low')
    expect(memo).toContain('3. Cinder | total 60 | cost 0 | speed 0 | compliance 0 | risk n/a')
    expect(memo).not.toContain('Delta')
    expect(memo).toContain('- Echo: Mandatory criterion "Insurance cover" is not met.')
  })

  it('falls back when the leader has no assessment', () => {
    const memo = buildMemoText({
      scoreRows: [row(1, 'x', 'Solo', 90)],
      weights,
      generatedAt: 'now',
      disqualified: [],
      sensitivity: { ...none, leaderId: 'x' },
      riskById: {},
    })
    expect(memo).toContain('(weighted score 90, unassessed risk)')
  })
})
