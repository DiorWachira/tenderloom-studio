// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { BASELINE_CRITERIA } from './compliance'
import { evaluateTender } from './evaluation'
import { buildSampleVendors } from './sample'
import { DEFAULT_WEIGHTS } from './scoring'

const NOW = new Date('2026-10-06T12:00:00Z')

describe('evaluateTender with the sample tender', () => {
  const vendors = buildSampleVendors(NOW)
  const idOf = (name: string) => vendors.find((vendor) => vendor.vendorName === name)!.id
  const result = evaluateTender(vendors, BASELINE_CRITERIA, DEFAULT_WEIGHTS, NOW)

  it('excludes disqualified vendors from ranking and explains why', () => {
    expect(result.eligibleCount).toBe(4)
    expect(result.scoreRows.map((row) => row.vendorName)).not.toContain('Cinderline Ops')
    expect(result.disqualified).toEqual([
      {
        vendorName: 'Cinderline Ops',
        reasons: ['Mandatory criterion "GDPR data processing agreement" is not met.'],
      },
    ])
    expect(result.riskById[idOf('Cinderline Ops')]).toBe('critical')
  })

  it('ranks the eligible field using engine compliance scores', () => {
    expect(result.scoreRows.map((row) => [row.vendorName, row.totalScore, row.complianceScore])).toEqual([
      ['Northlake Systems', 53.4, 90],
      ['Harbor & Finch Digital', 50, 80],
      ['Brightwater Hosting', 48.1, 12.5],
      ['Meridian Cloud Partners', 37.2, 87.5],
    ])
  })

  it('surfaces the demo findings: expiring insurance, evidence gap, abnormally low bid', () => {
    const findingCodes = (name: string) => result.assessments[idOf(name)].findings.map((f) => f.code)

    expect(findingCodes('Northlake Systems')).toContain('evidence-expiring')
    expect(findingCodes('Harbor & Finch Digital')).toContain('evidence-gap')
    expect(findingCodes('Brightwater Hosting')).toContain('price-risk')
    expect(result.riskById[idOf('Meridian Cloud Partners')]).toBe('low')
    expect(result.riskById[idOf('Brightwater Hosting')]).toBe('high')
  })

  it('reports sensitivity for the current leader', () => {
    expect(result.sensitivity.leaderId).toBe(idOf('Northlake Systems'))
    expect(result.sensitivity.minimumShift).not.toBeNull()
  })
})

describe('evaluateTender edge cases', () => {
  it('handles an empty tender', () => {
    const result = evaluateTender([], BASELINE_CRITERIA, DEFAULT_WEIGHTS, NOW)
    expect(result).toMatchObject({ scoreRows: [], disqualified: [], eligibleCount: 0, riskById: {} })
    expect(result.sensitivity.leaderId).toBeNull()
  })
})
