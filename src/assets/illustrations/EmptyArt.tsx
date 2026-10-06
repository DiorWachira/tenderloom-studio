import { Svg } from './Svg'

const view = '0 0 240 180'

export function VendorsArt() {
  return (
    <Svg viewBox={view}>
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x="40" y={18 + i * 50} width="160" height="42" rx="10" className="f-paper s-ink sw-2" />
          <circle cx="64" cy={39 + i * 50} r="12" className={`${i ? 'f-sage-soft' : 'f-accent-soft'} s-ink sw-2`} />
          <path d={`M86 ${33 + i * 50}h72M86 ${46 + i * 50}h44`} className="s-soft sw-2 round" />
        </g>
      ))}
      <rect x="40" y="118" width="160" height="42" rx="10" className="f-none s-brass sw-2 dashed" />
      <path d="M120 130v18M111 139h18" className="s-brass sw-3 round" />
    </Svg>
  )
}

export function ScoringArt() {
  return (
    <Svg viewBox={view}>
      <path d="M96 162h48M120 162V56" className="s-ink sw-3 round" />
      <path d="M52 74L188 50" className="s-ink sw-3 round" />
      <circle cx="120" cy="62" r="7" className="f-brass s-ink sw-2" />
      <path d="M52 74l-20 36M52 74l20 36" className="s-soft sw-2" />
      <path d="M26 110h52q-4 22-26 22t-26-22z" className="f-accent-soft s-ink sw-2 join" />
      <path d="M188 50l-20 36M188 50l20 36" className="s-soft sw-2" />
      <path d="M162 86h52q-4 22-26 22t-26-22z" className="f-sage-soft s-ink sw-2 join" />
      <path d="M40 104v-12M52 104V86M64 104V96" className="s-accent sw-4 round" />
    </Svg>
  )
}

export function MemoArt() {
  return (
    <Svg viewBox={view}>
      <path d="M68 16h74l30 30v118H68z" className="f-paper s-ink sw-2 join" />
      <path d="M142 16v30h30" className="f-paper-sunk s-ink sw-2 join" />
      <path d="M86 70h68M86 88h68M86 106h44" className="s-soft sw-2 round" />
      <path d="M142 150l-6 22 14-8 14 8-6-22" className="f-accent-soft s-ink sw-2 join" />
      <circle cx="150" cy="136" r="20" className="f-accent s-ink sw-2" />
      <path d="M141 136l6 6 11-12" className="f-none s-paper sw-3 round join" />
    </Svg>
  )
}

export function AuditArt() {
  return (
    <Svg viewBox={view}>
      <path d="M62 22v136" className="s-ink sw-2 round" />
      {[
        ['f-accent', 44, 'M88 38h90M88 52h56'],
        ['f-sage', 90, 'M88 84h74M88 98h96'],
        ['f-brass', 136, 'M88 130h96M88 144h40'],
      ].map(([tone, y, lines]) => (
        <g key={y}>
          <circle cx="62" cy={y} r="9" className={`${tone} s-ink sw-2`} />
          <path d={String(lines)} className="s-soft sw-2 round" />
        </g>
      ))}
    </Svg>
  )
}

export function ComplianceArt() {
  return (
    <Svg viewBox={view}>
      <path d="M78 22l50 18v40c0 32-21 58-50 70-29-12-50-38-50-70V40z" className="f-sage-soft s-ink sw-3 join" transform="translate(-6 0)" />
      <path d="M52 84l16 16 30-34" className="f-none s-sage sw-6 round join" transform="translate(-6 0)" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="140" y={52 + i * 32} width="18" height="18" rx="4" className="f-paper s-ink sw-2" />
          <path d={`M168 ${61 + i * 32}h42`} className="s-soft sw-2 round" />
        </g>
      ))}
      <path d="M144 62l4 4 6-8" className="f-none s-accent sw-2 round join" />
    </Svg>
  )
}
