import './App.css'

const pillars = [
  {
    title: 'Structured Vendor Intake',
    detail:
      'Capture procurement inputs in a standard format so comparisons stay fair and auditable.',
  },
  {
    title: 'Weighted Scoring Matrix',
    detail:
      'Score vendors by agreed criteria and instantly see how rank changes with business priorities.',
  },
  {
    title: 'Decision Memo Export',
    detail:
      'Generate a board-ready recommendation memo with rationale, risks, and evidence traceability.',
  },
]

const increments = [
  'Foundation architecture and workflow guardrails',
  'Vendor profile + intake form with validation',
  'Scoring matrix and recommendation engine',
  'Memo export and decision audit trail',
]

function App() {
  return (
    <main className="shell">
      <header className="hero">
        <p className="kicker">Tenderloom Studio</p>
        <h1>Procurement decisions, designed for trust.</h1>
        <p className="summary">
          A premium static web cockpit for comparing vendors with transparent scoring,
          compliance checks, and decision-ready documentation.
        </p>
      </header>

      <section className="pillars" aria-label="Core capabilities">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="card">
            <h2>{pillar.title}</h2>
            <p>{pillar.detail}</p>
          </article>
        ))}
      </section>

      <section className="increment-board" aria-label="Build increments">
        <h2>Increment roadmap</h2>
        <ol>
          {increments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <footer className="footer-note">
        Static-first architecture, GitHub Pages deploy, and CI verification from day one.
      </footer>
    </main>
  )
}

export default App
