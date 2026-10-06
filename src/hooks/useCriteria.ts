import { useCallback } from 'react'
import { z } from 'zod'
import { BASELINE_CRITERIA, criterionSchema } from '../domain/compliance'
import type { ComplianceCriterion } from '../domain/compliance'
import { STORAGE_KEYS } from '../domain/schemas'
import { usePersistentState } from './usePersistentState'

const criteriaListSchema = z.array(criterionSchema)
const baseline = () => BASELINE_CRITERIA

export type CriterionDraft = Omit<ComplianceCriterion, 'id'>
type AuditRecorder = (action: string, detail: string) => void

/** Mandatory gates are pass/fail, so their weight is always stored as zero. */
const normalise = (draft: CriterionDraft): CriterionDraft => ({
  ...draft,
  label: draft.label.trim(),
  weight: draft.kind === 'mandatory' ? 0 : draft.weight,
})

export function useCriteria(record: AuditRecorder) {
  const [criteria, setCriteria] = usePersistentState(STORAGE_KEYS.criteria, criteriaListSchema, baseline)

  const addCriterion = useCallback(
    (draft: CriterionDraft) => {
      const criterion = { ...normalise(draft), id: `criterion-${crypto.randomUUID().slice(0, 8)}` }
      setCriteria((current) => [...current, criterion])
      record('Criterion added', `${criterion.label} (${criterion.kind})`)
    },
    [record, setCriteria],
  )

  const updateCriterion = useCallback(
    (id: string, draft: CriterionDraft) => {
      const next = normalise(draft)
      setCriteria((current) => current.map((criterion) => (criterion.id === id ? { ...next, id } : criterion)))
      record('Criterion updated', `${next.label} (${next.kind}${next.kind === 'scored' ? `, weight ${next.weight}` : ''})`)
    },
    [record, setCriteria],
  )

  const removeCriterion = useCallback(
    (id: string) => {
      const removed = criteria.find((criterion) => criterion.id === id)
      setCriteria((current) => current.filter((criterion) => criterion.id !== id))
      record('Criterion removed', `${removed?.label ?? 'Unknown criterion'} removed from the checklist`)
    },
    [criteria, record, setCriteria],
  )

  const resetCriteria = useCallback(() => {
    setCriteria(BASELINE_CRITERIA)
    record('Criteria reset', 'Checklist restored to the illustrative baseline')
  }, [record, setCriteria])

  return { criteria, addCriterion, updateCriterion, removeCriterion, resetCriteria }
}
