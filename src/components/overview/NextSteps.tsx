import type { ViewId } from '../../hooks/useView'
import { Icon } from '../ui/Icon'

type Step = { id: string; label: string; detail: string; done: boolean; view: ViewId }

type NextStepsProps = {
  vendorCount: number
  weightsApplied: boolean
  memoExported: boolean
  onNavigate: (view: ViewId) => void
}

export function NextSteps({ vendorCount, weightsApplied, memoExported, onNavigate }: NextStepsProps) {
  const steps: Step[] = [
    {
      id: 'vendors',
      label: 'Add at least two vendors',
      detail: 'A comparison needs competing bids.',
      done: vendorCount >= 2,
      view: 'vendors',
    },
    {
      id: 'weights',
      label: 'Set your scoring priorities',
      detail: 'Balance cost, speed, and compliance, then record the profile.',
      done: weightsApplied,
      view: 'scoring',
    },
    {
      id: 'memo',
      label: 'Export the decision memo',
      detail: 'Share a written rationale with your approvers.',
      done: memoExported,
      view: 'memo',
    },
  ]

  return (
    <ol className="steps">
      {steps.map((step, index) => (
        <li key={step.id} className="steps__item" data-done={step.done}>
          <span className="steps__marker" aria-hidden="true">
            {step.done ? <Icon name="check" size={16} /> : index + 1}
          </span>
          <div>
            <p className="steps__label">
              {step.label}
              {step.done && <span className="visually-hidden"> (done)</span>}
            </p>
            <p className="steps__detail">{step.detail}</p>
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => onNavigate(step.view)}>
            {step.done ? 'Review' : 'Go'}
            <span className="visually-hidden"> {step.label}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
