import { useCallback, useEffect, useState } from 'react'

export const VIEWS = ['overview', 'vendors', 'scoring', 'compliance', 'memo', 'audit'] as const
export type ViewId = (typeof VIEWS)[number]

function parseHash(hash: string): ViewId {
  const id = hash.replace(/^#\/?/, '')
  return (VIEWS as readonly string[]).includes(id) ? (id as ViewId) : 'overview'
}

/** Hash-based view state keeps deep links working on static GitHub Pages hosting. */
export function useView(): [ViewId, (view: ViewId) => void] {
  const [view, setView] = useState<ViewId>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setView(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: ViewId) => {
    setView(next)
    window.location.hash = `/${next}`
  }, [])

  return [view, navigate]
}
