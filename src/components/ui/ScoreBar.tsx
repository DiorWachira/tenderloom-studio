type ScoreBarProps = { value: number; tone?: 'accent' | 'sage' | 'brass' }

/** Decorative bar; the numeric value must always be rendered as text beside it. */
export function ScoreBar({ value, tone = 'accent' }: ScoreBarProps) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <span className={`bar bar--${tone}`} aria-hidden="true">
      <span className="bar__fill" style={{ width: `${width}%` }} />
    </span>
  )
}
