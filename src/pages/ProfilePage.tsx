import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ImageUploader from '../components/ui/ImageUploader'
import { Award, Mail, Calendar, Check, AlertCircle, LogOut, Info, X, Sparkles } from 'lucide-react'

export default function ProfilePage() {
  const { profile, updateProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [pseudonym, setPseudonym] = useState(profile?.pseudonym || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showPlansModal, setShowPlansModal] = useState(false)

  // Sync local form state whenever profile loads from Supabase
  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name || '')
    setPseudonym(profile.pseudonym || '')
    setAvatarUrl(profile.avatar_url || '')
  }, [profile?.id]) // only re-sync when switching profiles, not on every change

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const { error: err } = await updateProfile({
      display_name: displayName,
      pseudonym: pseudonym,
      avatar_url: avatarUrl
    })

    setIsSaving(false)
    if (err) {
      setToast({ text: err.message || 'Wystąpił błąd podczas zapisywania profilu.', type: 'error' })
    } else {
      setToast({ text: 'Profil został zaktualizowany pomyślnie.', type: 'success' })
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
            <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Status konta</span>
                <button
                  type="button"
                  onClick={() => setShowPlansModal(true)}
                  style={{
                    background: 'rgba(74, 222, 128, 0.1)',
                    border: '1px solid var(--accent)',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  title="Zobacz limity i porówaj plany subskrypcji"
                >
                  <Info size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Award size={18} style={{
                  color: profile.status === 'pro' ? '#ec4899'
                    : profile.status === 'basic' || profile.status === 'premium' ? '#3b82f6'
                    : 'var(--text-secondary)'
                }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {profile.status === 'pro' ? '🚀 Pro'
                    : profile.status === 'basic' ? '⭐ Podstawowa'
                    : profile.status === 'premium' ? '⭐ Premium'
                    : '🆓 Darmowe'}
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

      {/* Fixed toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 'max(16px, calc(8px + env(safe-area-inset-top, 16px)))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: toast.type === 'success' ? 'var(--accent-glow)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'var(--accent)' : '#ef4444'}`,
          color: toast.type === 'success' ? 'var(--accent)' : '#fca5a5',
          padding: '12px 20px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          whiteSpace: 'nowrap',
          animation: 'slideUpFade 0.25s ease',
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}
      {/* Modal Porównywania Planów */}
      {showPlansModal && (
        <div className="modal-backdrop" onClick={() => setShowPlansModal(false)}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Plany i Limity Subskrypcji</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Wybierz plan idealny dla Twojego procesu twórczego</p>
                </div>
              </div>
              <button onClick={() => setShowPlansModal(false)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
              {/* Plan Darmowy */}
              <div style={{
                background: profile.status === 'free' ? 'rgba(74,222,128,0.05)' : 'var(--bg-secondary)',
                border: `1px solid ${profile.status === 'free' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative'
              }}>
                {profile.status === 'free' && (
                  <span className="badge badge-accent" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10 }}>Twój plan</span>
                )}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>🆓 Darmowy</h3>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>0 zł <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/ mc</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                  <div>📚 <strong>2</strong> projekty książek</div>
                  <div>📝 <strong>10</strong> rozdziałów / projekt</div>
                  <div>👥 <strong>10</strong> postaci</div>
                  <div>📍 <strong>5</strong> lokacji</div>
                  <div>⏳ <strong>10</strong> wydarzeń osi czasu</div>
                  <div>🗂️ <strong>15</strong> kart na tablicy</div>
                </div>
                <button
                  disabled
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', opacity: 0.6, fontSize: 12, marginTop: 8 }}
                >
                  {profile.status === 'free' ? 'Aktualny plan' : 'Darmowy'}
                </button>
              </div>

              {/* Plan Podstawowy */}
              <div style={{
                background: (profile.status === 'basic' || profile.status === 'premium') ? 'rgba(59,130,246,0.05)' : 'var(--bg-secondary)',
                border: `1px solid ${(profile.status === 'basic' || profile.status === 'premium') ? '#3b82f6' : 'var(--border)'}`,
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative'
              }}>
                {(profile.status === 'basic' || profile.status === 'premium') && (
                  <span className="badge" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, background: '#3b82f6', color: '#fff' }}>Twój plan</span>
                )}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>⭐ Podstawowy</h3>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>9 zł <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/ mc</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                  <div>📚 <strong>5</strong> projektów książek</div>
                  <div>📝 <strong>30</strong> rozdziałów / projekt</div>
                  <div>👥 <strong>30</strong> postaci</div>
                  <div>📍 <strong>20</strong> lokacji</div>
                  <div>⏳ <strong>50</strong> wydarzeń osi czasu</div>
                  <div>🗂️ <strong>50</strong> kart na tablicy</div>
                </div>
                {profile.status === 'basic' || profile.status === 'premium' ? (
                  <button disabled className="btn btn-ghost btn-sm" style={{ width: '100%', opacity: 0.7, color: '#3b82f6', borderColor: '#3b82f6', fontSize: 12, marginTop: 8 }}>
                    Aktualny plan
                  </button>
                ) : (
                  <a
                    href={`mailto:kontakt@studioksiazki.pl?subject=Zamowienie%20planu%20Podstawowy%20-%20${encodeURIComponent(profile.email || '')}`}
                    className="btn btn-sm"
                    style={{ width: '100%', background: '#3b82f6', color: '#fff', fontSize: 12, marginTop: 8, justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Zamów plan Podstawowy
                  </a>
                )}
              </div>

              {/* Plan Pro */}
              <div style={{
                background: profile.status === 'pro' ? 'rgba(236,72,153,0.05)' : 'var(--bg-secondary)',
                border: `1px solid ${profile.status === 'pro' ? '#ec4899' : 'var(--border)'}`,
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative'
              }}>
                {profile.status === 'pro' && (
                  <span className="badge" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, background: '#ec4899', color: '#fff' }}>Twój plan</span>
                )}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>🚀 Pro</h3>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#ec4899', marginTop: 4 }}>19 zł <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/ mc</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                  <div>📚 <strong>20</strong> projektów książek</div>
                  <div>📝 <strong>100</strong> rozdziałów / projekt</div>
                  <div>👥 <strong>100</strong> postaci</div>
                  <div>📍 <strong>50</strong> lokacji</div>
                  <div>⏳ <strong>Bez limitu</strong> osi czasu</div>
                  <div>🗂️ <strong>Bez limitu</strong> kart na tablicy</div>
                </div>
                {profile.status === 'pro' ? (
                  <button disabled className="btn btn-ghost btn-sm" style={{ width: '100%', opacity: 0.7, color: '#ec4899', borderColor: '#ec4899', fontSize: 12, marginTop: 8 }}>
                    Aktualny plan
                  </button>
                ) : (
                  <a
                    href={`mailto:kontakt@studioksiazki.pl?subject=Zamowienie%20planu%20Pro%20-%20${encodeURIComponent(profile.email || '')}`}
                    className="btn btn-sm"
                    style={{ width: '100%', background: '#ec4899', color: '#fff', fontSize: 12, marginTop: 8, justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Zamów plan Pro
                  </a>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Aby kupić lub zmienić plan subskrypcji, kliknij <strong>„Zamów plan”</strong> powyżej (otworzy wiadomość e-mail do administratora) lub napisz na: <strong style={{ color: 'var(--text-primary)' }}>kontakt@studioksiazki.pl</strong>. Aktywacja następuje niezwłocznie po zaksięgowaniu płatności.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
