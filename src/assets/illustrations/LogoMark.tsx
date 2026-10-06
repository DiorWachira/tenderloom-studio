/** Brand mark: a tiny woven square. Colours mirror public/favicon.svg. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="logo-mark"
    >
      <rect width="32" height="32" rx="9" className="f-accent" />
      <g className="s-brass-soft sw-2 round">
        <path d="M10 6v20M16 6v20M22 6v20" />
      </g>
      <g className="s-on-accent sw-4 round">
        <path d="M6.5 12.5h19M6.5 19.5h19" />
      </g>
      <g className="s-brass-soft sw-2 round">
        <path d="M16 9.5v6M10 16.5v6M22 16.5v6" />
      </g>
    </svg>
  )
}
