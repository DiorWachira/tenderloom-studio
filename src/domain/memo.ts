import type { RiskLevel } from './compliance'
import type { ScoreWeights, SensitivityResult, VendorScore, WeightShift } from './scoring'

export type DisqualifiedVendor = { vendorName: string; reasons: string[] }

type MemoInput = {
  scoreRows: VendorScore[]
  weights: ScoreWeights
  generatedAt: string
  disqualified: DisqualifiedVendor[]
  sensitivity: SensitivityResult
  riskById: Record<string, RiskLevel>
}

export function describeShift(shift: WeightShift): string {
  const direction = shift.delta > 0 ? 'rises' : 'falls'
  const points = Math.abs(shift.delta)
  return `If the ${shift.weight} weight ${direction} by ${points} point${points === 1 ? '' : 's'}, ${shift.newLeaderName} becomes the leader.`
}

export function describeSensitivity(sensitivity: SensitivityResult): string | null {
  const shift = sensitivity.minimumShift
  if (!sensitivity.leaderId) {
    return null
  }
  if (!shift) {
    return 'Stable: no single weight change within 0-100 changes the leader.'
  }
  return `${sensitivity.fragile ? 'Fragile' : 'Stable'}: ${describeShift(shift).replace(/^If/, 'if')}`
}

export function buildMemoText({
  scoreRows,
  weights,
  generatedAt,
  disqualified,
  sensitivity,
  riskById,
}: MemoInput): string {
  const [leader, runnerUp] = scoreRows

  const shortlist = scoreRows
    .slice(0, 3)
    .map(
      (row) =>
        `${row.rank}. ${row.vendorName} | total ${row.totalScore} | cost ${row.costScore} | speed ${row.speedScore} | compliance ${row.complianceScore} | risk ${riskById[row.id] ?? 'n/a'}`,
    )
    .join('\n')

  const leadLines = leader
    ? [
        `Recommended vendor: ${leader.vendorName} (weighted score ${leader.totalScore}, ${riskById[leader.id] ?? 'unassessed'} risk)`,
      ]
    : ['Recommended vendor: not available yet.']

  if (runnerUp) {
    leadLines.push(
      `Lead margin vs ${runnerUp.vendorName}: ${Math.round((leader.totalScore - runnerUp.totalScore) * 10) / 10} points`,
    )
  }

  const sensitivityLine = describeSensitivity(sensitivity)
  if (sensitivityLine) {
    leadLines.push(`Sensitivity: ${sensitivityLine}`)
  }

  const disqualifiedLines = disqualified.length
    ? disqualified.map((vendor) => `- ${vendor.vendorName}: ${vendor.reasons.join(' ')}`)
    : ['- None']

  return [
    'Tenderloom Studio - Decision Memo',
    `Generated: ${generatedAt}`,
    '',
    'Weight profile:',
    `- Cost: ${weights.cost}%`,
    `- Speed: ${weights.speed}%`,
    `- Compliance: ${weights.compliance}%`,
    '',
    ...leadLines,
    '',
    'Shortlist:',
    shortlist || 'No eligible vendor scores available.',
    '',
    'Excluded by mandatory compliance gates:',
    ...disqualifiedLines,
    '',
    'Notes:',
    '- This memo is generated from static local scoring data.',
    '- The compliance checklist is illustrative and is not legal advice.',
    '- Validate final award decision with governance and legal review.',
  ].join('\n')
}
