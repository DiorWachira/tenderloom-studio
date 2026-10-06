import type { ReactNode } from 'react'

export type ChipTone = 'ok' | 'risk' | 'brass' | 'accent' | 'neutral'

export function Chip({ tone = 'neutral', children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={`chip chip--${tone}`}>{children}</span>
}
