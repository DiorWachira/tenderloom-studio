import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { RESPONSE_STATUSES, UNKNOWN_RESPONSE, criterionResponseSchema, effectiveExpiry } from '../../domain/compliance'
import type { ComplianceCriterion, CriterionResponse, ResponseStatus } from '../../domain/compliance'
import type { VendorRecord } from '../../domain/schemas'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { STATUS_META } from './statusMeta'

type EvidenceEditorProps = {
  vendor: VendorRecord
  criterion: ComplianceCriterion
  onSave: (response: CriterionResponse) => void
  onClose: () => void
}

type Draft = {
  status: ResponseStatus
  evidenceRef: string
  evidenceNote: string
  evidenceDate: string
  expiresAt: string
}

const toDraft = (response: CriterionResponse): Draft => ({
  status: response.status,
  evidenceRef: response.evidenceRef,
  evidenceNote: response.evidenceNote,
  evidenceDate: response.evidenceDate ?? '',
  expiresAt: response.expiresAt ?? '',
})

const STATUS_HINT: Record<ResponseStatus, string> = {
  met: 'Fully satisfied with evidence.',
  partial: 'Some requirements satisfied.',
  'not-met': 'Requirement not satisfied.',
  unknown: 'No answer yet.',
}

export function EvidenceEditor({ vendor, criterion, onSave, onClose }: EvidenceEditorProps) {
  const current = vendor.compliance[criterion.id] ?? UNKNOWN_RESPONSE
  const [draft, setDraft] = useState<Draft>(() => toDraft(current))
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const id = useId()

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const candidate = {
      status: draft.status,
      evidenceRef: draft.evidenceRef.trim(),
      evidenceNote: draft.evidenceNote.trim(),
      ...(draft.evidenceDate ? { evidenceDate: draft.evidenceDate } : {}),
      ...(draft.expiresAt ? { expiresAt: draft.expiresAt } : {}),
    }
    const parsed = criterionResponseSchema.safeParse(candidate)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    if (parsed.data.evidenceDate && parsed.data.expiresAt && parsed.data.expiresAt < parsed.data.evidenceDate) {
      setError('The expiry date cannot be before the evidence date.')
      return
    }
    setError(null)
    onSave(parsed.data)
  }

  const derivedExpiry =
    !draft.expiresAt && draft.evidenceDate
      ? effectiveExpiry(criterion, { ...UNKNOWN_RESPONSE, evidenceDate: draft.evidenceDate })
      : null

  return (
    <Panel
      title="Evidence"
      className="evidence"
      actions={
        <Button variant="ghost" className="btn--small" onClick={onClose}>
          Close
        </Button>
      }
    >
      <h3 ref={headingRef} tabIndex={-1} className="evidence__title">
        {vendor.vendorName} <span aria-hidden="true">&middot;</span>{' '}
        <span className="evidence__criterion">{criterion.label}</span>
      </h3>
      <p className="evidence__meta">
        {criterion.kind === 'mandatory' ? 'Mandatory gate: failing it disqualifies the vendor.' : `Scored criterion, weight ${criterion.weight}.`}
        {criterion.evidenceRequired ? ' Evidence reference required.' : ''}
        {criterion.validityDays ? ` Evidence valid for ${criterion.validityDays} days.` : ''}
      </p>

      <form className="evidence__form" onSubmit={submit} noValidate>
        <fieldset className="status-picker">
          <legend>Status</legend>
          {RESPONSE_STATUSES.map((status) => (
            <label key={status} className="status-picker__option" data-tone={STATUS_META[status].tone}>
              <input
                type="radio"
                name={`${id}-status`}
                value={status}
                checked={draft.status === status}
                onChange={() => set('status', status)}
              />
              <span className="status-picker__label">{STATUS_META[status].label}</span>
              <span className="status-picker__hint">{STATUS_HINT[status]}</span>
            </label>
          ))}
        </fieldset>

        <div className="form-grid">
          <div className="field form-grid__full">
            <label htmlFor={`${id}-ref`}>Evidence reference</label>
            <input
              id={`${id}-ref`}
              placeholder="e.g. certificate number or document link"
              value={draft.evidenceRef}
              maxLength={120}
              onChange={(event) => set('evidenceRef', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-date`}>Evidence date</label>
            <input
              id={`${id}-date`}
              type="date"
              value={draft.evidenceDate}
              onChange={(event) => set('evidenceDate', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-expiry`}>Expires on</label>
            <input
              id={`${id}-expiry`}
              type="date"
              value={draft.expiresAt}
              aria-describedby={`${id}-expiry-hint`}
              onChange={(event) => set('expiresAt', event.target.value)}
            />
            <p id={`${id}-expiry-hint`} className="field__hint">
              {derivedExpiry
                ? `Leave blank to use the validity period (expires ${derivedExpiry}).`
                : 'Optional. Leave blank if the evidence does not expire.'}
            </p>
          </div>
          <div className="field form-grid__full">
            <label htmlFor={`${id}-note`}>Assessor note</label>
            <textarea
              id={`${id}-note`}
              rows={2}
              maxLength={280}
              value={draft.evidenceNote}
              onChange={(event) => set('evidenceNote', event.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="field__error">
            {error}
          </p>
        )}

        <div className="form-actions">
          <Button type="submit">Save evidence</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  )
}
