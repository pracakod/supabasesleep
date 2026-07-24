import { useState } from 'react'
import { useTheme, type Theme } from '../../contexts/ThemeContext'
import { Palette, Check } from 'lucide-react'

const THEMES: { id: Theme; name: string; preview: string }[] = [
  { id: 'forest', name: 'Leśna Zieleń', preview: '#1a3a2a' },
  { id: 'dark', name: 'Klasyczny Ciemny', preview: '#191919' },
  { id: 'light', name: 'Klasyczny Jasny', preview: '#f4f4f5' },
  { id: 'sepia', name: 'Sepia / Retro', preview: '#f5efe0' },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-icon"
        title="Zmień motyw"
        style={{ color: 'var(--text-muted)' }}
      >
        <Palette size={16} />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: '110%', zIndex: 50,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 8, minWidth: 180,
            boxShadow: 'var(--shadow)', animation: 'fade-in 0.15s ease',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px 8px', fontWeight: 600 }}>
              Motyw
            </p>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: theme === t.id ? 'var(--accent-glow)' : 'transparent',
                  border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif', fontSize: 13,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: t.preview, flexShrink: 0,
                  border: '2px solid var(--border)',
                }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{t.name}</span>
                {theme === t.id && <Check size={13} color="var(--accent)" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
