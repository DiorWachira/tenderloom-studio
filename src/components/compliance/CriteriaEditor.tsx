import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { CRITERION_CATEGORIES, criterionSchema } from '../../domain/compliance'
import type { ComplianceCriterion } from '../../domain/compliance'
import type { CriterionDraft } from '../../hooks/useCriteria'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Panel } from '../ui/Panel'

type CriteriaEditorProps = {
  criteria: ComplianceCriterion[]
  onAdd: (draft: CriterionDraft) => void
  onUpdate: (id: string, draft: CriterionDraft) => void
  onRemove: (id: string) => void
  onReset: () => void
}

type FormState = {
  label: string
  category: ComplianceCriterion['category']
  kind: ComplianceCriterion['kind']
  weight: string
  validityDays: string
  evidenceRequired: boolean
}

const emptyForm: FormState = {
  label: '',
  category: 'operational',
  kind: 'scored',
  weight: '10',
  validityDays: '',
  evidenceRequired: true,
}

const toForm = (criterion: ComplianceCriterion): FormState => ({
  label: criterion.label,
  category: criterion.category,
  kind: criterion.kind,
  weight: String(criterion.weight),
  validityDays: criterion.validityDays ? String(criterion.validityDays) : '',
  evidenceRequired: criterion.evidenceRequired,
})

const categoryLabel = (category: string) => category.replace('-', ' ')

export function CriteriaEditor({ criteria, onAdd, onUpdate, onRemove, onReset }: CriteriaEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  const scoredTotal = criteria.filter((c) => c.kind === 'scored').reduce((sum, c) => sum + c.weight, 0)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const close = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const draft = {
      label: form.label.trim(),
      category: form.category,
      kind: form.kind,
      weight: form.kind === 'mandatory' ? 0 : Number(form.weight),
      evidenceRequired: form.evidenceRequired,
      ...(form.validityDays ? { validityDays: Number(form.validityDays) } : {}),
    }
    const parsed = criterionSchema.omit({ id: true }).safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    if (editingId) {
      onUpdate(editingId, parsed.data)
    } else {
      onAdd(parsed.data)
    }
    close()
  }

  return (
    <Panel
      title="Criteria"
      description="Mandatory gates are pass/fail. Scored criteria share the compliance score by weight."
      actions={
        <Button variant="ghost" className="btn--small" onClick={onReset}>
          Reset to baseline
        </Button>
      }
    >
      <p className="criteria__note">
        The baseline checklist is illustrative and is not legal advice. Scored weights total{' '}
        <strong className="num">{scoredTotal}</strong>; they are normalised, so any total works.
      </p>

      <ul className="criteria">
        {criteria.map((criterion) => (
          <li key={criterion.id} className="criteria__item" data-editing={criterion.id === editingId}>
            <div className="criteria__body">
              <p className="criteria__label">{criterion.label}</p>
              <p className="criteria__meta">
                <Chip tone={criterion.kind === 'mandatory' ? 'accent' : 'neutral'}>
                  {criterion.kind === 'mandatory' ? 'Mandatory gate' : `Weight ${criterion.weight}`}
                </Chip>
                <span>{categoryLabel(criterion.category)}</span>
                {criterion.validityDays && <span>valid {criterion.validityDays} days</span>}
                {criterion.evidenceRequired && <span>evidence required</span>}
              </p>
            </div>
            <div className="criteria__actions">
              <Button
                variant="ghost"
                className="btn--small"
                aria-label={`Edit ${criterion.label}`}
                onClick={() => {
                  setEditingId(criterion.id)
                  setForm(toForm(criterion))
                  setError(null)
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                className="btn--small"
                aria-label={`Remove ${criterion.label}`}
                onClick={() => {
                  onRemove(criterion.id)
                  if (criterion.id === editingId) {
                    close()
                  }
                }}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <form className="criteria__form" onSubmit={submit} noValidate aria-label={editingId ? 'Edit criterion' : 'Add criterion'}>
        <h3>{editingId ? 'Edit criterion' : 'Add a criterion'}</h3>
        <div className="form-grid">
          <div className="field form-grid__full">
            <label htmlFor={`${id}-label`}>Criterion label</label>
            <input id={`${id}-label`} value={form.label} maxLength={80} onChange={(e) => set('label', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-kind`}>Type</label>
            <select
              id={`${id}-kind`}
              value={form.kind}
              onChange={(e) => set('kind', e.target.value as FormState['kind'])}
            >
              <option value="scored">Scored</option>
              <option value="mandatory">Mandatory gate</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${id}-weight`}>Weight</label>
            <input
              id={`${id}-weight`}
              type="number"
              min="0"
              max="100"
              inputMode="numeric"
              disabled={form.kind === 'mandatory'}
              value={form.kind === 'mandatory' ? '0' : form.weight}
              onChange={(e) => set('weight', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-category`}>Category</label>
            <select
              id={`${id}-category`}
              value={form.category}
              onChange={(e) => set('category', e.target.value as FormState['category'])}
            >
              {CRITERION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${id}-validity`}>Validity (days)</label>
            <input
              id={`${id}-validity`}
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="No expiry"
              value={form.validityDays}
              onChange={(e) => set('validityDays', e.target.value)}
            />
          </div>
          <label className="checkbox form-grid__full">
            <input
              type="checkbox"
              checked={form.evidenceRequired}
              onChange={(e) => set('evidenceRequired', e.target.checked)}
            />
            Evidence reference required
          </label>
        </div>
        {error && (
          <p role="alert" className="field__error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button type="submit" variant="secondary">
            {editingId ? 'Save criterion' : 'Add criterion'}
          </Button>
          {editingId && (
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Panel>
  )
}
