import { ComplianceTeaser } from '../components/compliance/ComplianceTeaser'
import { PageHeader } from '../components/ui/PageHeader'

export function ComplianceView() {
  return (
    <>
      <PageHeader eyebrow="Compliance" title="Compliance and evidence">
        Where mandatory criteria, evidence, and risk will be assessed for every bid.
      </PageHeader>
      <ComplianceTeaser />
    </>
  )
}
