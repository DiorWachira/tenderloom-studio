import type { ExpiryState, FindingSeverity, ResponseStatus, RiskLevel } from '../../domain/compliance'
import type { ChipTone } from '../ui/Chip'

export const STATUS_META: Record<ResponseStatus, { label: string; tone: ChipTone }> = {
  met: { label: 'Met', tone: 'ok' },
  partial: { label: 'Partial', tone: 'brass' },
  'not-met': { label: 'Not met', tone: 'risk' },
  unknown: { label: 'Unknown', tone: 'neutral' },
}

export const RISK_META: Record<RiskLevel, { label: string; tone: ChipTone }> = {
  low: { label: 'Low risk', tone: 'ok' },
  medium: { label: 'Medium risk', tone: 'brass' },
  high: { label: 'High risk', tone: 'risk' },
  critical: { label: 'Disqualified', tone: 'risk' },
}

export const SEVERITY_META: Record<FindingSeverity, { label: string; tone: ChipTone }> = {
  critical: { label: 'Critical', tone: 'risk' },
  high: { label: 'High', tone: 'risk' },
  warning: { label: 'Warning', tone: 'brass' },
  info: { label: 'Note', tone: 'neutral' },
}

export const EXPIRY_LABEL: Partial<Record<ExpiryState, string>> = {
  expiring: 'Expiring',
  expired: 'Expired',
}
