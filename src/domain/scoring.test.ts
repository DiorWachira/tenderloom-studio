import { describe, expect, it } from 'vitest'
import { calculateWeightedScores } from './scoring'

const vendors = [
  {
    id: 'a',
    vendorName: 'Atlas Procurement',
    bidAmount: 52000,
    deliveryDays: 21,
    compliant: 'yes' as const,
  },
  {
    id: 'b',
    vendorName: 'Beacon Supply',
    bidAmount: 46000,
    deliveryDays: 30,
    compliant: 'yes' as const,
  },
  {
    id: 'c',
    vendorName: 'Cinder Ops',
    bidAmount: 42000,
    deliveryDays: 19,
    compliant: 'no' as const,
  },
]

describe('calculateWeightedScores', () => {
  it('returns vendors sorted by total score descending', () => {
    const rows = calculateWeightedScores(vendors, {
      cost: 45,
      speed: 30,
      compliance: 25,
    })

    expect(rows[0]?.vendorName).toBe('Beacon Supply')
    expect(rows[1]?.vendorName).toBe('Atlas Procurement')
    expect(rows[2]?.vendorName).toBe('Cinder Ops')
  })

  it('changes ranking when speed is prioritized heavily', () => {
    const rows = calculateWeightedScores(vendors, {
      cost: 10,
      speed: 80,
      compliance: 10,
    })

    expect(rows[0]?.vendorName).toBe('Atlas Procurement')
  })

  it('penalizes non-compliant vendors even when they are cheaper and faster', () => {
    const rows = calculateWeightedScores(vendors, {
      cost: 45,
      speed: 30,
      compliance: 25,
    })

    const cinder = rows.find((row) => row.vendorName === 'Cinder Ops')
    const atlas = rows.find((row) => row.vendorName === 'Atlas Procurement')

    expect(cinder).toBeDefined()
    expect(atlas).toBeDefined()
    expect(cinder!.totalScore).toBeLessThan(atlas!.totalScore)
  })

  it('returns empty array for no vendor input', () => {
    expect(
      calculateWeightedScores([], {
        cost: 45,
        speed: 30,
        compliance: 25,
      }),
    ).toEqual([])
  })
})
