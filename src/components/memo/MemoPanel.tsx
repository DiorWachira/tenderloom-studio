import { MemoArt } from '../../assets/illustrations/EmptyArt'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Panel } from '../ui/Panel'

type MemoPanelProps = {
  memoText: string
  hasRecommendation: boolean
  onExport: () => void
  onAddVendors: () => void
}

export function MemoPanel({ memoText, hasRecommendation, onExport, onAddVendors }: MemoPanelProps) {
  return (
    <Panel
      title="Decision memo export"
      description="A submission-ready summary with the weighted rationale and top-ranked suppliers."
      actions={
        <Button onClick={onExport} disabled={!hasRecommendation}>
          Export memo as .txt
        </Button>
      }
    >
      {!hasRecommendation && (
        <EmptyState
          art={<MemoArt />}
          title="No recommendation to write up"
          action={<Button variant="secondary" onClick={onAddVendors}>Add vendors</Button>}
        >
          Add vendors first. The memo is generated from the live scoring results.
        </EmptyState>
      )}
      <div className="sheet" hidden={!hasRecommendation}>
        <label htmlFor="memo-preview" className="visually-hidden">
          Decision memo preview
        </label>
        <textarea id="memo-preview" value={memoText} readOnly rows={16} />
      </div>
    </Panel>
  )
}
