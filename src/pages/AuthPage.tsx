import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'

type Mode = 'login' | 'register' | 'reset'

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setMessage({ type: 'error', text: 'Nieprawidłowy email lub hasło.' })
    } else if (mode === 'register') {
      if (!displayName.trim()) {
        setMessage({ type: 'error', text: 'Wprowadź imię lub pseudonim.' })
        setLoading(false)
        return
      }
      const { error } = await signUp(email, password, displayName)
      if (error) setMessage({ type: 'error', text: 'Błąd rejestracji: ' + error.message })
      else setMessage({ type: 'success', text: 'Sprawdź pocztę i potwierdź rejestrację.' })
    } else {
      const { error } = await resetPassword(email)
      if (error) setMessage({ type: 'error', text: 'Nie udało się wysłać emaila.' })
      else setMessage({ type: 'success', text: 'Link do resetowania hasła wysłany na Twoją skrzynkę.' })
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Decorative background */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${200 + i * 60}px`,
            height: `${200 + i * 60}px`,
            borderRadius: '50%',
            background: 'var(--accent-glow)',
            top: `${[10, 70, 30, 80, 50, 20][i]}%`,
            left: `${[10, 80, 50, 20, 70, 40][i]}%`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(60px)',
            opacity: 0.3,
          }} />
        ))}
      </div>

      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            borderRadius: 14, margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px var(--accent-glow)',
          }}>
            <BookOpen size={26} color="#000" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
            Studio Książki
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'login' ? 'Zaloguj się do swojego warsztatu' :
             mode === 'register' ? 'Stwórz konto autora' :
             'Resetowanie hasła'}
          </p>
        </div>

        {/* Tabs */}
        {mode !== 'reset' && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            borderRadius: 10, padding: 4, marginBottom: 20,
          }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setMessage(null) }}
                style={{
                  flex: 1, padding: '8px', borderRadius: 7,
                  background: mode === m ? 'var(--bg-card)' : 'transparent',
                  border: mode === m ? '1px solid var(--border)' : 'none',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: mode === m ? 600 : 400,
                  fontSize: 13.5, cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {m === 'login' ? 'Logowanie' : 'Rejestracja'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="label">Imię / Pseudonim autora</label>
              <input className="input" type="text" placeholder="Jan Kowalski"
                value={displayName} onChange={e => setDisplayName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label className="label">Adres Email</label>
            <input className="input" type="email" placeholder="autor@email.pl"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <label className="label">Hasło</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 40 }} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {message && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
              border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
              color: message.type === 'error' ? '#ef4444' : '#22c55e',
              fontSize: 13,
            }}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', height: 42 }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === 'login' ? 'Zaloguj się' :
             mode === 'register' ? 'Utwórz konto' : 'Wyślij link resetujący'}
          </button>
        </form>

        {mode === 'login' && (
          <button onClick={() => { setMode('reset'); setMessage(null) }}
            style={{
              marginTop: 14, background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: 12.5, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'center',
            }}>
            Nie pamiętam hasła
          </button>
        )}
        {mode === 'reset' && (
          <button onClick={() => { setMode('login'); setMessage(null) }}
            style={{
              marginTop: 14, background: 'none', border: 'none',
              color: 'var(--accent)', fontSize: 12.5, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'center',
            }}>
            ← Wróć do logowania
          </button>
        )}
      </div>
    </div>
  )
}
