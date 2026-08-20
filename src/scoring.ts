export type VendorForScoring = {
  id: string
  vendorName: string
  bidAmount: number
  deliveryDays: number
  compliant: 'yes' | 'no'
}

export type ScoreWeights = {
  cost: number
  speed: number
  compliance: number
}

export type VendorScore = {
  id: string
  vendorName: string
  totalScore: number
  costScore: number
  speedScore: number
  complianceScore: number
}

const scaleTo100 = (value: number, min: number, max: number): number => {
  if (max === min) {
    return 100
  }

  return ((max - value) / (max - min)) * 100
}

const round = (value: number): number => Math.round(value * 10) / 10

export function calculateWeightedScores(
  vendors: VendorForScoring[],
  weights: ScoreWeights,
): VendorScore[] {
  if (vendors.length === 0) {
    return []
  }

  const normalizedTotal = weights.cost + weights.speed + weights.compliance
  const safeTotal = normalizedTotal === 0 ? 1 : normalizedTotal

  const minBid = Math.min(...vendors.map((vendor) => vendor.bidAmount))
  const maxBid = Math.max(...vendors.map((vendor) => vendor.bidAmount))
  const minDays = Math.min(...vendors.map((vendor) => vendor.deliveryDays))
  const maxDays = Math.max(...vendors.map((vendor) => vendor.deliveryDays))

  return vendors
    .map((vendor) => {
      const costScore = scaleTo100(vendor.bidAmount, minBid, maxBid)
      const speedScore = scaleTo100(vendor.deliveryDays, minDays, maxDays)
      const complianceScore = vendor.compliant === 'yes' ? 100 : 25
      const riskPenalty = vendor.compliant === 'yes' ? 1 : 0.6

      const weightedBase =
        (costScore * weights.cost +
          speedScore * weights.speed +
          complianceScore * weights.compliance) /
        safeTotal

      const totalScore = weightedBase * riskPenalty

      return {
        id: vendor.id,
        vendorName: vendor.vendorName,
        totalScore: round(totalScore),
        costScore: round(costScore),
        speedScore: round(speedScore),
        complianceScore: round(complianceScore),
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)
}
