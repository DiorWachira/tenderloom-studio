import type { ComplianceCriterion, VendorAssessment } from '../../domain/compliance'
import type { VendorRecord } from '../../domain/schemas'
import { Avatar } from '../ui/Avatar'
import { Chip } from '../ui/Chip'
import { Panel } from '../ui/Panel'
import { EXPIRY_LABEL, RISK_META, STATUS_META } from './statusMeta'

export type CellRef = { vendorId: string; criterionId: string }

type ComplianceMatrixProps = {
  vendors: VendorRecord[]
  criteria: ComplianceCriterion[]
  assessments: Record<string, VendorAssessment>
  selected: CellRef | null
  onSelect: (cell: CellRef) => void
}

export function ComplianceMatrix({ vendors, criteria, assessments, selected, onSelect }: ComplianceMatrixProps) {
  return (
    <Panel
      title="Compliance checklist"
      description="Each cell is one vendor against one criterion. Select a cell to record its status and evidence."
    >
      <div className="table-wrap">
        <table className="matrix">
          <caption className="visually-hidden">
            Compliance status of each vendor against each criterion
          </caption>
          <thead>
            <tr>
              <th scope="col">Vendor</th>
              <th scope="col">Result</th>
              {criteria.map((criterion) => (
                <th scope="col" key={criterion.id} className="matrix__criterion">
                  <span>{criterion.label}</span>
                  <span className="matrix__kind">
                    {criterion.kind === 'mandatory' ? 'Gate' : `Weight ${criterion.weight}`}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              const assessment = assessments[vendor.id]
              const risk = RISK_META[assessment.riskLevel]
              return (
                <tr key={vendor.id}>
                  <th scope="row">
                    <span className="cell-vendor">
                      <Avatar name={vendor.vendorName} size="sm" />
                      {vendor.vendorName}
                    </span>
                  </th>
                  <td>
                    <span className="matrix__result">
                      <Chip tone={risk.tone}>{risk.label}</Chip>
                      <span className="matrix__score num">{assessment.complianceScore} / 100</span>
                    </span>
                  </td>
                  {criteria.map((criterion) => {
                    const result = assessment.results[criterion.id]
                    const status = STATUS_META[result.status]
                    const expiry = EXPIRY_LABEL[result.expiryState]
                    const isSelected =
                      selected?.vendorId === vendor.id && selected.criterionId === criterion.id
                    return (
                      <td key={criterion.id}>
                        <button
                          type="button"
                          className="matrix__cell"
                          aria-pressed={isSelected}
                          aria-label={`${vendor.vendorName}, ${criterion.label}: ${status.label}${expiry ? `, ${expiry.toLowerCase()} ${result.expiry}` : ''}`}
                          onClick={() => onSelect({ vendorId: vendor.id, criterionId: criterion.id })}
                        >
                          {result.expiryState === 'expired' ? (
                            <Chip tone="risk">Expired</Chip>
                          ) : (
                            <Chip tone={status.tone}>{status.label}</Chip>
                          )}
                          {result.expiryState === 'expiring' && (
                            <span className="matrix__expiry">Expires {result.expiry}</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
