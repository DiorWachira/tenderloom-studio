import type { ScoreWeights, VendorScore } from './scoring'

type MemoInput = {
  scoreRows: VendorScore[]
  weights: ScoreWeights
  generatedAt: string
}

export function buildMemoText({ scoreRows, weights, generatedAt }: MemoInput): string {
  const [leader, runnerUp] = scoreRows

  const shortlist = scoreRows
    .slice(0, 3)
    .map(
      (row, index) =>
        `${index + 1}. ${row.vendorName} | total ${row.totalScore} | cost ${row.costScore} | speed ${row.speedScore} | compliance ${row.complianceScore}`,
    )
    .join('\n')

  const leadLine = leader
    ? `Recommended vendor: ${leader.vendorName} (weighted score ${leader.totalScore})`
    : 'Recommended vendor: not available yet.'

  const marginLines = runnerUp
    ? [
        `Lead margin vs ${runnerUp.vendorName}: ${Math.round((leader.totalScore - runnerUp.totalScore) * 10) / 10} points`,
      ]
    : []

  return [
    'Tenderloom Studio - Decision Memo',
    `Generated: ${generatedAt}`,
    '',
    'Weight profile:',
    `- Cost: ${weights.cost}%`,
    `- Speed: ${weights.speed}%`,
    `- Compliance: ${weights.compliance}%`,
    '',
    leadLine,
    ...marginLines,
    '',
    'Shortlist:',
    shortlist || 'No vendor scores available.',
    '',
    'Notes:',
    '- This memo is generated from static local scoring data.',
    '- Validate final award decision with governance and legal review.',
  ].join('\n')
}
