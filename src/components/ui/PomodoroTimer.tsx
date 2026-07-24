import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react'

const MODES = [
  { label: 'Skupienie', minutes: 25, color: '#4ade80' },
  { label: 'Krótka przerwa', minutes: 5, color: '#60a5fa' },
  { label: 'Długa przerwa', minutes: 15, color: '#c084fc' },
]

export default function PomodoroTimer() {
  const [modeIdx, setModeIdx] = useState(0)
  const [seconds, setSeconds] = useState(MODES[0].minutes * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const mode = MODES[modeIdx]
  const total = mode.minutes * 60
  const progress = (seconds / total) * 100
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference * (progress / 100)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false)
            if (modeIdx === 0) setSessions(n => n + 1)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, modeIdx])

  const setMode = (i: number) => {
    setModeIdx(i)
    setSeconds(MODES[i].minutes * 60)
    setRunning(false)
  }

  const reset = () => {
    setSeconds(mode.minutes * 60)
    setRunning(false)
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, justifyContent: 'center' }}>
        {MODES.map((m, i) => (
          <button key={i} onClick={() => setMode(i)} className="btn btn-ghost btn-sm"
            style={{
              background: modeIdx === i ? 'var(--accent-glow)' : 'transparent',
              color: modeIdx === i ? 'var(--accent)' : 'var(--text-muted)',
              borderColor: modeIdx === i ? 'var(--accent)' : 'var(--border)',
              fontSize: 11,
            }}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="pomodoro-ring" style={{ margin: '0 auto 16px' }}>
        <svg width={108} height={108}>
          <circle cx={54} cy={54} r={radius} fill="none" stroke="var(--border)" strokeWidth={6} />
          <circle
            cx={54} cy={54} r={radius} fill="none"
            stroke={mode.color} strokeWidth={6}
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -1 }}>
            {mm}:{ss}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {mode.label}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => setRunning(!running)} className="btn btn-primary" style={{ gap: 6 }}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Pauza' : 'Start'}
        </button>
        <button onClick={reset} className="btn btn-ghost btn-icon">
          <RotateCcw size={14} />
        </button>
      </div>

      {sessions > 0 && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <Coffee size={13} />
          {sessions} {sessions === 1 ? 'sesja' : sessions < 5 ? 'sesje' : 'sesji'} dziś
        </div>
      )}
    </div>
  )
}
