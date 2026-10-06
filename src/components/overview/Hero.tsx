import { HeroLoom } from '../../assets/illustrations/HeroLoom'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

type HeroProps = {
  hasVendors: boolean
  onLoadSample: () => void
  onAddVendor: () => void
  onReviewScoring: () => void
}

export function Hero({ hasVendors, onLoadSample, onAddVendor, onReviewScoring }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero__copy">
        <p className="eyebrow">Procurement cockpit</p>
        <h1>Procurement decisions, designed for trust.</h1>
        <p className="hero__lede">
          A procurement cockpit for comparing vendors with transparent scoring, compliance checks,
          and decision-ready documentation.
        </p>
        <div className="hero__actions">
          {hasVendors ? (
            <Button onClick={onReviewScoring}>
              Review scoring <Icon name="arrow" size={18} />
            </Button>
          ) : (
            <Button onClick={onLoadSample}>Load sample tender</Button>
          )}
          <Button variant="secondary" onClick={onAddVendor}>
            <Icon name="plus" size={18} /> Add a vendor
          </Button>
        </div>
      </div>
      <div className="hero__art">
        <HeroLoom />
      </div>
    </section>
  )
}
