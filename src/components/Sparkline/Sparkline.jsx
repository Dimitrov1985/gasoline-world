const COLOR = {
  cheap:     'var(--green)',
  medium:    'var(--amber)',
  expensive: 'var(--red)',
}

export default function Sparkline({ points, cls, width = 56, height = 20 }) {
  if (!points || points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 0.01
  const pad = 2

  const pts = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2)
    const y = pad + ((max - v) / range) * (height - pad * 2)
    return [+x.toFixed(1), +y.toFixed(1)]
  })

  const polyPts = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]

  const delta   = ((points[points.length - 1] - points[0]) / points[0]) * 100
  const isUp    = delta >= 0
  const color   = COLOR[cls] ?? 'var(--muted)'
  const dColor  = isUp ? 'var(--red)' : 'var(--green)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          points={polyPts}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        <circle cx={lx} cy={ly} r="2.2" fill={color} />
      </svg>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.52rem',
        color: dColor,
        letterSpacing: '0.3px',
        lineHeight: 1,
      }}>
        {isUp ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}%
      </span>
    </div>
  )
}
