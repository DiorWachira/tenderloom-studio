// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { FRAGILE_THRESHOLD, WEIGHT_KEYS, analyseSensitivity, calculateWeightedScores } from './scoring'
import type { ScoringInput } from './scoring'

const input = (id: string, overrides: Partial<ScoringInput> = {}): ScoringInput => ({
  id,
  vendorName: id.toUpperCase(),
  bidAmount: 100,
  deliveryDays: 10,
  complianceScore: 100,
  ...overrides,
})

const vendors: ScoringInput[] = [
  input('atlas', { vendorName: 'Atlas', bidAmount: 52000, deliveryDays: 21, complianceScore: 100 }),
  input('beacon', { vendorName: 'Beacon', bidAmount: 46000, deliveryDays: 30, complianceScore: 80 }),
  input('cinder', { vendorName: 'Cinder', bidAmount: 42000, deliveryDays: 19, complianceScore: 40 }),
]

describe('calculateWeightedScores', () => {
  it('returns an empty list for no vendors', () => {
    expect(calculateWeightedScores([], { cost: 45, speed: 30, compliance: 25 })).toEqual([])
  })

  it('scales cost and speed so the best value is 100 and the worst is 0', () => {
    const rows = calculateWeightedScores(vendors, { cost: 45, speed: 30, compliance: 25 })
    const byName = Object.fromEntries(rows.map((row) => [row.vendorName, row]))

    expect(byName.Cinder.costScore).toBe(100)
    expect(byName.Atlas.costScore).toBe(0)
    expect(byName.Cinder.speedScore).toBe(100)
    expect(byName.Beacon.speedScore).toBe(0)
    expect(byName.Beacon.complianceScore).toBe(80)
  })

  it('gives a single vendor full cost and speed scores', () => {
    const [row] = calculateWeightedScores([input('solo', { complianceScore: 60 })], {
      cost: 1,
      speed: 1,
      compliance: 2,
    })
    expect(row).toMatchObject({ rank: 1, costScore: 100, speedScore: 100, totalScore: 80 })
  })

  it('returns contributions that sum exactly to the displayed total', () => {
    const rows = calculateWeightedScores(vendors, { cost: 37, speed: 41, compliance: 22 })

    for (const row of rows) {
      const sum = WEIGHT_KEYS.reduce((total, key) => total + row.contributions[key], 0)
      expect(Math.round(sum * 10) / 10).toBe(row.totalScore)
    }
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3])
  })

  it('ranks by total and responds to weight changes', () => {
    const balanced = calculateWeightedScores(vendors, { cost: 45, speed: 30, compliance: 25 })
    const complianceLed = calculateWeightedScores(vendors, { cost: 10, speed: 10, compliance: 80 })

    expect(balanced[0].vendorName).toBe('Cinder')
    expect(complianceLed[0].vendorName).toBe('Atlas')
    for (let i = 1; i < balanced.length; i += 1) {
      expect(balanced[i - 1].totalScore).toBeGreaterThanOrEqual(balanced[i].totalScore)
    }
  })

  it('scores everyone zero when all weights are zero', () => {
    const rows = calculateWeightedScores(vendors, { cost: 0, speed: 0, compliance: 0 })
    expect(rows.every((row) => row.totalScore === 0)).toBe(true)
    expect(rows[0].vendorName).toBe('Atlas')
  })
})

describe('tie-breaks', () => {
  const zero = { cost: 0, speed: 0, compliance: 0 }
  const order = (inputs: ScoringInput[], weights = zero) =>
    calculateWeightedScores(inputs, weights).map((row) => row.id)

  it('prefers higher compliance when totals tie', () => {
    expect(
      order([input('a', { complianceScore: 70 }), input('b', { complianceScore: 90 })], {
        cost: 1,
        speed: 0,
        compliance: 0,
      }),
    ).toEqual(['b', 'a'])
  })

  it('then prefers the cheaper bid', () => {
    expect(order([input('a', { bidAmount: 200 }), input('b', { bidAmount: 100 })])).toEqual(['b', 'a'])
  })

  it('then prefers faster delivery', () => {
    expect(order([input('a', { deliveryDays: 20 }), input('b', { deliveryDays: 10 })])).toEqual(['b', 'a'])
  })

  it('then sorts by vendor name, then id', () => {
    expect(order([input('a', { vendorName: 'Zed' }), input('b', { vendorName: 'Amber' })])).toEqual(['b', 'a'])
    expect(order([input('b', { vendorName: 'Same' }), input('a', { vendorName: 'Same' })])).toEqual(['a', 'b'])
  })
})

describe('analyseSensitivity', () => {
  it('has nothing to analyse with fewer than two vendors', () => {
    expect(analyseSensitivity([], { cost: 1, speed: 1, compliance: 1 })).toEqual({
      leaderId: null,
      shifts: [],
      minimumShift: null,
      fragile: false,
    })
    expect(analyseSensitivity([input('a')], { cost: 1, speed: 1, compliance: 1 }).leaderId).toBe('a')
  })

  it('flags a one-point flip as fragile and skips weights that cannot flip the leader', () => {
    const inputs = [
      input('cheap', { vendorName: 'Cheap', bidAmount: 100, deliveryDays: 20 }),
      input('fast', { vendorName: 'Fast', bidAmount: 200, deliveryDays: 10 }),
    ]
    const result = analyseSensitivity(inputs, { cost: 50, speed: 50, compliance: 0 })

    expect(result.leaderId).toBe('cheap')
    expect(result.shifts.map((shift) => shift.weight)).toEqual(['cost', 'speed'])
    expect(result.minimumShift).toEqual({ weight: 'cost', delta: -1, newLeaderId: 'fast', newLeaderName: 'Fast' })
    expect(result.fragile).toBe(true)
  })

  it('reports a large flip as stable', () => {
    const inputs = [
      input('cheap', { bidAmount: 100, deliveryDays: 20 }),
      input('fast', { bidAmount: 200, deliveryDays: 10 }),
    ]
    const result = analyseSensitivity(inputs, { cost: 60, speed: 40, compliance: 0 })

    expect(Math.abs(result.minimumShift!.delta)).toBe(21)
    expect(Math.abs(result.minimumShift!.delta)).toBeGreaterThanOrEqual(FRAGILE_THRESHOLD)
    expect(result.fragile).toBe(false)
  })

  it('finds no flip when one vendor dominates every criterion', () => {
    const inputs = [
      input('best', { bidAmount: 100, deliveryDays: 10, complianceScore: 100 }),
      input('worst', { bidAmount: 200, deliveryDays: 20, complianceScore: 50 }),
    ]
    const result = analyseSensitivity(inputs, { cost: 45, speed: 30, compliance: 25 })

    expect(result).toMatchObject({ leaderId: 'best', shifts: [], minimumShift: null, fragile: false })
  })

  it('never searches outside the 0-100 weight range', () => {
    const inputs = [
      input('cheap', { bidAmount: 100, deliveryDays: 20 }),
      input('fast', { bidAmount: 200, deliveryDays: 10 }),
    ]
    const result = analyseSensitivity(inputs, { cost: 100, speed: 0, compliance: 0 })

    for (const shift of result.shifts) {
      const base = { cost: 100, speed: 0, compliance: 0 }[shift.weight]
      expect(base + shift.delta).toBeGreaterThanOrEqual(0)
      expect(base + shift.delta).toBeLessThanOrEqual(100)
    }
  })
})
