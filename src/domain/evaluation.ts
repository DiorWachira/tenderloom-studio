import { assessTender } from './compliance'
import type { ComplianceCriterion, RiskLevel, VendorAssessment } from './compliance'
import type { DisqualifiedVendor } from './memo'
import type { VendorRecord } from './schemas'
import { analyseSensitivity, calculateWeightedScores } from './scoring'
import type { ScoreWeights, ScoringInput, SensitivityResult, VendorScore } from './scoring'

export type TenderEvaluation = {
  assessments: Record<string, VendorAssessment>
  scoreRows: VendorScore[]
  disqualified: DisqualifiedVendor[]
  sensitivity: SensitivityResult
  eligibleCount: number
  riskById: Record<string, RiskLevel>
}

/** Single pipeline: compliance gates first, then weighted ranking of eligible vendors only. */
export function evaluateTender(
  vendors: VendorRecord[],
  criteria: ComplianceCriterion[],
  weights: ScoreWeights,
  now: Date,
): TenderEvaluation {
  const assessments = assessTender(vendors, criteria, now)

  const eligibleInputs: ScoringInput[] = vendors
    .filter((vendor) => assessments[vendor.id].eligible)
    .map((vendor) => ({
      id: vendor.id,
      vendorName: vendor.vendorName,
      bidAmount: vendor.bidAmount,
      deliveryDays: vendor.deliveryDays,
      complianceScore: assessments[vendor.id].complianceScore,
    }))

  const disqualified = vendors
    .filter((vendor) => !assessments[vendor.id].eligible)
    .map((vendor) => ({
      vendorName: vendor.vendorName,
      reasons: assessments[vendor.id].findings
        .filter((finding) => finding.severity === 'critical')
        .map((finding) => finding.message),
    }))

  return {
    assessments,
    scoreRows: calculateWeightedScores(eligibleInputs, weights),
    disqualified,
    sensitivity: analyseSensitivity(eligibleInputs, weights),
    eligibleCount: eligibleInputs.length,
    riskById: Object.fromEntries(
      Object.values(assessments).map((assessment) => [assessment.vendorId, assessment.riskLevel]),
    ),
  }
}
