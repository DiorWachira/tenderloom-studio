import type { ReactNode } from 'react'

type EmptyStateProps = {
  art: ReactNode
  title: string
  children: ReactNode
  action?: ReactNode
}

export function EmptyState({ art, title, children, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__art">{art}</div>
      <h3>{title}</h3>
      <p className="empty-state__text">{children}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
