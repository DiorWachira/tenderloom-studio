import type { ReactNode } from 'react'

type SvgProps = { viewBox: string; className?: string; children: ReactNode }

export function Svg({ viewBox, className, children }: SvgProps) {
  return (
    <svg
      viewBox={viewBox}
      className={className ? `illustration ${className}` : 'illustration'}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}
