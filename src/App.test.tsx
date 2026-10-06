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
    expect(within(figures).getByText('$33,500')).toBeInTheDocument()
    expect(within(figures).getByText('18 days')).toBeInTheDocument()
    expect(within(figures).getByText('80%')).toBeInTheDocument()
    expect(within(figures).getByText('Northlake Systems')).toBeInTheDocument()

    expect(screen.getByText('Recommended')).toBeInTheDocument()
    expect(screen.getByText('Ready for decision')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^vendors.*5 items/i })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('tenderloom.vendors.v2') ?? '[]')).toHaveLength(5)
  })

  it('excludes disqualified vendors from scoring and explains why', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /load sample tender/i })[0])
    goTo(/^scoring/i)

    const table = screen.getByRole('table')
    expect(within(table).queryByText('Cinderline Ops')).not.toBeInTheDocument()
    expect(within(table).getByText('Low risk')).toBeInTheDocument()

    const excluded = screen.getByRole('region', { name: /excluded by mandatory gates/i })
    expect(within(excluded).getByText('Cinderline Ops')).toBeInTheDocument()
    expect(
      within(excluded).getByText('Mandatory criterion "GDPR data processing agreement" is not met.'),
    ).toBeInTheDocument()
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

  it('disqualifies a vendor when a mandatory gate is marked not met, and logs it', async () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /load sample tender/i })[0])
    goTo(/^compliance/i)

    fireEvent.click(screen.getByRole('button', { name: 'Meridian Cloud Partners, Insurance cover: Met' }))
    expect(screen.getByRole('heading', { name: /meridian cloud partners.*insurance cover/i })).toHaveFocus()

    fireEvent.click(screen.getByRole('radio', { name: /^not met/i }))
    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    expect(
      screen.getByRole('button', { name: 'Meridian Cloud Partners, Insurance cover: Not met' }),
    ).toBeInTheDocument()
    const register = screen.getByRole('list', { name: /findings for meridian cloud partners/i })
    expect(within(register).getByText('Mandatory criterion "Insurance cover" is not met.')).toBeInTheDocument()

    goTo(/^scoring/i)
    const excluded = screen.getByRole('region', { name: /excluded by mandatory gates/i })
    expect(within(excluded).getByText('Meridian Cloud Partners')).toBeInTheDocument()

    goTo(/^audit trail/i)
    expect(await screen.findByText('Meridian Cloud Partners: Insurance cover not met')).toBeInTheDocument()
    expect(screen.getByText(/meridian cloud partners failed a mandatory gate/i)).toBeInTheDocument()
  })

  it('rejects an expiry date earlier than the evidence date', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /load sample tender/i })[0])
    goTo(/^compliance/i)

    fireEvent.click(screen.getByRole('button', { name: 'Meridian Cloud Partners, Insurance cover: Met' }))
    fireEvent.change(screen.getByLabelText(/evidence date/i), { target: { value: '2026-05-01' } })
    fireEvent.change(screen.getByLabelText(/expires on/i), { target: { value: '2026-04-01' } })
    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be before the evidence date/i)
  })

  it('adds and removes a scored criterion from the checklist', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /load sample tender/i })[0])
    goTo(/^compliance/i)

    fireEvent.change(screen.getByLabelText(/criterion label/i), { target: { value: 'Accessibility statement' } })
    fireEvent.change(screen.getByLabelText(/^weight$/i), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: /^add criterion$/i }))

    expect(screen.getByRole('columnheader', { name: /accessibility statement/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Northlake Systems, Accessibility statement: Unknown' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /remove accessibility statement/i }))
    expect(screen.queryByRole('columnheader', { name: /accessibility statement/i })).not.toBeInTheDocument()
  })

  it('no longer asks for a yes/no compliance flag on intake', () => {
    render(<App />)
    goTo(/^vendors/i)

    expect(screen.queryByLabelText(/compliance status/i)).not.toBeInTheDocument()
  })

  it('migrates v1 vendors to the compliance checklist and keeps the v1 backup', () => {
    const now = new Date().toISOString()
    const legacy = (id: string, vendorName: string, compliant: 'yes' | 'no') => ({
      id,
      vendorName,
      serviceCategory: 'Hardware',
      contactEmail: `${id}@legacy.example`,
      bidAmount: 12000,
      deliveryDays: 10,
      compliant,
      notes: '',
      createdAt: now,
      updatedAt: now,
    })
    const v1 = JSON.stringify([legacy('l1', 'Legacy Supplies', 'yes'), legacy('l2', 'Old Risk Co', 'no')])
    window.localStorage.setItem('tenderloom.vendors.v1', v1)

    render(<App />)
    goTo(/^vendors/i)

    const legacySupplies = screen.getByRole('heading', { name: /legacy supplies/i }).closest('li')!
    expect(within(legacySupplies).getByText('Medium risk')).toBeInTheDocument()
    const oldRisk = screen.getByRole('heading', { name: /old risk co/i }).closest('li')!
    expect(within(oldRisk).getByText('Disqualified')).toBeInTheDocument()

    const v2 = JSON.parse(window.localStorage.getItem('tenderloom.vendors.v2') ?? '[]')
    expect(v2).toHaveLength(2)
    expect(v2[0]).not.toHaveProperty('compliant')
    expect(window.localStorage.getItem('tenderloom.vendors.v1')).toBe(v1)
  })

  it('falls back to an empty tender when stored data is corrupt', () => {
    window.localStorage.setItem('tenderloom.vendors.v2', '{not json')
    window.localStorage.setItem('tenderloom.vendors.v1', '{not json')
    window.localStorage.setItem('tenderloom.criteria.v1', '[{"id":1}]')
    window.localStorage.setItem('tenderloom.audit.v1', '[{"wrong":true}]')

    render(<App />)
    goTo(/^vendors/i)

    expect(screen.getByText(/no vendors yet/i)).toBeInTheDocument()
  })
})
