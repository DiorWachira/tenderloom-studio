import { Svg } from './Svg'

const warpX = Array.from({ length: 9 }, (_, i) => 70 + i * 42.5)
const weftY = Array.from({ length: 6 }, (_, i) => 80 + i * 42)
const weftTones = ['s-accent', 's-sage', 's-brass']

/** Loom threads weaving into a checkmark: the product's "decision woven from evidence" idea. */
export function HeroLoom() {
  return (
    <Svg viewBox="0 0 480 380" className="illustration--hero">
      <rect x="30" y="22" width="420" height="18" rx="9" className="f-brass s-ink sw-3" />
      <rect x="30" y="336" width="420" height="18" rx="9" className="f-brass s-ink sw-3" />

      {warpX.map((x) => (
        <line key={x} x1={x} y1="40" x2={x} y2="336" className="s-soft sw-3" />
      ))}

      {weftY.map((y, row) => (
        <line
          key={y}
          x1="52"
          y1={y}
          x2="428"
          y2={y}
          className={`${weftTones[row % weftTones.length]} sw-12 round`}
        />
      ))}

      {weftY.flatMap((y, row) =>
        warpX
          .filter((_, col) => (row + col) % 2 === 0)
          .map((x) => (
            <line key={`${row}-${x}`} x1={x} y1={y - 8} x2={x} y2={y + 8} className="s-soft sw-5" />
          )),
      )}

      <ellipse cx="392" cy="164" rx="30" ry="10" className="f-ink" />
      <path d="M362 164h-40" className="s-ink sw-2 round" />

      <circle cx="240" cy="190" r="82" className="f-paper s-ink sw-3" />
      <circle cx="240" cy="190" r="68" className="f-none s-brass sw-2 dashed" />
      <path d="M204 192l26 26 48-56" className="f-none s-sage sw-16 round join" />
    </Svg>
  )
}
