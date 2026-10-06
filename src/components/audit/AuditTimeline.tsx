import { AuditArt } from '../../assets/illustrations/EmptyArt'
import type { AuditEvent } from '../../domain/schemas'
import { EmptyState } from '../ui/EmptyState'
import { Panel } from '../ui/Panel'

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <Panel
      title="Audit trail timeline"
      description={events.length ? 'Newest first. The last 40 actions are kept in this browser.' : undefined}
    >
      {events.length === 0 ? (
        <EmptyState art={<AuditArt />} title="No timeline events yet">
          Actions will be recorded here as you add vendors, adjust weights, and export memos.
        </EmptyState>
      ) : (
        <ol className="timeline">
          {events.map((event) => (
            <li key={event.id} className="timeline__item">
              <p className="timeline__action">{event.action}</p>
              <p className="timeline__detail">{event.detail}</p>
              <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
