import { describe, expect, it } from 'vitest'
import { buildMemoText } from './memo'

const weights = { cost: 45, speed: 30, compliance: 25 }
const base = { totalScore: 0, costScore: 0, speedScore: 0, complianceScore: 0 }

describe('buildMemoText', () => {
  it('states that no recommendation exists for an empty tender', () => {
    const memo = buildMemoText({ scoreRows: [], weights, generatedAt: 'now' })

    expect(memo).toContain('Recommended vendor: not available yet.')
    expect(memo).toContain('No vendor scores available.')
    expect(memo).not.toContain('Lead margin')
  })

  it('reports leader, rounded margin, and at most three shortlist rows', () => {
    const scoreRows = [
      { ...base, id: '1', vendorName: 'Atlas', totalScore: 80.3 },
      { ...base, id: '2', vendorName: 'Beacon', totalScore: 70.1 },
      { ...base, id: '3', vendorName: 'Cinder', totalScore: 60 },
      { ...base, id: '4', vendorName: 'Delta', totalScore: 50 },
    ]
    const memo = buildMemoText({ scoreRows, weights, generatedAt: '6 Oct 2026' })

    expect(memo).toContain('Generated: 6 Oct 2026')
    expect(memo).toContain('Recommended vendor: Atlas (weighted score 80.3)')
    expect(memo).toContain('Lead margin vs Beacon: 10.2 points')
    expect(memo).toContain('3. Cinder')
    expect(memo).not.toContain('Delta')
  })
})
