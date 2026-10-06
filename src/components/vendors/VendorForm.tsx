import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { emptyVendorForm, vendorSchema } from '../../domain/schemas'
import type { VendorFormValues, VendorInput, VendorRecord } from '../../domain/schemas'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'

type VendorFormProps = {
  editing: VendorRecord | null
  onSubmit: (values: VendorInput) => void
  onCancelEdit: () => void
}

function toFormValues(record: VendorRecord): VendorFormValues {
  return {
    vendorName: record.vendorName,
    serviceCategory: record.serviceCategory,
    contactEmail: record.contactEmail,
    bidAmount: record.bidAmount,
    deliveryDays: record.deliveryDays,
    compliant: record.compliant,
    notes: record.notes ?? '',
  }
}

export function VendorForm({ editing, onSubmit, onCancelEdit }: VendorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues, unknown, VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: emptyVendorForm,
  })

  useEffect(() => {
    reset(editing ? toFormValues(editing) : emptyVendorForm)
  }, [editing, reset])

  const submit = handleSubmit((values) => {
    onSubmit(values)
    reset(emptyVendorForm)
  })

  const invalid = (name: keyof VendorFormValues) => (errors[name] ? true : undefined)
  const describedBy = (name: keyof VendorFormValues) => (errors[name] ? `${name}-error` : undefined)
  const error = (name: keyof VendorFormValues) =>
    errors[name] && (
      <p id={`${name}-error`} role="alert" className="field__error">
        {errors[name]?.message}
      </p>
    )

  return (
    <Panel
      title={editing ? 'Edit vendor profile' : 'Vendor intake'}
      description={
        editing
          ? `Updating ${editing.vendorName}. Save to apply, or cancel to discard.`
          : 'Capture each bid in the same structure so comparisons stay fair and auditable.'
      }
    >
      <form className="form-grid" onSubmit={submit} noValidate>
        <div className="field form-grid__full">
          <label htmlFor="vendorName">Vendor name</label>
          <input
            id="vendorName"
            autoComplete="organization"
            aria-invalid={invalid('vendorName')}
            aria-describedby={describedBy('vendorName')}
            {...register('vendorName')}
          />
          {error('vendorName')}
        </div>

        <div className="field">
          <label htmlFor="serviceCategory">Service category</label>
          <input
            id="serviceCategory"
            aria-invalid={invalid('serviceCategory')}
            aria-describedby={describedBy('serviceCategory')}
            {...register('serviceCategory')}
          />
          {error('serviceCategory')}
        </div>

        <div className="field">
          <label htmlFor="contactEmail">Contact email</label>
          <input
            id="contactEmail"
            type="email"
            autoComplete="email"
            aria-invalid={invalid('contactEmail')}
            aria-describedby={describedBy('contactEmail')}
            {...register('contactEmail')}
          />
          {error('contactEmail')}
        </div>

        <div className="field">
          <label htmlFor="bidAmount">Bid amount (USD)</label>
          <input
            id="bidAmount"
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            aria-invalid={invalid('bidAmount')}
            aria-describedby={describedBy('bidAmount')}
            {...register('bidAmount')}
          />
          {error('bidAmount')}
        </div>

        <div className="field">
          <label htmlFor="deliveryDays">Delivery days</label>
          <input
            id="deliveryDays"
            type="number"
            step="1"
            min="1"
            inputMode="numeric"
            aria-invalid={invalid('deliveryDays')}
            aria-describedby={describedBy('deliveryDays')}
            {...register('deliveryDays')}
          />
          {error('deliveryDays')}
        </div>

        <div className="field form-grid__full">
          <label htmlFor="compliant">Compliance status</label>
          <select id="compliant" {...register('compliant')}>
            <option value="yes">Compliant</option>
            <option value="no">Not compliant</option>
          </select>
        </div>

        <div className="field form-grid__full">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            rows={3}
            aria-invalid={invalid('notes')}
            aria-describedby={describedBy('notes')}
            {...register('notes')}
          />
          {error('notes')}
        </div>

        <div className="form-grid__full form-actions">
          <Button type="submit">{editing ? 'Save Vendor' : 'Add Vendor'}</Button>
          {editing && (
            <Button variant="ghost" onClick={onCancelEdit}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>
    </Panel>
  )
}
