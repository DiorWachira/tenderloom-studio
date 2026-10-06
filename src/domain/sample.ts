import { addDays, toIsoDay } from './compliance'
import type { ComplianceResponses, CriterionResponse, ResponseStatus } from './compliance'
import type { VendorRecord } from './schemas'

type SampleSeed = Omit<VendorRecord, 'id' | 'createdAt' | 'updatedAt' | 'compliance'> & {
  /** criterionId -> [status, evidence age in days]; omitted criteria stay unknown. */
  answers: Record<string, [ResponseStatus, number]>
}

export const SAMPLE_TENDER_NAME = 'Managed cloud hosting renewal'

const allMet = (age: number): SampleSeed['answers'] => ({
  insurance: ['met', age],
  'data-protection': ['met', age],
  'conflict-of-interest': ['met', age],
  'information-security': ['met', age],
  'financial-standing': ['met', age],
  'modern-slavery': ['met', age],
  'business-continuity': ['met', age],
})

const seeds: SampleSeed[] = [
  {
    vendorName: 'Northlake Systems',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'bids@northlake.example',
    bidAmount: 43000,
    deliveryDays: 24,
    notes: 'Strong references; 99.95% uptime SLA offered.',
    // Insurance certificate renews in 15 days, so the demo shows an expiry warning.
    answers: { ...allMet(60), insurance: ['met', 350], 'business-continuity': ['partial', 60] },
  },
  {
    vendorName: 'Harbor & Finch Digital',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'tenders@harborfinch.example',
    bidAmount: 46500,
    deliveryDays: 18,
    notes: 'Fastest mobilisation; premium support tier included.',
    answers: { ...allMet(40), 'modern-slavery': ['unknown', 0] },
  },
  {
    vendorName: 'Meridian Cloud Partners',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'proposals@meridian.example',
    bidAmount: 44800,
    deliveryDays: 29,
    notes: 'Regional data residency guaranteed.',
    answers: { ...allMet(90), 'financial-standing': ['partial', 90] },
  },
  {
    vendorName: 'Cinderline Ops',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'sales@cinderline.example',
    bidAmount: 39900,
    deliveryDays: 21,
    notes: 'Security questionnaire incomplete; no data processing agreement offered.',
    answers: { ...allMet(30), 'data-protection': ['not-met', 30], 'information-security': ['unknown', 0] },
  },
  {
    vendorName: 'Brightwater Hosting',
    serviceCategory: 'Managed cloud hosting',
    contactEmail: 'hello@brightwater.example',
    bidAmount: 33500,
    deliveryDays: 34,
    notes: 'Aggressive pricing for a new market entrant.',
    answers: {
      insurance: ['met', 20],
      'data-protection': ['met', 20],
      'conflict-of-interest': ['met', 20],
      'information-security': ['not-met', 20],
      'financial-standing': ['partial', 20],
      'modern-slavery': ['not-met', 20],
    },
  },
]

function toResponses(answers: SampleSeed['answers'], today: string, slug: string): ComplianceResponses {
  return Object.fromEntries(
    Object.entries(answers).map(([criterionId, [status, age]]): [string, CriterionResponse] => {
      const evidenced = status === 'met' || status === 'partial'
      return [
        criterionId,
        {
          status,
          evidenceRef: evidenced ? `${slug}/${criterionId}.pdf` : '',
          evidenceNote: '',
          ...(evidenced ? { evidenceDate: addDays(today, -age) } : {}),
        },
      ]
    }),
  )
}

/** Timestamps are staggered so the roster order is stable and newest-first. */
export function buildSampleVendors(now: Date = new Date()): VendorRecord[] {
  const today = toIsoDay(now)

  return seeds.map(({ answers, ...seed }, index) => {
    const stamp = new Date(now.getTime() - index * 1000).toISOString()
    const slug = seed.vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return {
      ...seed,
      id: crypto.randomUUID(),
      createdAt: stamp,
      updatedAt: stamp,
      compliance: toResponses(answers, today, `evidence/${slug}`),
    }
  })
}
