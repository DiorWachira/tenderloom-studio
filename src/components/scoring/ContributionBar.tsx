import type { ScoreWeights } from '../../domain/scoring'

const SEGMENTS = [
  { key: 'cost', tone: 'accent' },
  { key: 'speed', tone: 'brass' },
  { key: 'compliance', tone: 'sage' },
] as const

/** Decorative stacked bar of weighted points; render the total as text beside it. */
export function ContributionBar({ contributions }: { contributions: ScoreWeights }) {
  return (
    <span className="stack" aria-hidden="true">
      {SEGMENTS.map((segment) => (
        <span
          key={segment.key}
          className={`stack__part stack__part--${segment.tone}`}
          style={{ width: `${Math.max(0, Math.min(100, contributions[segment.key]))}%` }}
        />
      ))}
    </span>
  )
}

export function ContributionLegend() {
  return (
    <p className="stack-legend" aria-hidden="true">
      {SEGMENTS.map((segment) => (
        <span key={segment.key} className={`stack-legend__item stack-legend__item--${segment.tone}`}>
          {segment.key}
        </span>
      ))}
    </p>
  )
}
