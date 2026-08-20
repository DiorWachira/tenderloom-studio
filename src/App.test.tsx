import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the Tenderloom heading and roadmap section', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /procurement decisions, designed for trust/i }),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /increment roadmap/i })).toBeInTheDocument()
  })

  it('adds, edits, and deletes a vendor record', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/vendor name/i), {
      target: { value: 'Northlake Systems' },
    })
    fireEvent.change(screen.getByLabelText(/service category/i), {
      target: { value: 'Cloud Infrastructure' },
    })
    fireEvent.change(screen.getByLabelText(/contact email/i), {
      target: { value: 'ops@northlake.com' },
    })
    fireEvent.change(screen.getByLabelText(/bid amount/i), {
      target: { value: '43000' },
    })
    fireEvent.change(screen.getByLabelText(/delivery days/i), {
      target: { value: '24' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add vendor/i }))

    expect(
      await screen.findByRole('heading', { name: /northlake systems/i }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText(/vendor name/i), {
      target: { value: 'Northlake Systems Group' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save vendor/i }))

    expect(
      await screen.findByRole('heading', { name: /northlake systems group/i }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(
      screen.queryByRole('heading', { name: /northlake systems group/i }),
    ).not.toBeInTheDocument()
  })

  it('records memo export and weight profile actions in audit trail', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /apply weight profile/i }))
    expect(await screen.findByText(/weight profile applied/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /export memo as .txt/i }))
    expect(await screen.findByText(/decision memo exported as .txt/i)).toBeInTheDocument()

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
    clickSpy.mockRestore()
  })
})
