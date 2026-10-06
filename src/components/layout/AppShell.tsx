import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { LogoMark } from '../../assets/illustrations/LogoMark'
import type { TenderStatus } from '../../domain/kpis'
import type { ViewId } from '../../hooks/useView'
import { Chip } from '../ui/Chip'
import type { ChipTone } from '../ui/Chip'
import { Icon } from '../ui/Icon'
import { NAV_ITEMS } from './navigation'

const STATUS_LABEL: Record<TenderStatus, { label: string; tone: ChipTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  evaluating: { label: 'Evaluating', tone: 'brass' },
  ready: { label: 'Ready for decision', tone: 'ok' },
}

type AppShellProps = {
  view: ViewId
  onNavigate: (view: ViewId) => void
  badges: Partial<Record<ViewId, number>>
  status: TenderStatus
  children: ReactNode
}

export function AppShell({ view, onNavigate, badges, status, children }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // Move focus to the page on navigation so screen-reader and keyboard users land on the new view.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [view])

  useEffect(() => {
    if (!navOpen) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNavOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navOpen])

  const go = (target: ViewId) => {
    setNavOpen(false)
    onNavigate(target)
  }

  const statusChip = STATUS_LABEL[status]

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <aside className="rail" id="primary-nav" data-open={navOpen} aria-label="Primary">
        <div className="rail__brand">
          <LogoMark size={40} />
          <div>
            <p className="rail__name">Tenderloom</p>
            <p className="rail__tag">Studio</p>
          </div>
        </div>

        <nav className="rail__nav" aria-label="Sections">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#/${item.id}`}
                  className="rail__link"
                  aria-current={view === item.id ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    go(item.id)
                  }}
                >
                  <Icon name={item.icon} />
                  <span className="rail__link-text">
                    <span className="rail__link-label">{item.label}</span>
                    <span className="rail__link-hint">{item.hint}</span>
                  </span>
                  {badges[item.id] ? (
                    <span className="rail__badge" aria-label={`${badges[item.id]} items`}>
                      {badges[item.id]}
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rail__note">
          <Icon name="lock" size={18} />
          <p>Your data stays in this browser. Nothing is uploaded.</p>
        </div>
      </aside>

      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <div className="app-body">
        <div className="topbar">
          <button
            type="button"
            className="topbar__menu"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            <Icon name={navOpen ? 'close' : 'menu'} size={22} />
          </button>
          <div className="topbar__tender">
            <span className="topbar__label">Tender workspace</span>
            <span className="topbar__title">Vendor evaluation</span>
          </div>
          <Chip tone={statusChip.tone}>{statusChip.label}</Chip>
        </div>

        <main id="main" ref={mainRef} tabIndex={-1} className="main">
          {children}
        </main>

        <footer className="footnote">
          Static-first architecture, GitHub Pages deploy, and CI verification from day one.
        </footer>
      </div>
    </div>
  )
}
