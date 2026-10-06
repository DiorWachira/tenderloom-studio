import { VendorsArt } from '../../assets/illustrations/EmptyArt'
import { formatDays, formatUsd } from '../../domain/format'
import type { VendorRecord } from '../../domain/schemas'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { EmptyState } from '../ui/EmptyState'
import { Panel } from '../ui/Panel'

type VendorRosterProps = {
  vendors: VendorRecord[]
  editingId: string | null
  onEdit: (vendor: VendorRecord) => void
  onDelete: (id: string) => void
  onLoadSample: () => void
}

export function VendorRoster({ vendors, editingId, onEdit, onDelete, onLoadSample }: VendorRosterProps) {
  return (
    <Panel
      title="Vendor roster"
      description={vendors.length ? `${vendors.length} bid${vendors.length === 1 ? '' : 's'} on file, newest first.` : undefined}
    >
      {vendors.length === 0 ? (
        <EmptyState
          art={<VendorsArt />}
          title="No vendors yet"
          action={<Button onClick={onLoadSample}>Load sample tender</Button>}
        >
          Capture your first profile with the intake form, or load four demo bids to explore the
          cockpit.
        </EmptyState>
      ) : (
        <ul className="roster">
          {vendors.map((vendor) => (
            <li key={vendor.id} className="roster__item" data-editing={vendor.id === editingId}>
              <Avatar name={vendor.vendorName} />
              <div className="roster__body">
                <h3>{vendor.vendorName}</h3>
                <p className="roster__meta">
                  {vendor.serviceCategory} &middot; <span className="num">{formatUsd(vendor.bidAmount)}</span>{' '}
                  &middot; {formatDays(vendor.deliveryDays)}
                </p>
                <p className="roster__email">{vendor.contactEmail}</p>
                <Chip tone={vendor.compliant === 'yes' ? 'ok' : 'risk'}>
                  {vendor.compliant === 'yes' ? 'Compliant' : 'Needs review'}
                </Chip>
              </div>
              <div className="roster__actions">
                <Button
                  variant="ghost"
                  className="btn--small"
                  aria-label={`Edit ${vendor.vendorName}`}
                  onClick={() => onEdit(vendor)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  className="btn--small"
                  aria-label={`Delete ${vendor.vendorName}`}
                  onClick={() => onDelete(vendor.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
