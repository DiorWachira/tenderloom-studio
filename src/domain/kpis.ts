import type { VendorScore } from './scoring'

export type Kpis = {
  vendorCount: number
  lowestBid: number | null
  fastestDeliveryDays: number | null
  leaderName: string | null
  /** Whole-number percentage of vendors that pass every mandatory gate. */
  eligibleShare: number | null
}

export type TenderStatus = 'draft' | 'evaluating' | 'ready'

type KpiVendor = { bidAmount: number; deliveryDays: number }

export function computeKpis(vendors: KpiVendor[], scoreRows: VendorScore[], eligibleCount: number): Kpis {
  if (vendors.length === 0) {
    return {
      vendorCount: 0,
      lowestBid: null,
      fastestDeliveryDays: null,
      leaderName: null,
      eligibleShare: null,
    }
  }

  return {
    vendorCount: vendors.length,
    lowestBid: Math.min(...vendors.map((vendor) => vendor.bidAmount)),
    fastestDeliveryDays: Math.min(...vendors.map((vendor) => vendor.deliveryDays)),
    leaderName: scoreRows[0]?.vendorName ?? null,
    eligibleShare: Math.round((eligibleCount / vendors.length) * 100),
  }
}

/** A decision needs at least two eligible bids to compare. */
export function tenderStatus(vendorCount: number, eligibleCount: number): TenderStatus {
  if (vendorCount === 0) {
    return 'draft'
  }
  return eligibleCount >= 2 ? 'ready' : 'evaluating'
}
