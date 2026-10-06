import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ZodType } from 'zod'

function readStored<T>(key: string, schema: ZodType<T>, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

/** useState mirrored to localStorage; invalid or corrupt stored data falls back silently. */
export function usePersistentState<T>(
  key: string,
  schema: ZodType<T>,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStored(key, schema, fallback))

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
