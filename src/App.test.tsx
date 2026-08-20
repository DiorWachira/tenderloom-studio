import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Tenderloom heading and roadmap section', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /procurement decisions, designed for trust/i }),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /increment roadmap/i })).toBeInTheDocument()
  })
})
