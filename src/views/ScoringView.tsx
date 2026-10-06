import { ScoreTable } from '../components/scoring/ScoreTable'
import { WeightControls } from '../components/scoring/WeightControls'
import { PageHeader } from '../components/ui/PageHeader'
import type { ScoreWeights, VendorScore } from '../domain/scoring'

type ScoringViewProps = {
  weights: ScoreWeights
  rows: VendorScore[]
  onWeightsChange: (weights: ScoreWeights) => void
  onApplyWeights: () => void
  onAddVendors: () => void
}

export function ScoringView({ weights, rows, onWeightsChange, onApplyWeights, onAddVendors }: ScoringViewProps) {
  return (
    <>
      <PageHeader eyebrow="Scoring" title="Weighted scoring matrix">
        Decide what matters most, then see how the ranking responds in real time.
      </PageHeader>
      <div className="split split--narrow-left">
        <WeightControls weights={weights} onChange={onWeightsChange} onApply={onApplyWeights} />
        <ScoreTable rows={rows} onAddVendors={onAddVendors} />
      </div>
    </>
  )
}
