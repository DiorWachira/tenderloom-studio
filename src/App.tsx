import { useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { computeKpis, tenderStatus } from './domain/kpis'
import { buildMemoText } from './domain/memo'
import { DEFAULT_WEIGHTS, calculateWeightedScores } from './domain/scoring'
import type { ScoreWeights } from './domain/scoring'
import { useAuditTrail } from './hooks/useAuditTrail'
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
  const { vendors, addVendor, updateVendor, removeVendor, loadSample } = useVendors(record)

  const scoreRows = useMemo(() => calculateWeightedScores(vendors, weights), [vendors, weights])
  const kpis = useMemo(() => computeKpis(vendors, scoreRows), [vendors, scoreRows])

  const memoText = useMemo(
    () => buildMemoText({ scoreRows, weights, generatedAt: new Date().toLocaleString() }),
    [scoreRows, weights],
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

  return (
    <AppShell
      view={view}
      onNavigate={navigate}
      badges={{ vendors: vendors.length }}
      status={tenderStatus(vendors.length)}
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
          onWeightsChange={setWeights}
          onApplyWeights={applyWeights}
          onAddVendors={goToVendors}
        />
      )}
      {view === 'compliance' && <ComplianceView />}
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
