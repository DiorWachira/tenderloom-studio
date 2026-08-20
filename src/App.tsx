import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import './App.css'

const pillars = [
  {
    title: 'Structured Vendor Intake',
    detail:
      'Capture procurement inputs in a standard format so comparisons stay fair and auditable.',
  },
  {
    title: 'Weighted Scoring Matrix',
    detail:
      'Score vendors by agreed criteria and instantly see how rank changes with business priorities.',
  },
  {
    title: 'Decision Memo Export',
    detail:
      'Generate a board-ready recommendation memo with rationale, risks, and evidence traceability.',
  },
]

const increments = [
  'Foundation architecture and workflow guardrails',
  'Vendor profile + intake form with validation',
  'Scoring matrix and recommendation engine',
  'Memo export and decision audit trail',
]

const STORAGE_KEY = 'tenderloom.vendors.v1'

const vendorSchema = z.object({
  vendorName: z.string().min(2, 'Vendor name must be at least 2 characters.'),
  serviceCategory: z.string().min(2, 'Service category is required.'),
  contactEmail: z.email('Enter a valid contact email.'),
  bidAmount: z.coerce.number().positive('Bid amount must be greater than zero.'),
  deliveryDays: z.coerce
    .number()
    .int('Delivery days must be a whole number.')
    .positive('Delivery days must be above zero.')
    .max(365, 'Delivery days cannot exceed 365.'),
  compliant: z.enum(['yes', 'no']),
  notes: z
    .string()
    .max(220, 'Notes should stay under 220 characters.')
    .optional()
    .or(z.literal('')),
})

const vendorRecordSchema = vendorSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

type VendorInput = z.infer<typeof vendorSchema>
type VendorFormValues = z.input<typeof vendorSchema>
type VendorRecord = z.infer<typeof vendorRecordSchema>

function readStoredVendors(): VendorRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  const parsed = z.array(vendorRecordSchema).safeParse(JSON.parse(raw))
  if (!parsed.success) {
    return []
  }

  return parsed.data
}

function App() {
  const [vendors, setVendors] = useState<VendorRecord[]>(() => readStoredVendors())
  const [editingId, setEditingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues, unknown, VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      vendorName: '',
      serviceCategory: '',
      contactEmail: '',
      bidAmount: 0,
      deliveryDays: 14,
      compliant: 'yes',
      notes: '',
    },
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors))
  }, [vendors])

  const sortedVendors = useMemo(
    () => [...vendors].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [vendors],
  )

  const onSubmit = (values: VendorInput) => {
    const now = new Date().toISOString()

    if (editingId) {
      setVendors((current) =>
        current.map((record) =>
          record.id === editingId
            ? {
                ...record,
                ...values,
                updatedAt: now,
              }
            : record,
        ),
      )
      setEditingId(null)
    } else {
      setVendors((current) => [
        {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          ...values,
        },
        ...current,
      ])
    }

    reset({
      vendorName: '',
      serviceCategory: '',
      contactEmail: '',
      bidAmount: 0,
      deliveryDays: 14,
      compliant: 'yes',
      notes: '',
    })
  }

  const onEdit = (record: VendorRecord) => {
    setEditingId(record.id)
    reset({
      vendorName: record.vendorName,
      serviceCategory: record.serviceCategory,
      contactEmail: record.contactEmail,
      bidAmount: record.bidAmount,
      deliveryDays: record.deliveryDays,
      compliant: record.compliant,
      notes: record.notes ?? '',
    })
  }

  const onDelete = (id: string) => {
    setVendors((current) => current.filter((record) => record.id !== id))
    if (editingId === id) {
      setEditingId(null)
      reset({
        vendorName: '',
        serviceCategory: '',
        contactEmail: '',
        bidAmount: 0,
        deliveryDays: 14,
        compliant: 'yes',
        notes: '',
      })
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <p className="kicker">Tenderloom Studio</p>
        <h1>Procurement decisions, designed for trust.</h1>
        <p className="summary">
          A premium static web cockpit for comparing vendors with transparent scoring,
          compliance checks, and decision-ready documentation.
        </p>
      </header>

      <section className="pillars" aria-label="Core capabilities">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="card">
            <h2>{pillar.title}</h2>
            <p>{pillar.detail}</p>
          </article>
        ))}
      </section>

      <section className="increment-board" aria-label="Build increments">
        <h2>Increment roadmap</h2>
        <ol>
          {increments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="workspace" aria-label="Vendor intake workspace">
        <article className="intake-panel">
          <h2>{editingId ? 'Edit Vendor Profile' : 'Vendor Intake'}</h2>
          <form className="intake-form" onSubmit={handleSubmit(onSubmit)}>
            <label htmlFor="vendorName">Vendor name</label>
            <input id="vendorName" {...register('vendorName')} />
            {errors.vendorName && <p role="alert">{errors.vendorName.message}</p>}

            <label htmlFor="serviceCategory">Service category</label>
            <input id="serviceCategory" {...register('serviceCategory')} />
            {errors.serviceCategory && <p role="alert">{errors.serviceCategory.message}</p>}

            <label htmlFor="contactEmail">Contact email</label>
            <input id="contactEmail" type="email" {...register('contactEmail')} />
            {errors.contactEmail && <p role="alert">{errors.contactEmail.message}</p>}

            <label htmlFor="bidAmount">Bid amount (USD)</label>
            <input id="bidAmount" type="number" step="1" min="0" {...register('bidAmount')} />
            {errors.bidAmount && <p role="alert">{errors.bidAmount.message}</p>}

            <label htmlFor="deliveryDays">Delivery days</label>
            <input
              id="deliveryDays"
              type="number"
              step="1"
              min="1"
              {...register('deliveryDays')}
            />
            {errors.deliveryDays && <p role="alert">{errors.deliveryDays.message}</p>}

            <label htmlFor="compliant">Compliance status</label>
            <select id="compliant" {...register('compliant')}>
              <option value="yes">Compliant</option>
              <option value="no">Not compliant</option>
            </select>

            <label htmlFor="notes">Notes</label>
            <textarea id="notes" rows={4} {...register('notes')} />
            {errors.notes && <p role="alert">{errors.notes.message}</p>}

            <div className="form-actions">
              <button type="submit">{editingId ? 'Save Vendor' : 'Add Vendor'}</button>
              {editingId && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setEditingId(null)
                    reset({
                      vendorName: '',
                      serviceCategory: '',
                      contactEmail: '',
                      bidAmount: 0,
                      deliveryDays: 14,
                      compliant: 'yes',
                      notes: '',
                    })
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="roster-panel">
          <h2>Vendor roster</h2>
          {sortedVendors.length === 0 ? (
            <p className="empty">No vendors added yet. Capture your first profile to begin.</p>
          ) : (
            <ul>
              {sortedVendors.map((vendor) => (
                <li key={vendor.id}>
                  <div>
                    <h3>{vendor.vendorName}</h3>
                    <p>
                      {vendor.serviceCategory} | ${vendor.bidAmount.toLocaleString()} |{' '}
                      {vendor.deliveryDays} days
                    </p>
                    <p>{vendor.contactEmail}</p>
                    <span className={vendor.compliant === 'yes' ? 'badge ok' : 'badge risk'}>
                      {vendor.compliant === 'yes' ? 'Compliant' : 'Needs review'}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button type="button" className="ghost" onClick={() => onEdit(vendor)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => onDelete(vendor.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <footer className="footer-note">
        Static-first architecture, GitHub Pages deploy, and CI verification from day one.
      </footer>
    </main>
  )
}

export default App
