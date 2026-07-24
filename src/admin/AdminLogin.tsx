import React, { useState } from 'react'
import { Shield, Lock, User, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    const adminUser = import.meta.env.VITE_ADMIN_LOGIN || 'admin'
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@StudioKsiazki2025!'

    if (username === adminUser && password === adminPass) {
      localStorage.setItem('admin_session', 'true')
      // Navigate to admin dashboard
      window.location.href = '/admin'
    } else {
      setError('Błędne dane logowania administratora.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1f15', // Ciemny motyw zieleni leśnej
      color: '#e8f5ee',
      padding: 16
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, padding: 32, background: '#122019', borderColor: '#2a4a35' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid #4ade80',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            color: '#4ade80'
          }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Panel Administratora</h1>
          <p style={{ fontSize: 13, color: '#9dbfaa', marginTop: 4 }}>Studio Książki SaaS Management</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label" style={{ color: '#9dbfaa' }}>Login</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ paddingLeft: 36, background: '#172a1e', borderColor: '#2a4a35' }}
                placeholder="Nazwa użytkownika"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <User size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#5a8a6a' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="label" style={{ color: '#9dbfaa' }}>Hasło</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input"
                style={{ paddingLeft: 36, background: '#172a1e', borderColor: '#2a4a35' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Lock size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#5a8a6a' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, background: '#4ade80' }}>
            Zaloguj do Panelu
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 12, color: '#9dbfaa', textDecoration: 'none' }}>Wróć do aplikacji</a>
        </div>
      </div>
    </div>
  )
}
