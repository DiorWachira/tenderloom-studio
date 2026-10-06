// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))
  if (!match) {
    throw new Error(`Token --${name} is missing or not a 6-digit hex colour`)
  }
  return match[1]
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

const surfaces = ['canvas', 'paper', 'paper-sunk']

describe('Atelier Cream tokens meet WCAG AA', () => {
  const textPairs: [string, string][] = [
    ...surfaces.flatMap((surface): [string, string][] => [
      ['ink', surface],
      ['ink-soft', surface],
      ['accent', surface],
      ['sage-ink', surface],
      ['brass-ink', surface],
      ['danger', surface],
    ]),
    ['on-accent', 'accent'],
    ['on-accent', 'accent-strong'],
    ['on-accent', 'sage'],
    ['accent-strong', 'accent-soft'],
    ['sage-ink', 'sage-soft'],
    ['brass-ink', 'brass-soft'],
    ['danger', 'danger-soft'],
    ['ink', 'accent-soft'],
    ['ink', 'danger-soft'],
    ['ink', 'brass-soft'],
    ['ink-soft', 'brass-soft'],
    ...[1, 2, 3, 4, 5, 6].map((n): [string, string] => [`tint-${n}-fg`, `tint-${n}-bg`]),
  ]

  it.each(textPairs)('text --%s on --%s has at least 4.5:1', (foreground, background) => {
    expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(surfaces)('control border has at least 3:1 on --%s', (surface) => {
    expect(contrast(token('control-border'), token(surface))).toBeGreaterThanOrEqual(3)
  })
})
