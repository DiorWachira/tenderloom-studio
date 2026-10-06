import { useCallback } from 'react'
import { z } from 'zod'
import { STORAGE_KEYS, auditEventSchema } from '../domain/schemas'
import type { AuditEvent } from '../domain/schemas'
import { usePersistentState } from './usePersistentState'

const MAX_EVENTS = 40
const auditListSchema = z.array(auditEventSchema)
const noEvents = (): AuditEvent[] => []

export function useAuditTrail() {
  const [events, setEvents] = usePersistentState(STORAGE_KEYS.audit, auditListSchema, noEvents)

  const record = useCallback(
    (action: string, detail: string) => {
      setEvents((current) =>
        [
          { id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, detail },
          ...current,
        ].slice(0, MAX_EVENTS),
      )
    },
    [setEvents],
  )

  return { events, record }
}
