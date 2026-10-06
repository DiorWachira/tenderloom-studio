export const TINT_COUNT = 6

export function getInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0] ?? '')
    .filter(Boolean)

  if (letters.length === 0) {
    return '?'
  }

  return letters.slice(0, 2).join('').toUpperCase()
}

/** Stable tint index so a vendor keeps the same avatar colour across sessions. */
export function getTintIndex(name: string): number {
  let hash = 0
  for (const char of name.trim().toLowerCase()) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  }
  return hash % TINT_COUNT
}
