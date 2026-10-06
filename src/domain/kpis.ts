import type { VendorForScoring, VendorScore } from './scoring'

export type Kpis = {
  vendorCount: number
  lowestBid: number | null
  fastestDeliveryDays: number | null
  leaderName: string | null
  /** Whole-number percentage of vendors flagged compliant. */
  compliantShare: number | null
}

export type TenderStatus = 'draft' | 'evaluating' | 'ready'

type KpiVendor = Pick<VendorForScoring, 'bidAmount' | 'deliveryDays' | 'compliant'>

export function computeKpis(vendors: KpiVendor[], scoreRows: VendorScore[]): Kpis {
  if (vendors.length === 0) {
    return {
      vendorCount: 0,
      lowestBid: null,
      fastestDeliveryDays: null,
      leaderName: null,
      compliantShare: null,
    }
  }

  const compliantCount = vendors.filter((vendor) => vendor.compliant === 'yes').length

  return {
    vendorCount: vendors.length,
    lowestBid: Math.min(...vendors.map((vendor) => vendor.bidAmount)),
    fastestDeliveryDays: Math.min(...vendors.map((vendor) => vendor.deliveryDays)),
    leaderName: scoreRows[0]?.vendorName ?? null,
    compliantShare: Math.round((compliantCount / vendors.length) * 100),
  }
}

/** A comparison needs at least two bids, so one vendor is still "evaluating". */
export function tenderStatus(vendorCount: number): TenderStatus {
  if (vendorCount === 0) {
    return 'draft'
  }
  return vendorCount === 1 ? 'evaluating' : 'ready'
}
