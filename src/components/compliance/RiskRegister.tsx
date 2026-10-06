import type { VendorAssessment } from '../../domain/compliance'
import type { VendorRecord } from '../../domain/schemas'
import { Avatar } from '../ui/Avatar'
import { Chip } from '../ui/Chip'
import { Panel } from '../ui/Panel'
import { RISK_META, SEVERITY_META } from './statusMeta'

type RiskRegisterProps = {
  vendors: VendorRecord[]
  assessments: Record<string, VendorAssessment>
}

const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const

export function RiskRegister({ vendors, assessments }: RiskRegisterProps) {
  const ordered = [...vendors].sort(
    (a, b) =>
      RISK_ORDER[assessments[a.id].riskLevel] - RISK_ORDER[assessments[b.id].riskLevel] ||
      a.vendorName.localeCompare(b.vendorName),
  )

  return (
    <Panel title="Risk register" description="Every finding, highest risk first, with the reason it was raised.">
      <ul className="register">
        {ordered.map((vendor) => {
          const assessment = assessments[vendor.id]
          const risk = RISK_META[assessment.riskLevel]
          return (
            <li key={vendor.id} className="register__vendor">
              <div className="register__head">
                <Avatar name={vendor.vendorName} size="sm" />
                <h3>{vendor.vendorName}</h3>
                <Chip tone={risk.tone}>{risk.label}</Chip>
              </div>
              {assessment.findings.length === 0 ? (
                <p className="register__clear">No findings. Every criterion is met with valid evidence.</p>
              ) : (
                <ul className="register__findings" aria-label={`Findings for ${vendor.vendorName}`}>
                  {assessment.findings.map((finding, index) => (
                    <li key={`${finding.code}-${finding.criterionId ?? index}`} data-severity={finding.severity}>
                      <span className="register__severity">{SEVERITY_META[finding.severity].label}</span>
                      <span>{finding.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
