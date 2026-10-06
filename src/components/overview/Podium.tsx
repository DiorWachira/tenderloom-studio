import type { VendorScore } from '../../domain/scoring'
import { Avatar } from '../ui/Avatar'
import { Chip } from '../ui/Chip'
import { ScoreBar } from '../ui/ScoreBar'

const metrics = [
  { key: 'costScore', label: 'Cost', tone: 'accent' },
  { key: 'speedScore', label: 'Speed', tone: 'brass' },
  { key: 'complianceScore', label: 'Compliance', tone: 'sage' },
] as const

export function Podium({ rows }: { rows: VendorScore[] }) {
  return (
    <ol className="podium">
      {rows.slice(0, 3).map((row, index) => (
        <li key={row.id} className={index === 0 ? 'podium__card podium__card--leader' : 'podium__card'}>
          <div className="podium__top">
            <span className="podium__rank" aria-label={`Rank ${index + 1}`}>
              {index + 1}
            </span>
            {index === 0 && <Chip tone="brass">Recommended</Chip>}
          </div>
          <Avatar name={row.vendorName} size="lg" />
          <h3>{row.vendorName}</h3>
          <p className="podium__score">
            <span className="num">{row.totalScore}</span>
            <span className="podium__score-label">weighted score</span>
          </p>
          <dl className="podium__metrics">
            {metrics.map((metric) => (
              <div key={metric.key}>
                <dt>{metric.label}</dt>
                <dd>
                  <span className="num">{row[metric.key]}</span>
                  <ScoreBar value={row[metric.key]} tone={metric.tone} />
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ol>
  )
}
