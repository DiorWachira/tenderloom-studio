import { fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

const goTo = (name: RegExp) => fireEvent.click(screen.getByRole('link', { name }))

const fillVendorForm = (name: string) => {
  fireEvent.change(screen.getByLabelText(/vendor name/i), { target: { value: name } })
  fireEvent.change(screen.getByLabelText(/service category/i), {
    target: { value: 'Cloud Infrastructure' },
  })
  fireEvent.change(screen.getByLabelText(/contact email/i), {
    target: { value: 'ops@northlake.com' },
  })
  fireEvent.change(screen.getByLabelText(/bid amount/i), { target: { value: '43000' } })
  fireEvent.change(screen.getByLabelText(/delivery days/i), { target: { value: '24' } })
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.location.hash = ''
  })

  it('renders the cockpit shell with the overview heading and primary navigation', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: /procurement decisions, designed for trust/i }),
    ).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: /sections/i })
    for (const label of ['Overview', 'Vendors', 'Scoring', 'Compliance', 'Memo', 'Audit trail']) {
      expect(within(nav).getByRole('link', { name: new RegExp(`^${label}`, 'i') })).toBeInTheDocument()
    }
    expect(within(nav).getByRole('link', { name: /^overview/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('heading', { name: /increment roadmap/i })).not.toBeInTheDocument()
  })

  it('switches views from the navigation and supports deep links', () => {
    const { unmount } = render(<App />)

    goTo(/^vendors/i)
    expect(screen.getByRole('heading', { level: 1, name: /vendor intake and roster/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^vendors/i })).toHaveAttribute('aria-current', 'page')
    unmount()

    window.location.hash = '#/scoring'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /weighted scoring matrix/i })).toBeInTheDocument()
  })

  it('opens and closes the mobile navigation drawer', () => {
    render(<App />)

    const toggle = screen.getByRole('button', { name: /open navigation/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: /close navigation/i })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('button', { name: /open navigation/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('adds, edits, and deletes a vendor record', async () => {
    render(<App />)
    goTo(/^vendors/i)

    fillVendorForm('Northlake Systems')
    fireEvent.click(screen.getByRole('button', { name: /add vendor/i }))

    expect(await screen.findByRole('heading', { name: /northlake systems/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit northlake systems/i }))
    fireEvent.change(screen.getByLabelText(/vendor name/i), {
      target: { value: 'Northlake Systems Group' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save vendor/i }))

    expect(await screen.findByRole('heading', { name: /northlake systems group/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /delete northlake systems group/i }))
    expect(screen.queryByRole('heading', { name: /northlake systems group/i })).not.toBeInTheDocument()
    expect(screen.getByText(/no vendors yet/i)).toBeInTheDocument()
  })

  it('shows validation errors without saving an invalid vendor', async () => {
    render(<App />)
    goTo(/^vendors/i)

    fireEvent.click(screen.getByRole('button', { name: /add vendor/i }))

    expect(await screen.findByText(/vendor name must be at least 2 characters/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/vendor name/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/no vendors yet/i)).toBeInTheDocument()
  })

  it('loads the sample tender and fills the overview with figures and a ranked podium', () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { name: /load sample tender/i })[0])

    const figures = screen.getByLabelText(/key figures/i)
    expect(within(figures).getByText('$39,900')).toBeInTheDocument()
    expect(within(figures).getByText('18 days')).toBeInTheDocument()
    expect(within(figures).getByText('75%')).toBeInTheDocument()

    expect(screen.getByText('Recommended')).toBeInTheDocument()
    expect(screen.getByText('Ready for decision')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^vendors.*4 items/i })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('tenderloom.vendors.v1') ?? '[]')).toHaveLength(4)
  })

  it('records weight profile and memo export actions in the audit trail', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /load sample tender/i })[0])

    goTo(/^scoring/i)
    fireEvent.click(screen.getByRole('button', { name: 'Cost-led' }))
    expect(screen.getByRole('button', { name: 'Cost-led' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /apply weight profile/i }))

    goTo(/^memo/i)
    fireEvent.click(screen.getByRole('button', { name: /export memo as .txt/i }))

    goTo(/^audit trail/i)
    expect(await screen.findByText(/weight profile applied/i)).toBeInTheDocument()
    expect(screen.getByText(/cost 60% \| speed 25% \| compliance 15%/i)).toBeInTheDocument()
    expect(screen.getByText(/decision memo exported as .txt/i)).toBeInTheDocument()

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
    clickSpy.mockRestore()
  })

  it('disables memo export until there is a recommendation', () => {
    render(<App />)
    goTo(/^memo/i)

    expect(screen.getByRole('button', { name: /export memo as .txt/i })).toBeDisabled()
    expect(screen.getByText(/no recommendation to write up/i)).toBeInTheDocument()
  })

  it('shows the compliance placeholder pointing at Increment 7', () => {
    render(<App />)
    goTo(/^compliance/i)

    expect(screen.getByText(/arrives in increment 7/i)).toBeInTheDocument()
  })

  it('still loads vendors saved by the previous version of the app', () => {
    const now = new Date().toISOString()
    window.localStorage.setItem(
      'tenderloom.vendors.v1',
      JSON.stringify([
        {
          id: 'legacy-1',
          vendorName: 'Legacy Supplies',
          serviceCategory: 'Hardware',
          contactEmail: 'hello@legacy.example',
          bidAmount: 12000,
          deliveryDays: 10,
          compliant: 'yes',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
      ]),
    )

    render(<App />)
    goTo(/^vendors/i)

    expect(screen.getByRole('heading', { name: /legacy supplies/i })).toBeInTheDocument()
  })

  it('falls back to an empty tender when stored data is corrupt', () => {
    window.localStorage.setItem('tenderloom.vendors.v1', '{not json')
    window.localStorage.setItem('tenderloom.audit.v1', '[{"wrong":true}]')

    render(<App />)
    goTo(/^vendors/i)

    expect(screen.getByText(/no vendors yet/i)).toBeInTheDocument()
  })
})
