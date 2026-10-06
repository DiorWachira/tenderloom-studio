import { ScoringArt } from '../../assets/illustrations/EmptyArt'
import type { RiskLevel } from '../../domain/compliance'
import { describeSensitivity, describeShift } from '../../domain/memo'
import type { DisqualifiedVendor } from '../../domain/memo'
import type { SensitivityResult, VendorScore } from '../../domain/scoring'
import { RISK_META } from '../compliance/statusMeta'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { EmptyState } from '../ui/EmptyState'
import { Panel } from '../ui/Panel'
import { ContributionBar, ContributionLegend } from './ContributionBar'

type ScoreTableProps = {
  rows: VendorScore[]
  disqualified: DisqualifiedVendor[]
  sensitivity: SensitivityResult
  riskById: Record<string, RiskLevel>
  onAddVendors: () => void
  onReviewCompliance: () => void
}

export function ScoreTable({
  rows,
  disqualified,
  sensitivity,
  riskById,
  onAddVendors,
  onReviewCompliance,
}: ScoreTableProps) {
  const [leader, runnerUp] = rows
  const margin = runnerUp ? Math.round((leader.totalScore - runnerUp.totalScore) * 10) / 10 : 0
  const sensitivityLine = describeSensitivity(sensitivity)

  return (
    <Panel
      title="Scoring matrix"
      description="Eligible vendors only. Each total is the sum of its weighted cost, speed, and compliance points."
    >
      {rows.length === 0 ? (
        <EmptyState
          art={<ScoringArt />}
          title={disqualified.length ? 'No eligible vendors' : 'Nothing to rank yet'}
          action={
            disqualified.length ? (
              <Button onClick={onReviewCompliance}>Review compliance</Button>
            ) : (
              <Button onClick={onAddVendors}>Add vendors</Button>
            )
          }
        >
          {disqualified.length
            ? 'Every vendor has failed a mandatory compliance gate, so none can be ranked.'
            : 'Add vendors to generate a weighted ranking and recommendation.'}
        </EmptyState>
      ) : (
        <>
          {sensitivity.fragile && sensitivity.minimumShift && (
            <div className="banner banner--warning" role="note">
              <strong>Fragile result.</strong> {describeShift(sensitivity.minimumShift)} Confirm the
              weights with stakeholders before deciding.
            </div>
          )}

          <ContributionLegend />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Vendor</th>
                  <th scope="col">Total</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Speed</th>
                  <th scope="col">Compliance</th>
                  <th scope="col">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const risk = riskById[row.id] ? RISK_META[riskById[row.id]] : null
                  return (
                    <tr key={row.id} data-leader={row.rank === 1}>
                      <td className="num">{row.rank}</td>
                      <th scope="row">
                        <span className="cell-vendor">
                          <Avatar name={row.vendorName} size="sm" />
                          {row.vendorName}
                          {row.rank === 1 && <Chip tone="brass">Leader</Chip>}
                        </span>
                      </th>
                      <td>
                        <span className="cell-score">
                          <strong className="num">{row.totalScore}</strong>
                          <ContributionBar contributions={row.contributions} />
                        </span>
                      </td>
                      <td className="num" title={`${row.contributions.cost} weighted points`}>
                        {row.costScore}
                      </td>
                      <td className="num" title={`${row.contributions.speed} weighted points`}>
                        {row.speedScore}
                      </td>
                      <td className="num" title={`${row.contributions.compliance} weighted points`}>
                        {row.complianceScore}
                      </td>
                      <td>{risk && <Chip tone={risk.tone}>{risk.label}</Chip>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="callout" role="status" aria-live="polite">
            <h3>Recommendation summary</h3>
            <p>
              <strong>{leader.vendorName}</strong> is currently ranked first with a weighted score
              of <strong>{leader.totalScore}</strong>
              {riskById[leader.id] ? ` and ${RISK_META[riskById[leader.id]].label.toLowerCase()}` : ''}.
            </p>
            {runnerUp ? (
              <p>
                Lead margin over {runnerUp.vendorName}: <strong>{margin}</strong> points.
              </p>
            ) : (
              <p>Add at least one more eligible vendor to see comparative margin.</p>
            )}
            {sensitivityLine && !sensitivity.fragile && <p>{sensitivityLine}</p>}
          </div>
        </>
      )}

      {disqualified.length > 0 && (
        <section className="excluded" aria-labelledby="excluded-heading">
          <h3 id="excluded-heading">Excluded by mandatory gates</h3>
          <ul>
            {disqualified.map((vendor) => (
              <li key={vendor.vendorName}>
                <Avatar name={vendor.vendorName} size="sm" />
                <div>
                  <p className="excluded__name">{vendor.vendorName}</p>
                  {vendor.reasons.map((reason) => (
                    <p key={reason} className="excluded__reason">
                      {reason}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Panel>
  )
}
