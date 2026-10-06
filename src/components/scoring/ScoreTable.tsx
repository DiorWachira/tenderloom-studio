import { ScoringArt } from '../../assets/illustrations/EmptyArt'
import type { VendorScore } from '../../domain/scoring'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { EmptyState } from '../ui/EmptyState'
import { Panel } from '../ui/Panel'
import { ScoreBar } from '../ui/ScoreBar'

type ScoreTableProps = {
  rows: VendorScore[]
  onAddVendors: () => void
}

export function ScoreTable({ rows, onAddVendors }: ScoreTableProps) {
  const [leader, runnerUp] = rows
  const margin = runnerUp ? Math.round((leader.totalScore - runnerUp.totalScore) * 10) / 10 : 0

  return (
    <Panel title="Scoring matrix" description="Higher is better. Every score is out of 100.">
      {rows.length === 0 ? (
        <EmptyState
          art={<ScoringArt />}
          title="Nothing to rank yet"
          action={<Button onClick={onAddVendors}>Add vendors</Button>}
        >
          Add vendors to generate a weighted ranking and recommendation.
        </EmptyState>
      ) : (
        <>
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
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} data-leader={index === 0}>
                    <td className="num">{index + 1}</td>
                    <th scope="row">
                      <span className="cell-vendor">
                        <Avatar name={row.vendorName} size="sm" />
                        {row.vendorName}
                        {index === 0 && <Chip tone="brass">Leader</Chip>}
                      </span>
                    </th>
                    <td>
                      <span className="cell-score">
                        <strong className="num">{row.totalScore}</strong>
                        <ScoreBar value={row.totalScore} />
                      </span>
                    </td>
                    <td className="num">{row.costScore}</td>
                    <td className="num">{row.speedScore}</td>
                    <td className="num">{row.complianceScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="callout" role="status" aria-live="polite">
            <h3>Recommendation summary</h3>
            <p>
              <strong>{leader.vendorName}</strong> is currently ranked first with a weighted score
              of <strong>{leader.totalScore}</strong>.
            </p>
            {runnerUp ? (
              <p>
                Lead margin over {runnerUp.vendorName}: <strong>{margin}</strong> points.
              </p>
            ) : (
              <p>Add at least one more vendor to see comparative margin.</p>
            )}
          </div>
        </>
      )}
    </Panel>
  )
}
