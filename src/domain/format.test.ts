import { describe, expect, it } from 'vitest'
import { formatDays, formatUsd } from './format'

describe('format helpers', () => {
  it('formats whole-dollar amounts with grouping', () => {
    expect(formatUsd(43000)).toBe('$43,000')
    expect(formatUsd(39900.4)).toBe('$39,900')
  })

  it('pluralises days', () => {
    expect(formatDays(1)).toBe('1 day')
    expect(formatDays(18)).toBe('18 days')
  })
})
