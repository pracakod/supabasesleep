import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ImageUploader from '../components/ui/ImageUploader'
import { Award, Mail, Calendar, Check, AlertCircle, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { profile, updateProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [pseudonym, setPseudonym] = useState(profile?.pseudonym || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage('')
    setError('')

    const { error: err } = await updateProfile({
      display_name: displayName,
      pseudonym: pseudonym,
      avatar_url: avatarUrl
    })

    setIsSaving(false)
    if (err) {
      setError(err.message || 'Wystąpił błąd podczas zapisywania profilu.')
    } else {
      setMessage('Profil został zaktualizowany pomyślnie.')
    }
  }

  if (!profile) return null

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="dashboard-container fade-in" style={{ maxWidth: 650, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Profil Autora</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Zarządzaj swoimi danymi publicznymi i pseudonimem artystycznym</p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {message && (
          <div style={{
            background: 'var(--accent-glow)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}>
            <Check size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-grid-avatar">
            <ImageUploader
              currentUrl={avatarUrl}
              folder="avatars"
              onUpload={url => setAvatarUrl(url)}
              aspectRatio="1/1"
              size="lg"
              label="Avatar"
            />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Avatar Autora</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                Zdjęcie lub grafika, która będzie widoczna przy Twoich komentarzach i projektach. Kompresowana automatycznie do formatu WebP.
              </p>
            </div>
          </div>

          <div className="form-grid-two">
            <div className="form-group">
              <label className="label">Imię i nazwisko (Nazwa wyświetlana)</label>
              <input
                className="input"
                placeholder="np. Jan Kowalski"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Pseudonim literacki *</label>
              <input
                className="input"
                placeholder="np. J. K. Sparrow"
                value={pseudonym}
                onChange={e => setPseudonym(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Adres Email</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{profile.email}</span>
            </div>
          </div>

          <div className="form-grid-two" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Status konta</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Award size={18} style={{ color: profile.status === 'premium' ? '#f59e0b' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {profile.status === 'premium' ? ' ⭐ Premium' : ' 🆓 Darmowe'}
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Napisane słowa ogółem</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Calendar size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {(profile.total_words || 0).toLocaleString()} słów
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => signOut()}
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: 6 }}
            >
              <LogOut size={16} /> Wyloguj z aplikacji
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  )
}
