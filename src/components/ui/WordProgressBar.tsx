
interface Props {
  current: number
  target: number
  label?: string
}

export default function WordProgressBar({ current, target, label = 'Słowa' }: Props) {
  const pct = Math.min((current / Math.max(target, 1)) * 100, 100)

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt(current)}</span>
          {' / '}
          <span>{fmt(target)}</span>
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ marginTop: 4, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)' }}>
        {pct.toFixed(1)}% ukończenia
      </div>
    </div>
  )
}
