import { describe, expect, it } from 'vitest'
import { TINT_COUNT, getInitials, getTintIndex } from './identity'

describe('getInitials', () => {
  it.each([
    ['Northlake Systems', 'NS'],
    ['Cinderline', 'C'],
    ['  harbor & finch digital ', 'HF'],
    ['Élan Corp', 'ÉC'],
    ['', '?'],
    ['& - &', '?'],
  ])('derives %j -> %j', (name, expected) => {
    expect(getInitials(name)).toBe(expected)
  })
})

describe('getTintIndex', () => {
  it('is stable and case-insensitive', () => {
    expect(getTintIndex('Northlake Systems')).toBe(getTintIndex(' northlake systems '))
  })

  it('stays within the palette size', () => {
    for (const name of ['A', 'Beacon Supply', 'Cinderline Ops', '日本語', '']) {
      const index = getTintIndex(name)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(TINT_COUNT)
    }
  })
})
