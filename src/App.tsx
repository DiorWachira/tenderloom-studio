import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import './App.css'
import { calculateWeightedScores } from './scoring'

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
const AUDIT_STORAGE_KEY = 'tenderloom.audit.v1'

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

const auditEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.string(),
  detail: z.string(),
})

type AuditEvent = z.infer<typeof auditEventSchema>

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

function readStoredAuditTrail(): AuditEvent[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY)
  if (!raw) {
    return []
  }

  const parsed = z.array(auditEventSchema).safeParse(JSON.parse(raw))
  if (!parsed.success) {
    return []
  }

  return parsed.data
}

function App() {
  const [vendors, setVendors] = useState<VendorRecord[]>(() => readStoredVendors())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [weights, setWeights] = useState({ cost: 45, speed: 30, compliance: 25 })
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>(() => readStoredAuditTrail())

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

  useEffect(() => {
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditTrail))
  }, [auditTrail])

  const sortedVendors = useMemo(
    () => [...vendors].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [vendors],
  )

  const scoreRows = useMemo(
    () => calculateWeightedScores(sortedVendors, weights),
    [sortedVendors, weights],
  )

  const leadVendor = scoreRows[0]
  const runnerUp = scoreRows[1]
  const leadMargin = runnerUp ? Math.round((leadVendor.totalScore - runnerUp.totalScore) * 10) / 10 : 0

  const appendAuditEvent = (action: string, detail: string) => {
    setAuditTrail((current) => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        detail,
      },
      ...current,
    ].slice(0, 40))
  }

  const memoText = useMemo(() => {
    const generatedAt = new Date().toLocaleString()
    const shortlist = scoreRows
      .slice(0, 3)
      .map(
        (row, index) =>
          `${index + 1}. ${row.vendorName} | total ${row.totalScore} | cost ${row.costScore} | speed ${row.speedScore} | compliance ${row.complianceScore}`,
      )
      .join('\n')

    const leadLine = leadVendor
      ? `Recommended vendor: ${leadVendor.vendorName} (weighted score ${leadVendor.totalScore})`
      : 'Recommended vendor: not available yet.'

    return [
      'Tenderloom Studio - Decision Memo',
      `Generated: ${generatedAt}`,
      '',
      'Weight profile:',
      `- Cost: ${weights.cost}%`,
      `- Speed: ${weights.speed}%`,
      `- Compliance: ${weights.compliance}%`,
      '',
      leadLine,
      runnerUp ? `Lead margin vs ${runnerUp.vendorName}: ${leadMargin} points` : '',
      '',
      'Shortlist:',
      shortlist || 'No vendor scores available.',
      '',
      'Notes:',
      '- This memo is generated from static local scoring data.',
      '- Validate final award decision with governance and legal review.',
    ]
      .filter(Boolean)
      .join('\n')
  }, [leadMargin, leadVendor, runnerUp, scoreRows, weights])

  const exportMemo = () => {
    const blob = new Blob([memoText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tenderloom-decision-memo-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)

    appendAuditEvent('Memo exported', 'Decision memo exported as .txt')
  }

  const onSubmit = (values: VendorInput) => {
    const now = new Date().toISOString()

    if (editingId) {
      const editedVendor = vendors.find((record) => record.id === editingId)
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
      appendAuditEvent('Vendor updated', `${editedVendor?.vendorName ?? values.vendorName} profile updated`)
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
      appendAuditEvent('Vendor added', `${values.vendorName} profile added`)
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
    appendAuditEvent('Edit opened', `${record.vendorName} loaded into edit form`)
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
    const deletedVendor = vendors.find((record) => record.id === id)
    setVendors((current) => current.filter((record) => record.id !== id))
    appendAuditEvent('Vendor deleted', `${deletedVendor?.vendorName ?? 'Unknown vendor'} removed`)
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

      <section className="matrix" aria-label="Weighted scoring matrix">
        <article className="weights-panel">
          <h2>Weight controls</h2>
          <p>
            Tune importance by procurement strategy. Scores rebalance instantly across all
            vendors.
          </p>

          <label htmlFor="weightCost">
            Cost priority: <strong>{weights.cost}%</strong>
          </label>
          <input
            id="weightCost"
            type="range"
            min="0"
            max="100"
            value={weights.cost}
            onChange={(event) =>
              setWeights((current) => ({ ...current, cost: Number(event.target.value) }))
            }
          />

          <label htmlFor="weightSpeed">
            Delivery speed priority: <strong>{weights.speed}%</strong>
          </label>
          <input
            id="weightSpeed"
            type="range"
            min="0"
            max="100"
            value={weights.speed}
            onChange={(event) =>
              setWeights((current) => ({ ...current, speed: Number(event.target.value) }))
            }
          />

          <label htmlFor="weightCompliance">
            Compliance priority: <strong>{weights.compliance}%</strong>
          </label>
          <input
            id="weightCompliance"
            type="range"
            min="0"
            max="100"
            value={weights.compliance}
            onChange={(event) =>
              setWeights((current) => ({ ...current, compliance: Number(event.target.value) }))
            }
          />
        </article>

        <article className="score-panel">
          <h2>Scoring matrix</h2>
          {scoreRows.length === 0 ? (
            <p className="empty">Add vendors to generate weighted ranking and recommendations.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Total</th>
                      <th>Cost</th>
                      <th>Speed</th>
                      <th>Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.vendorName}</td>
                        <td>{row.totalScore}</td>
                        <td>{row.costScore}</td>
                        <td>{row.speedScore}</td>
                        <td>{row.complianceScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="recommendation" role="status" aria-live="polite">
                <h3>Recommendation summary</h3>
                <p>
                  <strong>{leadVendor.vendorName}</strong> is currently ranked first with a weighted
                  score of <strong>{leadVendor.totalScore}</strong>.
                </p>
                {runnerUp ? (
                  <p>
                    Lead margin over {runnerUp.vendorName}: <strong>{leadMargin}</strong> points.
                  </p>
                ) : (
                  <p>Add at least one more vendor to see comparative margin.</p>
                )}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="delivery" aria-label="Decision output and audit evidence">
        <article className="memo-panel">
          <h2>Decision memo export</h2>
          <p>
            Generate a submission-ready summary containing weighted rationale and top-ranked
            suppliers.
          </p>
          <textarea value={memoText} readOnly rows={14} aria-label="Decision memo preview" />
          <div className="memo-actions">
            <button type="button" onClick={exportMemo}>
              Export memo as .txt
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() =>
                appendAuditEvent(
                  'Weight profile applied',
                  `Cost ${weights.cost}% | Speed ${weights.speed}% | Compliance ${weights.compliance}%`,
                )
              }
            >
              Apply weight profile
            </button>
          </div>
        </article>

        <article className="audit-panel">
          <h2>Audit trail timeline</h2>
          {auditTrail.length === 0 ? (
            <p className="empty">No timeline events yet. Actions will be recorded here.</p>
          ) : (
            <ol>
              {auditTrail.map((event) => (
                <li key={event.id}>
                  <p className="event-head">{event.action}</p>
                  <p>{event.detail}</p>
                  <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time>
                </li>
              ))}
            </ol>
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
