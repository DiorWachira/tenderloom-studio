import type { VendorRecord } from './schemas'

type SampleSeed = Omit<VendorRecord, 'id' | 'createdAt' | 'updatedAt'>

export const SAMPLE_TENDER_NAME = 'Managed cloud hosting renewal'

const seeds: SampleSeed[] = [
  {
    vendorName: 'Northlake Systems',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'bids@northlake.example',
    bidAmount: 43000,
    deliveryDays: 24,
    compliant: 'yes',
    notes: 'Strong references; 99.95% uptime SLA offered.',
  },
  {
    vendorName: 'Harbor & Finch Digital',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'tenders@harborfinch.example',
    bidAmount: 46500,
    deliveryDays: 18,
    compliant: 'yes',
    notes: 'Fastest mobilisation; premium support tier included.',
  },
  {
    vendorName: 'Meridian Cloud Partners',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'proposals@meridian.example',
    bidAmount: 44800,
    deliveryDays: 29,
    compliant: 'yes',
    notes: 'Regional data residency guaranteed.',
  },
  {
    vendorName: 'Cinderline Ops',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'sales@cinderline.example',
    bidAmount: 39900,
    deliveryDays: 21,
    compliant: 'no',
    notes: 'Lowest bid; security questionnaire still incomplete.',
  },
]

/** Timestamps are staggered so the roster order is stable and newest-first. */
export function buildSampleVendors(now: Date = new Date()): VendorRecord[] {
  return seeds.map((seed, index) => {
    const stamp = new Date(now.getTime() - index * 1000).toISOString()
    return { ...seed, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp }
  })
}
