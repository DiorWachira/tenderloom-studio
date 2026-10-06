import { AuditTimeline } from '../components/audit/AuditTimeline'
import { PageHeader } from '../components/ui/PageHeader'
import type { AuditEvent } from '../domain/schemas'

export function AuditView({ events }: { events: AuditEvent[] }) {
  return (
    <>
      <PageHeader eyebrow="Audit trail" title="Everything that happened, in order">
        Each meaningful action is logged with a timestamp, so every decision can be traced.
      </PageHeader>
      <AuditTimeline events={events} />
    </>
  )
}
