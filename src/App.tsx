import { useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { evaluateTender } from './domain/evaluation'
import { computeKpis, tenderStatus } from './domain/kpis'
import { buildMemoText } from './domain/memo'
import { DEFAULT_WEIGHTS } from './domain/scoring'
import type { ScoreWeights } from './domain/scoring'
import { useAuditTrail } from './hooks/useAuditTrail'
import { useCriteria } from './hooks/useCriteria'
import { useVendors } from './hooks/useVendors'
import { useView } from './hooks/useView'
import { AuditView } from './views/AuditView'
import { ComplianceView } from './views/ComplianceView'
import { MemoView } from './views/MemoView'
import { OverviewView } from './views/OverviewView'
import { ScoringView } from './views/ScoringView'
import { VendorsView } from './views/VendorsView'

function App() {
  const [view, navigate] = useView()
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS)
  const { events, record } = useAuditTrail()
  const { criteria, addCriterion, updateCriterion, removeCriterion, resetCriteria } = useCriteria(record)
  const { vendors, addVendor, updateVendor, removeVendor, updateCompliance, loadSample } = useVendors(
    record,
    criteria,
  )

  // Expiry is judged against today, so re-evaluate whenever inputs change.
  const evaluation = useMemo(
    () => evaluateTender(vendors, criteria, weights, new Date()),
    [vendors, criteria, weights],
  )
  const { assessments, scoreRows, disqualified, sensitivity, eligibleCount, riskById } = evaluation
  const kpis = useMemo(
    () => computeKpis(vendors, scoreRows, eligibleCount),
    [vendors, scoreRows, eligibleCount],
  )

  const memoText = useMemo(
    () =>
      buildMemoText({
        scoreRows,
        weights,
        generatedAt: new Date().toLocaleString(),
        disqualified,
        sensitivity,
        riskById,
      }),
    [scoreRows, weights, disqualified, sensitivity, riskById],
  )

  const exportMemo = () => {
    const blob = new Blob([memoText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tenderloom-decision-memo-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)

    record('Memo exported', 'Decision memo exported as .txt')
  }

  const applyWeights = () =>
    record(
      'Weight profile applied',
      `Cost ${weights.cost}% | Speed ${weights.speed}% | Compliance ${weights.compliance}%`,
    )

  const goToVendors = () => navigate('vendors')
  const goToCompliance = () => navigate('compliance')

  return (
    <AppShell
      view={view}
      onNavigate={navigate}
      badges={{ vendors: vendors.length, compliance: disqualified.length }}
      status={tenderStatus(vendors.length, eligibleCount)}
    >
      {view === 'overview' && (
        <OverviewView
          kpis={kpis}
          scoreRows={scoreRows}
          weightsApplied={events.some((event) => event.action === 'Weight profile applied')}
          memoExported={events.some((event) => event.action === 'Memo exported')}
          onNavigate={navigate}
          onLoadSample={loadSample}
        />
      )}
      {view === 'vendors' && (
        <VendorsView
          vendors={vendors}
          riskById={riskById}
          onAdd={addVendor}
          onUpdate={updateVendor}
          onRemove={removeVendor}
          onLoadSample={loadSample}
          onRecord={record}
        />
      )}
      {view === 'scoring' && (
        <ScoringView
          weights={weights}
          rows={scoreRows}
          disqualified={disqualified}
          sensitivity={sensitivity}
          riskById={riskById}
          onWeightsChange={setWeights}
          onApplyWeights={applyWeights}
          onAddVendors={goToVendors}
          onReviewCompliance={goToCompliance}
        />
      )}
      {view === 'compliance' && (
        <ComplianceView
          vendors={vendors}
          criteria={criteria}
          assessments={assessments}
          onUpdateResponse={updateCompliance}
          onAddCriterion={addCriterion}
          onUpdateCriterion={updateCriterion}
          onRemoveCriterion={removeCriterion}
          onResetCriteria={resetCriteria}
          onLoadSample={loadSample}
          onAddVendors={goToVendors}
        />
      )}
      {view === 'memo' && (
        <MemoView
          memoText={memoText}
          hasRecommendation={scoreRows.length > 0}
          onExport={exportMemo}
          onAddVendors={goToVendors}
        />
      )}
      {view === 'audit' && <AuditView events={events} />}
    </AppShell>
  )
}

export default App
