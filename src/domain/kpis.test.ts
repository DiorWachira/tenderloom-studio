// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { computeKpis, tenderStatus } from './kpis'
import { calculateWeightedScores } from './scoring'

const inputs = [
  { id: 'a', vendorName: 'Atlas', bidAmount: 52000, deliveryDays: 21, complianceScore: 100 },
  { id: 'b', vendorName: 'Beacon', bidAmount: 46000, deliveryDays: 30, complianceScore: 80 },
  { id: 'c', vendorName: 'Cinder', bidAmount: 42000, deliveryDays: 19, complianceScore: 40 },
]

describe('computeKpis', () => {
  it('returns nulls for an empty tender', () => {
    expect(computeKpis([], [], 0)).toEqual({
      vendorCount: 0,
      lowestBid: null,
      fastestDeliveryDays: null,
      leaderName: null,
      eligibleShare: null,
    })
  })

  it('summarises bids, delivery, leader, and the share passing mandatory gates', () => {
    const rows = calculateWeightedScores(inputs, { cost: 45, speed: 30, compliance: 25 })
    const kpis = computeKpis(inputs, rows, 2)

    expect(kpis).toEqual({
      vendorCount: 3,
      lowestBid: 42000,
      fastestDeliveryDays: 19,
      leaderName: rows[0].vendorName,
      eligibleShare: 67,
    })
  })

  it('has no leader when nobody is eligible', () => {
    expect(computeKpis(inputs, [], 0)).toMatchObject({ leaderName: null, eligibleShare: 0 })
  })
})

describe('tenderStatus', () => {
  it.each([
    [0, 0, 'draft'],
    [1, 1, 'evaluating'],
    [3, 1, 'evaluating'],
    [2, 2, 'ready'],
    [9, 4, 'ready'],
  ])('maps %i vendors with %i eligible to %s', (count, eligible, expected) => {
    expect(tenderStatus(count, eligible)).toBe(expected)
  })
})
