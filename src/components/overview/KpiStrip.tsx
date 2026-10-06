import type { Kpis } from '../../domain/kpis'
import { formatDays, formatUsd } from '../../domain/format'

const dash = '\u2014'

export function KpiStrip({ kpis }: { kpis: Kpis }) {
  const items = [
    { label: 'Vendors', value: String(kpis.vendorCount), note: 'in this tender' },
    {
      label: 'Lowest bid',
      value: kpis.lowestBid === null ? dash : formatUsd(kpis.lowestBid),
      note: 'before compliance',
    },
    {
      label: 'Fastest delivery',
      value: kpis.fastestDeliveryDays === null ? dash : formatDays(kpis.fastestDeliveryDays),
      note: 'quickest mobilisation',
    },
    {
      label: 'Current leader',
      value: kpis.leaderName ?? dash,
      note: 'weighted score',
    },
    {
      label: 'Eligible',
      value: kpis.eligibleShare === null ? dash : `${kpis.eligibleShare}%`,
      note: 'pass every mandatory gate',
    },
  ]

  return (
    <dl className="kpis" aria-label="Key figures">
      {items.map((item) => (
        <div className="kpi" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          <dd className="kpi__note">{item.note}</dd>
        </div>
      ))}
    </dl>
  )
}
