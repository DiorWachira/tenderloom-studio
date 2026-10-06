import { z } from 'zod'
import { formatUsd } from './format'

export const CRITERION_CATEGORIES = [
  'legal',
  'financial',
  'security',
  'data-protection',
  'sustainability',
  'operational',
] as const

export const RESPONSE_STATUSES = ['met', 'partial', 'not-met', 'unknown'] as const

/** Days before evidence expiry at which a warning is raised (inclusive). */
export const EXPIRY_WARNING_DAYS = 30
/** A bid below this fraction of the median bid is flagged as abnormally low. */
export const ABNORMALLY_LOW_RATIO = 0.8
/** The abnormally-low check needs at least this many bids for a meaningful median. */
export const ABNORMALLY_LOW_MIN_VENDORS = 3
/** Compliance score below which an eligible vendor is high risk. */
export const RISK_HIGH_SCORE_BELOW = 50
/** Compliance score below which an eligible vendor is at least medium risk. */
export const RISK_MEDIUM_SCORE_BELOW = 75

export const STATUS_POINTS: Record<ResponseStatus, number> = {
  met: 100,
  partial: 50,
  'not-met': 0,
  unknown: 0,
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD date format.')

export const criterionSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(3, 'Criterion label must be at least 3 characters.').max(80),
  category: z.enum(CRITERION_CATEGORIES),
  kind: z.enum(['mandatory', 'scored']),
  weight: z.number().min(0).max(100),
  evidenceRequired: z.boolean(),
  validityDays: z.number().int().positive().max(3650).optional(),
})

export const criterionResponseSchema = z.object({
  status: z.enum(RESPONSE_STATUSES),
  evidenceRef: z.string().max(120),
  evidenceNote: z.string().max(280),
  evidenceDate: isoDate.optional(),
  expiresAt: isoDate.optional(),
})

export type CriterionCategory = (typeof CRITERION_CATEGORIES)[number]
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number]
export type ComplianceCriterion = z.infer<typeof criterionSchema>
export type CriterionResponse = z.infer<typeof criterionResponseSchema>
export type ComplianceResponses = Record<string, CriterionResponse>

export type FindingSeverity = 'critical' | 'high' | 'warning' | 'info'
export type FindingCode =
  | 'mandatory-failed'
  | 'mandatory-expired'
  | 'mandatory-unconfirmed'
  | 'evidence-expired'
  | 'evidence-expiring'
  | 'evidence-gap'
  | 'evidence-missing'
  | 'criterion-not-met'
  | 'criterion-partial'
  | 'price-risk'

export type Finding = {
  code: FindingCode
  severity: FindingSeverity
  criterionId?: string
  message: string
}

export type ExpiryState = 'none' | 'valid' | 'expiring' | 'expired'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type CriterionResult = {
  criterionId: string
  status: ResponseStatus
  /** Status after expiry is applied: expired evidence counts as `not-met`. */
  effectiveStatus: ResponseStatus
  expiry: string | null
  expiryState: ExpiryState
}

export type VendorAssessment = {
  vendorId: string
  eligible: boolean
  complianceScore: number
  riskLevel: RiskLevel
  findings: Finding[]
  results: Record<string, CriterionResult>
}

const SEVERITY_ORDER: Record<FindingSeverity, number> = { critical: 0, high: 1, warning: 2, info: 3 }
const DAY_MS = 86_400_000

export const UNKNOWN_RESPONSE: CriterionResponse = {
  status: 'unknown',
  evidenceRef: '',
  evidenceNote: '',
}

/** Illustrative baseline only; not legal advice. Weights apply to scored criteria. */
export const BASELINE_CRITERIA: ComplianceCriterion[] = [
  {
    id: 'insurance',
    label: 'Insurance cover',
    category: 'financial',
    kind: 'mandatory',
    weight: 0,
    evidenceRequired: true,
    validityDays: 365,
  },
  {
    id: 'data-protection',
    label: 'GDPR data processing agreement',
    category: 'data-protection',
    kind: 'mandatory',
    weight: 0,
    evidenceRequired: true,
  },
  {
    id: 'conflict-of-interest',
    label: 'Conflict-of-interest declaration',
    category: 'legal',
    kind: 'mandatory',
    weight: 0,
    evidenceRequired: true,
    validityDays: 365,
  },
  {
    id: 'information-security',
    label: 'ISO 27001 or equivalent',
    category: 'security',
    kind: 'scored',
    weight: 35,
    evidenceRequired: true,
    validityDays: 1095,
  },
  {
    id: 'financial-standing',
    label: 'Financial standing',
    category: 'financial',
    kind: 'scored',
    weight: 25,
    evidenceRequired: true,
    validityDays: 365,
  },
  {
    id: 'modern-slavery',
    label: 'Modern slavery statement',
    category: 'sustainability',
    kind: 'scored',
    weight: 20,
    evidenceRequired: true,
    validityDays: 365,
  },
  {
    id: 'business-continuity',
    label: 'Business continuity plan',
    category: 'operational',
    kind: 'scored',
    weight: 20,
    evidenceRequired: false,
  },
]

