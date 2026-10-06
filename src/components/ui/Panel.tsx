import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, description, actions, className, children }: PanelProps) {
  return (
    <section className={className ? `panel ${className}` : 'panel'}>
      <header className="panel__head">
        <div>
          <h2>{title}</h2>
          {description && <p className="panel__desc">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}
