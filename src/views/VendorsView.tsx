import { useState } from 'react'
import type { VendorInput, VendorRecord } from '../domain/schemas'
import { VendorForm } from '../components/vendors/VendorForm'
import { VendorRoster } from '../components/vendors/VendorRoster'
import { PageHeader } from '../components/ui/PageHeader'

type VendorsViewProps = {
  vendors: VendorRecord[]
  onAdd: (values: VendorInput) => void
  onUpdate: (id: string, values: VendorInput) => void
  onRemove: (id: string) => void
  onLoadSample: () => void
  onRecord: (action: string, detail: string) => void
}

export function VendorsView({ vendors, onAdd, onUpdate, onRemove, onLoadSample, onRecord }: VendorsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = vendors.find((vendor) => vendor.id === editingId) ?? null

  return (
    <>
      <PageHeader eyebrow="Vendors" title="Vendor intake and roster">
        Record every bid in one consistent structure, then compare them fairly.
      </PageHeader>
      <div className="split">
        <VendorForm
          editing={editing}
          onCancelEdit={() => setEditingId(null)}
          onSubmit={(values) => {
            if (editing) {
              onUpdate(editing.id, values)
              setEditingId(null)
            } else {
              onAdd(values)
            }
          }}
        />
        <VendorRoster
          vendors={vendors}
          editingId={editingId}
          onLoadSample={onLoadSample}
          onEdit={(vendor) => {
            setEditingId(vendor.id)
            onRecord('Edit opened', `${vendor.vendorName} loaded into edit form`)
          }}
          onDelete={(id) => {
            onRemove(id)
            if (id === editingId) {
              setEditingId(null)
            }
          }}
        />
      </div>
    </>
  )
}
