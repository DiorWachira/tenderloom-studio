import { describe, expect, it } from 'vitest'
import { computeKpis, tenderStatus } from './kpis'
import { calculateWeightedScores } from './scoring'

const vendors = [
  { id: 'a', vendorName: 'Atlas', bidAmount: 52000, deliveryDays: 21, compliant: 'yes' as const },
  { id: 'b', vendorName: 'Beacon', bidAmount: 46000, deliveryDays: 30, compliant: 'yes' as const },
  { id: 'c', vendorName: 'Cinder', bidAmount: 42000, deliveryDays: 19, compliant: 'no' as const },
]

describe('computeKpis', () => {
  it('returns nulls for an empty tender', () => {
    expect(computeKpis([], [])).toEqual({
      vendorCount: 0,
      lowestBid: null,
      fastestDeliveryDays: null,
      leaderName: null,
      compliantShare: null,
    })
  })

  it('summarises bids, delivery, leader, and compliant share', () => {
    const rows = calculateWeightedScores(vendors, { cost: 45, speed: 30, compliance: 25 })
    const kpis = computeKpis(vendors, rows)

    expect(kpis.vendorCount).toBe(3)
    expect(kpis.lowestBid).toBe(42000)
    expect(kpis.fastestDeliveryDays).toBe(19)
    expect(kpis.leaderName).toBe(rows[0].vendorName)
    expect(kpis.compliantShare).toBe(67)
  })
})

describe('tenderStatus', () => {
  it.each([
    [0, 'draft'],
    [1, 'evaluating'],
    [2, 'ready'],
    [9, 'ready'],
  ])('maps %i vendors to %s', (count, expected) => {
    expect(tenderStatus(count)).toBe(expected)
  })
})
