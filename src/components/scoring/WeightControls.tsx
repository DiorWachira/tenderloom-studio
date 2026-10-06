import { DEFAULT_WEIGHTS } from '../../domain/scoring'
import type { ScoreWeights } from '../../domain/scoring'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'


const PRESETS: { label: string; weights: ScoreWeights }[] = [
  { label: 'Default', weights: DEFAULT_WEIGHTS },
  { label: 'Cost-led', weights: { cost: 60, speed: 25, compliance: 15 } },
  { label: 'Speed-led', weights: { cost: 25, speed: 55, compliance: 20 } },
  { label: 'Risk-averse', weights: { cost: 25, speed: 20, compliance: 55 } },
]

const SLIDERS = [
  { key: 'cost', label: 'Cost priority', tone: 'accent' },
  { key: 'speed', label: 'Delivery speed priority', tone: 'brass' },
  { key: 'compliance', label: 'Compliance priority', tone: 'sage' },
] as const

type WeightControlsProps = {
  weights: ScoreWeights
  onChange: (weights: ScoreWeights) => void
  onApply: () => void
}

const same = (a: ScoreWeights, b: ScoreWeights) =>
  a.cost === b.cost && a.speed === b.speed && a.compliance === b.compliance

export function WeightControls({ weights, onChange, onApply }: WeightControlsProps) {
  const total = weights.cost + weights.speed + weights.compliance

  return (
    <Panel
      title="Weight controls"
      description="Tune importance by procurement strategy. Scores rebalance instantly across all vendors."
    >
      <div className="presets" role="group" aria-label="Weight presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="preset"
            aria-pressed={same(weights, preset.weights)}
            onClick={() => onChange(preset.weights)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="share" role="img" aria-label="Effective share of the total score">
        {SLIDERS.map((slider) => (
          <span
            key={slider.key}
            className={`share__part share__part--${slider.tone}`}
            style={{ flexGrow: weights[slider.key] }}
          />
        ))}
      </div>
      <p className="share__caption">
        {total === 0
          ? 'Raise at least one weight above zero to produce a ranking.'
          : SLIDERS.map(
              (slider) => `${slider.key} ${Math.round((weights[slider.key] / total) * 100)}%`,
            ).join(' · ')}
      </p>

      <div className="sliders">
        {SLIDERS.map((slider) => (
          <div className="slider" key={slider.key}>
            <div className="slider__head">
              <label htmlFor={`weight-${slider.key}`}>{slider.label}</label>
              <output htmlFor={`weight-${slider.key}`} className="num">
                {weights[slider.key]}%
              </output>
            </div>
            <input
              id={`weight-${slider.key}`}
              type="range"
              min="0"
              max="100"
              value={weights[slider.key]}
              onChange={(event) => onChange({ ...weights, [slider.key]: Number(event.target.value) })}
            />
          </div>
        ))}
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onApply}>
          Apply weight profile
        </Button>
      </div>
    </Panel>
  )
}
