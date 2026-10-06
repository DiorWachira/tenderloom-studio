import type { IconName } from '../ui/Icon'
import type { ViewId } from '../../hooks/useView'

export type NavItem = { id: ViewId; label: string; icon: IconName; hint: string }

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'overview', hint: 'Tender at a glance' },
  { id: 'vendors', label: 'Vendors', icon: 'vendors', hint: 'Intake and roster' },
  { id: 'scoring', label: 'Scoring', icon: 'scoring', hint: 'Weights and ranking' },
  { id: 'compliance', label: 'Compliance', icon: 'compliance', hint: 'Gates and evidence' },
  { id: 'memo', label: 'Memo', icon: 'memo', hint: 'Decision export' },
  { id: 'audit', label: 'Audit trail', icon: 'audit', hint: 'Every action logged' },
]
