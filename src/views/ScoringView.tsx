import { ScoreTable } from '../components/scoring/ScoreTable'
import { WeightControls } from '../components/scoring/WeightControls'
import { PageHeader } from '../components/ui/PageHeader'
import type { RiskLevel } from '../domain/compliance'
import type { DisqualifiedVendor } from '../domain/memo'
import type { ScoreWeights, SensitivityResult, VendorScore } from '../domain/scoring'

type ScoringViewProps = {
  weights: ScoreWeights
  rows: VendorScore[]
  disqualified: DisqualifiedVendor[]
  sensitivity: SensitivityResult
  riskById: Record<string, RiskLevel>
  onWeightsChange: (weights: ScoreWeights) => void
  onApplyWeights: () => void
  onAddVendors: () => void
  onReviewCompliance: () => void
}

export function ScoringView({ weights, onWeightsChange, onApplyWeights, ...table }: ScoringViewProps) {
  return (
    <>
      <PageHeader eyebrow="Scoring" title="Weighted scoring matrix">
        Decide what matters most, then see how the ranking of eligible vendors responds in real time.
      </PageHeader>
      <div className="split split--narrow-left">
        <WeightControls weights={weights} onChange={onWeightsChange} onApply={onApplyWeights} />
        <ScoreTable {...table} />
      </div>
    </>
  )
}
