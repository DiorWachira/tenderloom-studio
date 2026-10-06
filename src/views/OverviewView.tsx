import { Hero } from '../components/overview/Hero'
import { KpiStrip } from '../components/overview/KpiStrip'
import { NextSteps } from '../components/overview/NextSteps'
import { Podium } from '../components/overview/Podium'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Panel } from '../components/ui/Panel'
import { ScoringArt } from '../assets/illustrations/EmptyArt'
import type { Kpis } from '../domain/kpis'
import type { VendorScore } from '../domain/scoring'
import type { ViewId } from '../hooks/useView'

type OverviewViewProps = {
  kpis: Kpis
  scoreRows: VendorScore[]
  weightsApplied: boolean
  memoExported: boolean
  onNavigate: (view: ViewId) => void
  onLoadSample: () => void
}

export function OverviewView({
  kpis,
  scoreRows,
  weightsApplied,
  memoExported,
  onNavigate,
  onLoadSample,
}: OverviewViewProps) {
  return (
    <>
      <Hero
        hasVendors={kpis.vendorCount > 0}
        onLoadSample={onLoadSample}
        onAddVendor={() => onNavigate('vendors')}
        onReviewScoring={() => onNavigate('scoring')}
      />

      <KpiStrip kpis={kpis} />

      <div className="split split--wide-left">
        <Panel
          title="Top of the field"
          description="The three strongest bids under your current weights."
          actions={
            scoreRows.length > 0 ? (
              <Button variant="ghost" className="btn--small" onClick={() => onNavigate('scoring')}>
                Full scoring
              </Button>
            ) : undefined
          }
        >
          {scoreRows.length === 0 ? (
            <EmptyState
              art={<ScoringArt />}
              title="No ranking yet"
              action={<Button onClick={onLoadSample}>Load sample tender</Button>}
            >
              Add vendors and the strongest three will appear here, ranked by weighted score.
            </EmptyState>
          ) : (
            <Podium rows={scoreRows} />
          )}
        </Panel>

        <Panel title="Your path to a decision" description="Three steps from raw bids to an approved memo.">
          <NextSteps
            vendorCount={kpis.vendorCount}
            weightsApplied={weightsApplied}
            memoExported={memoExported}
            onNavigate={onNavigate}
          />
        </Panel>
      </div>
    </>
  )
}
