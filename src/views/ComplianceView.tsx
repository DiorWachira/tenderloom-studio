import { useState } from 'react'
import { ComplianceArt } from '../assets/illustrations/EmptyArt'
import { ComplianceMatrix } from '../components/compliance/ComplianceMatrix'
import type { CellRef } from '../components/compliance/ComplianceMatrix'
import { CriteriaEditor } from '../components/compliance/CriteriaEditor'
import { EvidenceEditor } from '../components/compliance/EvidenceEditor'
import { RiskRegister } from '../components/compliance/RiskRegister'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import type { ComplianceCriterion, CriterionResponse, VendorAssessment } from '../domain/compliance'
import type { VendorRecord } from '../domain/schemas'
import type { CriterionDraft } from '../hooks/useCriteria'

type ComplianceViewProps = {
  vendors: VendorRecord[]
  criteria: ComplianceCriterion[]
  assessments: Record<string, VendorAssessment>
  onUpdateResponse: (vendorId: string, criterionId: string, response: CriterionResponse) => void
  onAddCriterion: (draft: CriterionDraft) => void
  onUpdateCriterion: (id: string, draft: CriterionDraft) => void
  onRemoveCriterion: (id: string) => void
  onResetCriteria: () => void
  onLoadSample: () => void
  onAddVendors: () => void
}

export function ComplianceView({
  vendors,
  criteria,
  assessments,
  onUpdateResponse,
  onAddCriterion,
  onUpdateCriterion,
  onRemoveCriterion,
  onResetCriteria,
  onLoadSample,
  onAddVendors,
}: ComplianceViewProps) {
  const [selected, setSelected] = useState<CellRef | null>(null)
  const selectedVendor = vendors.find((vendor) => vendor.id === selected?.vendorId)
  const selectedCriterion = criteria.find((criterion) => criterion.id === selected?.criterionId)

  return (
    <>
      <PageHeader eyebrow="Compliance" title="Compliance and evidence">
        Failing any mandatory gate disqualifies a vendor. Scored criteria feed the compliance score
        used in ranking.
      </PageHeader>

      {vendors.length === 0 ? (
        <Panel title="Compliance checklist">
          <EmptyState
            art={<ComplianceArt />}
            title="No vendors to assess"
            action={
              <>
                <Button onClick={onLoadSample}>Load sample tender</Button>
                <Button variant="secondary" onClick={onAddVendors}>
                  Add vendors
                </Button>
              </>
            }
          >
            Add vendors, then record each one&rsquo;s status and evidence against the checklist.
          </EmptyState>
        </Panel>
      ) : criteria.length === 0 ? (
        <Panel title="Compliance checklist">
          <EmptyState art={<ComplianceArt />} title="The checklist is empty">
            Add a criterion below, or reset to the baseline checklist.
          </EmptyState>
        </Panel>
      ) : (
        <ComplianceMatrix
          vendors={vendors}
          criteria={criteria}
          assessments={assessments}
          selected={selected}
          onSelect={setSelected}
        />
      )}

      {selectedVendor && selectedCriterion && (
        <EvidenceEditor
          key={`${selectedVendor.id}:${selectedCriterion.id}`}
          vendor={selectedVendor}
          criterion={selectedCriterion}
          onClose={() => setSelected(null)}
          onSave={(response) => {
            onUpdateResponse(selectedVendor.id, selectedCriterion.id, response)
            setSelected(null)
          }}
        />
      )}

      <div className="split">
        {vendors.length > 0 && <RiskRegister vendors={vendors} assessments={assessments} />}
        <CriteriaEditor
          criteria={criteria}
          onAdd={onAddCriterion}
          onUpdate={onUpdateCriterion}
          onRemove={onRemoveCriterion}
          onReset={onResetCriteria}
        />
      </div>
    </>
  )
}
