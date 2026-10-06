import { MemoPanel } from '../components/memo/MemoPanel'
import { PageHeader } from '../components/ui/PageHeader'

type MemoViewProps = {
  memoText: string
  hasRecommendation: boolean
  onExport: () => void
  onAddVendors: () => void
}

export function MemoView(props: MemoViewProps) {
  return (
    <>
      <PageHeader eyebrow="Memo" title="Decision memo">
        Turn the current ranking into a written recommendation for approvers.
      </PageHeader>
      <MemoPanel {...props} />
    </>
  )
}
