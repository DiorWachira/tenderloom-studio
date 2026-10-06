import { z } from 'zod'
import type { ComplianceCriterion, ComplianceResponses } from './compliance'
import { legacyVendorRecordSchema } from './schemas'
import type { LegacyVendorRecord, VendorRecord } from './schemas'

export const MIGRATION_NOTE = 'Migrated from the v1 compliant flag; attach evidence to confirm.'

/** Parses raw `tenderloom.vendors.v1` JSON; anything unreadable yields an empty list. */
export function parseLegacyVendors(raw: string | null): LegacyVendorRecord[] {
  if (!raw) {
    return []
  }
  try {
    const parsed = z.array(legacyVendorRecordSchema).safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

/**
 * v1 `compliant: 'yes'` becomes every criterion met (preserving the old full compliance score);
 * `'no'` fails the first mandatory criterion and leaves the rest unknown.
 */
export function migrateV1toV2(
  records: LegacyVendorRecord[],
  criteria: ComplianceCriterion[],
): VendorRecord[] {
  const firstMandatory = criteria.find((criterion) => criterion.kind === 'mandatory')

  return records.map(({ compliant, ...rest }) => {
    const compliance: ComplianceResponses = {}

    for (const criterion of criteria) {
      if (compliant === 'yes') {
        compliance[criterion.id] = { status: 'met', evidenceRef: '', evidenceNote: MIGRATION_NOTE }
      } else if (criterion.id === firstMandatory?.id) {
        compliance[criterion.id] = { status: 'not-met', evidenceRef: '', evidenceNote: MIGRATION_NOTE }
      }
    }

    return { ...rest, compliance }
  })
}
