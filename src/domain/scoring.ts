export const WEIGHT_KEYS = ['cost', 'speed', 'compliance'] as const
export type WeightKey = (typeof WEIGHT_KEYS)[number]
export type ScoreWeights = Record<WeightKey, number>

export const DEFAULT_WEIGHTS: ScoreWeights = { cost: 45, speed: 30, compliance: 25 }

/** Below this many weight points, a single-weight change that flips the leader marks the result fragile. */
export const FRAGILE_THRESHOLD = 10
const WEIGHT_MAX = 100
const EPSILON = 1e-9

export type ScoringInput = {
  id: string
  vendorName: string
  bidAmount: number
  deliveryDays: number
  /** 0-100 from the compliance engine. */
  complianceScore: number
}

export type VendorScore = {
  id: string
  vendorName: string
  rank: number
  totalScore: number
  costScore: number
  speedScore: number
  complianceScore: number
  /** Weighted points per criterion; they sum exactly to `totalScore`. */
  contributions: ScoreWeights
}

const round = (value: number): number => Math.round(value * 10) / 10

/** Lower is better for both bid and delivery, so the best value maps to 100. */
const scaleTo100 = (value: number, min: number, max: number): number =>
  max === min ? 100 : ((max - value) / (max - min)) * 100

type Ranked = {
  input: ScoringInput
  total: number
  scores: ScoreWeights
  contributions: ScoreWeights
}

/** Ranks on the displayed total, so what users see is what ranks. Tie-break: compliance, cost, speed, name. */
function compareRanked(a: Ranked, b: Ranked): number {
  if (Math.abs(b.total - a.total) > EPSILON) {
    return b.total - a.total
  }
  for (const key of ['compliance', 'cost', 'speed'] as const) {
    if (Math.abs(b.scores[key] - a.scores[key]) > EPSILON) {
      return b.scores[key] - a.scores[key]
    }
  }
  return a.input.vendorName.localeCompare(b.input.vendorName) || a.input.id.localeCompare(b.input.id)
}

function rank(inputs: ScoringInput[], weights: ScoreWeights): Ranked[] {
  const weightTotal = WEIGHT_KEYS.reduce((sum, key) => sum + weights[key], 0)

  const bids = inputs.map((input) => input.bidAmount)
  const days = inputs.map((input) => input.deliveryDays)
  const [minBid, maxBid] = [Math.min(...bids), Math.max(...bids)]
  const [minDays, maxDays] = [Math.min(...days), Math.max(...days)]

  return inputs
    .map((input) => {
      const scores: ScoreWeights = {
        cost: scaleTo100(input.bidAmount, minBid, maxBid),
        speed: scaleTo100(input.deliveryDays, minDays, maxDays),
        compliance: input.complianceScore,
      }
      const contributions = Object.fromEntries(
        WEIGHT_KEYS.map((key) => [
          key,
          weightTotal === 0 ? 0 : round((scores[key] * weights[key]) / weightTotal),
        ]),
      ) as ScoreWeights
      const total = round(WEIGHT_KEYS.reduce((sum, key) => sum + contributions[key], 0))
      return { input, total, scores, contributions }
    })
    .sort(compareRanked)
}

/** Ranks eligible vendors only; callers must exclude disqualified vendors first. */
export function calculateWeightedScores(
  inputs: ScoringInput[],
  weights: ScoreWeights,
): VendorScore[] {
  if (inputs.length === 0) {
    return []
  }

  return rank(inputs, weights).map(({ input, total, scores, contributions }, index) => {
    return {
      id: input.id,
      vendorName: input.vendorName,
      rank: index + 1,
      totalScore: total,
      costScore: round(scores.cost),
      speedScore: round(scores.speed),
      complianceScore: round(scores.compliance),
      contributions,
    }
  })
}

export type WeightShift = {
  weight: WeightKey
  /** Signed change in weight points from the current setting. */
  delta: number
  newLeaderId: string
  newLeaderName: string
}

export type SensitivityResult = {
  leaderId: string | null
  /** Smallest leader-changing shift for each weight that has one. */
  shifts: WeightShift[]
  minimumShift: WeightShift | null
  fragile: boolean
}

/** Finds the smallest single-weight change (in slider points, within 0-100) that changes the leader. */
export function analyseSensitivity(inputs: ScoringInput[], weights: ScoreWeights): SensitivityResult {
  if (inputs.length < 2) {
    return { leaderId: inputs[0]?.id ?? null, shifts: [], minimumShift: null, fragile: false }
  }

  const leaderId = rank(inputs, weights)[0].input.id
  const shifts: WeightShift[] = []

  for (const weight of WEIGHT_KEYS) {
    search: for (let step = 1; step <= WEIGHT_MAX; step += 1) {
      for (const delta of [step, -step]) {
        const value = weights[weight] + delta
        if (value < 0 || value > WEIGHT_MAX) {
          continue
        }
        const leader = rank(inputs, { ...weights, [weight]: value })[0].input
        if (leader.id !== leaderId) {
          shifts.push({ weight, delta, newLeaderId: leader.id, newLeaderName: leader.vendorName })
          break search
        }
      }
    }
  }

  const minimumShift = shifts.reduce<WeightShift | null>(
    (best, shift) => (best === null || Math.abs(shift.delta) < Math.abs(best.delta) ? shift : best),
    null,
  )

  return {
    leaderId,
    shifts,
    minimumShift,
    fragile: minimumShift !== null && Math.abs(minimumShift.delta) < FRAGILE_THRESHOLD,
  }
}
