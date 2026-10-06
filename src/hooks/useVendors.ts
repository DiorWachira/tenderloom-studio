import { useCallback, useMemo } from 'react'
import { z } from 'zod'
import { assessVendor } from '../domain/compliance'
import type { ComplianceCriterion, CriterionResponse } from '../domain/compliance'
import { migrateV1toV2, parseLegacyVendors } from '../domain/migrations'
import { buildSampleVendors } from '../domain/sample'
import { STORAGE_KEYS, vendorRecordSchema } from '../domain/schemas'
import type { VendorInput } from '../domain/schemas'
import { usePersistentState } from './usePersistentState'

const vendorListSchema = z.array(vendorRecordSchema)

type AuditRecorder = (action: string, detail: string) => void

const STATUS_LABEL: Record<CriterionResponse['status'], string> = {
  met: 'met',
  partial: 'partially met',
  'not-met': 'not met',
  unknown: 'unknown',
}

export function useVendors(record: AuditRecorder, criteria: ComplianceCriterion[]) {
  // No v2 data yet: upgrade any v1 roster. The v1 key is left untouched as a backup.
  const [vendors, setVendors] = usePersistentState(STORAGE_KEYS.vendors, vendorListSchema, () =>
    migrateV1toV2(parseLegacyVendors(window.localStorage.getItem(STORAGE_KEYS.legacyVendors)), criteria),
  )

  const sortedVendors = useMemo(
    () => [...vendors].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [vendors],
  )

  const addVendor = useCallback(
    (values: VendorInput) => {
      const now = new Date().toISOString()
      setVendors((current) => [
        { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...values, compliance: {} },
        ...current,
      ])
      record('Vendor added', `${values.vendorName} profile added`)
    },
    [record, setVendors],
  )

  const updateVendor = useCallback(
    (id: string, values: VendorInput) => {
      const previous = vendors.find((vendor) => vendor.id === id)
      const now = new Date().toISOString()
      setVendors((current) =>
        current.map((vendor) => (vendor.id === id ? { ...vendor, ...values, updatedAt: now } : vendor)),
      )
      record('Vendor updated', `${previous?.vendorName ?? values.vendorName} profile updated`)
    },
    [record, setVendors, vendors],
  )

  const removeVendor = useCallback(
    (id: string) => {
      const removed = vendors.find((vendor) => vendor.id === id)
      setVendors((current) => current.filter((vendor) => vendor.id !== id))
      record('Vendor deleted', `${removed?.vendorName ?? 'Unknown vendor'} removed`)
    },
    [record, setVendors, vendors],
  )

  const updateCompliance = useCallback(
    (vendorId: string, criterionId: string, response: CriterionResponse) => {
      const vendor = vendors.find((candidate) => candidate.id === vendorId)
      const criterion = criteria.find((candidate) => candidate.id === criterionId)
      if (!vendor || !criterion) {
        return
      }

      const now = new Date()
      const nextCompliance = { ...vendor.compliance, [criterionId]: response }
      const wasEligible = assessVendor(vendorId, criteria, vendor.compliance, now).eligible
      const isEligible = assessVendor(vendorId, criteria, nextCompliance, now).eligible

      setVendors((current) =>
        current.map((candidate) =>
          candidate.id === vendorId
            ? { ...candidate, compliance: nextCompliance, updatedAt: now.toISOString() }
            : candidate,
        ),
      )

      record('Compliance updated', `${vendor.vendorName}: ${criterion.label} ${STATUS_LABEL[response.status]}`)
      if (wasEligible && !isEligible) {
        record('Vendor disqualified', `${vendor.vendorName} failed a mandatory gate (${criterion.label})`)
      } else if (!wasEligible && isEligible) {
        record('Vendor reinstated', `${vendor.vendorName} now passes every mandatory gate`)
      }
    },
    [criteria, record, setVendors, vendors],
  )

  const loadSample = useCallback(() => {
    const sample = buildSampleVendors()
    setVendors(sample)
    record('Sample tender loaded', `${sample.length} demo vendors added to the roster`)
  }, [record, setVendors])

  return { vendors: sortedVendors, addVendor, updateVendor, removeVendor, updateCompliance, loadSample }
}
