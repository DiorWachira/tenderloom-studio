import { ComplianceArt } from '../../assets/illustrations/EmptyArt'
import { Chip } from '../ui/Chip'
import { EmptyState } from '../ui/EmptyState'
import { Panel } from '../ui/Panel'

export function ComplianceTeaser() {
  return (
    <Panel
      title="Compliance gates"
      actions={<Chip tone="accent">Arrives in Increment 7</Chip>}
    >
      <EmptyState art={<ComplianceArt />} title="A real compliance engine is on its way">
        Mandatory criteria, evidence expiry dates, and risk levels will replace today&rsquo;s simple
        compliant / not compliant flag. Until then, set each vendor&rsquo;s status in the Vendors
        view.
      </EmptyState>
    </Panel>
  )
}
