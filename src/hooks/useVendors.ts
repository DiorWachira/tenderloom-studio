import { useCallback, useMemo } from 'react'
import { z } from 'zod'
import { buildSampleVendors } from '../domain/sample'
import { STORAGE_KEYS, vendorRecordSchema } from '../domain/schemas'
import type { VendorInput, VendorRecord } from '../domain/schemas'
import { usePersistentState } from './usePersistentState'

const vendorListSchema = z.array(vendorRecordSchema)
const noVendors: VendorRecord[] = []

type AuditRecorder = (action: string, detail: string) => void

export function useVendors(record: AuditRecorder) {
  const [vendors, setVendors] = usePersistentState(
    STORAGE_KEYS.vendors,
    vendorListSchema,
    noVendors,
  )

  const sortedVendors = useMemo(
    () => [...vendors].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [vendors],
  )

  const addVendor = useCallback(
    (values: VendorInput) => {
      const now = new Date().toISOString()
      setVendors((current) => [
        { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...values },
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

  const loadSample = useCallback(() => {
    setVendors(buildSampleVendors())
    record('Sample tender loaded', 'Four demo vendors added to the roster')
  }, [record, setVendors])

  return { vendors: sortedVendors, addVendor, updateVendor, removeVendor, loadSample }
}