export function addDays(isoDay: string, days: number): string {
  return new Date(Date.parse(`${isoDay}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

/** Dates are compared as UTC calendar days; evidence is valid through its expiry day. */
export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function effectiveExpiry(
  criterion: ComplianceCriterion,
  response: CriterionResponse,
): string | null {
  if (response.expiresAt) {
    return response.expiresAt
  }
  if (response.evidenceDate && criterion.validityDays) {
    return addDays(response.evidenceDate, criterion.validityDays)
  }
  return null
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

export type PriceRisk = { ratio: number; median: number }

export function detectAbnormallyLowBids(
  bids: { id: string; bidAmount: number }[],
): Map<string, PriceRisk> {
  const flagged = new Map<string, PriceRisk>()
  if (bids.length < ABNORMALLY_LOW_MIN_VENDORS) {
    return flagged
  }

  const mid = median(bids.map((bid) => bid.bidAmount))
  for (const bid of bids) {
    if (bid.bidAmount < mid * ABNORMALLY_LOW_RATIO) {
      flagged.set(bid.id, { ratio: bid.bidAmount / mid, median: mid })
    }
  }
  return flagged
}

function resolveExpiry(expiry: string | null, today: string): ExpiryState {
  if (!expiry) {
    return 'none'
  }
  if (expiry < today) {
    return 'expired'
  }
  const daysLeft = Math.round((Date.parse(expiry) - Date.parse(today)) / DAY_MS)
  return daysLeft <= EXPIRY_WARNING_DAYS ? 'expiring' : 'valid'
}

function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(toDay) - Date.parse(fromDay)) / DAY_MS)
}

export function assessVendor(
  vendorId: string,
  criteria: ComplianceCriterion[],
  responses: ComplianceResponses,
  now: Date,
  priceRisk?: PriceRisk,
): VendorAssessment {
  const today = toIsoDay(now)
  const findings: Finding[] = []
  const results: Record<string, CriterionResult> = {}
  let eligible = true
  let earned = 0
  let available = 0

  const scored = criteria.filter((criterion) => criterion.kind === 'scored')
  const scoredWeightTotal = scored.reduce((sum, criterion) => sum + criterion.weight, 0)
  // With all scored weights at zero, scored criteria count equally rather than not at all.
  const weightOf = (criterion: ComplianceCriterion) =>
    scoredWeightTotal === 0 ? 1 : criterion.weight

  for (const criterion of criteria) {
    const response = responses[criterion.id] ?? UNKNOWN_RESPONSE
    const label = `"${criterion.label}"`
    const answered = response.status === 'met' || response.status === 'partial'
    const expiry = answered ? effectiveExpiry(criterion, response) : null
    const expiryState = resolveExpiry(expiry, today)
    const effectiveStatus: ResponseStatus = expiryState === 'expired' ? 'not-met' : response.status

    results[criterion.id] = {
      criterionId: criterion.id,
      status: response.status,
      effectiveStatus,
      expiry,
      expiryState,
    }

    const add = (code: FindingCode, severity: FindingSeverity, message: string) =>
      findings.push({ code, severity, criterionId: criterion.id, message })

    if (expiryState === 'expired') {
      add(
        criterion.kind === 'mandatory' ? 'mandatory-expired' : 'evidence-expired',
        criterion.kind === 'mandatory' ? 'critical' : 'high',
        `Evidence for ${label} expired on ${expiry}.`,
      )
    } else if (expiryState === 'expiring') {
      const days = daysBetween(today, expiry!)
      add(
        'evidence-expiring',
        'warning',
        `Evidence for ${label} expires ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`} (${expiry}).`,
      )
    }

    if (answered && expiryState !== 'expired' && criterion.evidenceRequired && !response.evidenceRef.trim()) {
      add('evidence-missing', 'warning', `${label} requires evidence but no reference is recorded.`)
    }

    if (criterion.kind === 'mandatory') {
      if (effectiveStatus === 'not-met') {
        eligible = false
        if (expiryState !== 'expired') {
          add('mandatory-failed', 'critical', `Mandatory criterion ${label} is not met.`)
        }
      } else if (effectiveStatus !== 'met') {
        add(
          'mandatory-unconfirmed',
          'high',
          `Mandatory criterion ${label} is ${effectiveStatus === 'partial' ? 'only partially met' : 'not yet confirmed'}.`,
        )
      }
      continue
    }

    available += weightOf(criterion)
    earned += (STATUS_POINTS[effectiveStatus] * weightOf(criterion)) / 100

    if (effectiveStatus === 'unknown') {
      add('evidence-gap', 'warning', `No response recorded for ${label}.`)
    } else if (effectiveStatus === 'not-met' && expiryState !== 'expired') {
      add('criterion-not-met', 'warning', `${label} is not met.`)
    } else if (effectiveStatus === 'partial') {
      add('criterion-partial', 'info', `${label} is only partially met.`)
    }
  }

  if (priceRisk) {
    findings.push({
      code: 'price-risk',
      severity: 'high',
      message: `Bid is ${Math.round(priceRisk.ratio * 100)}% of the median bid (${formatUsd(priceRisk.median)}); confirm it is sustainable.`,
    })
  }

  const complianceScore = available === 0 ? 100 : Math.round((earned / available) * 1000) / 10
  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return {
    vendorId,
    eligible,
    complianceScore,
    riskLevel: riskLevelFor(eligible, complianceScore, findings),
    findings,
    results,
  }
}

export function riskLevelFor(eligible: boolean, complianceScore: number, findings: Finding[]): RiskLevel {
  if (!eligible) {
    return 'critical'
  }
  if (complianceScore < RISK_HIGH_SCORE_BELOW || findings.some((f) => f.severity === 'high')) {
    return 'high'
  }
  if (complianceScore < RISK_MEDIUM_SCORE_BELOW || findings.some((f) => f.severity === 'warning')) {
    return 'medium'
  }
  return 'low'
}

type AssessableVendor = { id: string; bidAmount: number; compliance: ComplianceResponses }

export function assessTender(
  vendors: AssessableVendor[],
  criteria: ComplianceCriterion[],
  now: Date,
): Record<string, VendorAssessment> {
  const priceRisks = detectAbnormallyLowBids(vendors)
  return Object.fromEntries(
    vendors.map((vendor) => [
      vendor.id,
      assessVendor(vendor.id, criteria, vendor.compliance, now, priceRisks.get(vendor.id)),
    ]),
  )
}
