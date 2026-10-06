import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom does not implement scrolling; navigation scrolls to top. Pure domain suites run without a DOM.
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
}
