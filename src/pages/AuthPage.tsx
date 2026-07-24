import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Eye, EyeOff, Loader2, Feather } from 'lucide-react'

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

  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState<null | 'terms' | 'privacy'>(null)

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
      if (!termsAccepted) {
        setMessage({ type: 'error', text: 'Musisz zaakceptować Regulamin i Politykę Prywatności.' })
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
      minHeight: '100dvh', // Zapewnia prawidłową wysokość na mobilnym Safari/Chrome bez zasłaniania paska
      width: '100%',
      background: 'radial-gradient(circle at 50% 0%, #15172b 0%, #090a14 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 20px))', // Dodatkowy odstęp na dolny pasek telefonu
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#e2e8f0',
      position: 'relative',
      overflowY: 'auto',
    }}>
      {/* Dynamiczne rozświetlenia w tle (Indygo/Fiolet) */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(79, 70, 229, 0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-200px',
        left: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 10,
        background: 'rgba(19, 22, 38, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: '36px 28px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        margin: 'auto 0', // Środkowanie z zachowaniem przewijania
      }}>
        {/* Logo i Nagłówek */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 58, height: 58,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
          }}>
            <BookOpen size={28} color="#ffffff" strokeWidth={2.2} />
          </div>

          <h1 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.5px',
          }}>
            Studio Książki
          </h1>
          <p style={{ fontSize: 13.5, color: '#94a3b8', marginTop: 6, fontWeight: 400 }}>
            {mode === 'login' ? 'Przestrzeń Pracy dla Twórców i Pisarzy' :
             mode === 'register' ? 'Dołącz do grona autorów i twórz własne dzieła' :
             'Odzyskaj dostęp do swojego warsztatu'}
          </p>
        </div>

        {/* Przełącznik Logowanie / Rejestracja */}
        {mode !== 'reset' && (
          <div style={{
            display: 'flex',
            background: 'rgba(10, 12, 22, 0.7)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setMessage(null) }}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 9,
                  background: mode === m ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))' : 'transparent',
                  border: mode === m ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                  color: mode === m ? '#ffffff' : '#64748b',
                  fontWeight: mode === m ? 600 : 500,
                  fontSize: 13.5, cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: mode === m ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                }}
              >
                {m === 'login' ? 'Logowanie' : 'Rejestracja'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Imię lub Pseudonim autorski
              </label>
              <input
                type="text"
                placeholder="np. Adam Mickiewicz"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  background: 'rgba(10, 12, 22, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
              Adres e-mail
            </label>
            <input
              type="email"
              placeholder="autor@studioksiazki.pl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                background: 'rgba(10, 12, 22, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Hasło
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: 10,
                    background: 'rgba(10, 12, 22, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: 3, accentColor: '#6366f1', cursor: 'pointer', width: 15, height: 15 }}
                />
                <span>
                  Akceptuję{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal('terms')}
                    style={{ background: 'none', border: 'none', color: '#818cf8', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: 12.5, fontWeight: 500 }}
                  >
                    Regulamin
                  </button>
                  {' '}oraz{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal('privacy')}
                    style={{ background: 'none', border: 'none', color: '#818cf8', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: 12.5, fontWeight: 500 }}
                  >
                    Politykę Prywatności
                  </button>
                  .
                </span>
              </label>
            </div>
          )}

          {message && (
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: message.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              color: message.type === 'error' ? '#fca5a5' : '#86efac',
              fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
              marginTop: 6,
              transition: 'transform 0.1s, opacity 0.2s',
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {mode === 'login' ? 'Zaloguj się' :
             mode === 'register' ? 'Utwórz konto autora' : 'Wyślij link do resetowania'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            onClick={() => { setMode('reset'); setMessage(null) }}
            style={{
              marginTop: 20, background: 'none', border: 'none',
              color: '#64748b', fontSize: 13, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'center',
            }}
          >
            Zapomniałeś hasła?
          </button>
        )}

        {mode === 'reset' && (
          <button
            onClick={() => { setMode('login'); setMessage(null) }}
            style={{
              marginTop: 20, background: 'none', border: 'none',
              color: '#818cf8', fontSize: 13, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'center',
            }}
          >
            ← Wróć do ekranu logowania
          </button>
        )}
      </div>

      {/* Modal z Regulaminem i Polityką Prywatności bez wychodzenia ze strony */}
      {showTermsModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div className="fade-in" style={{
            maxWidth: 560, width: '100%', maxHeight: '82vh',
            display: 'flex', flexDirection: 'column', padding: 28,
            background: '#121626',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 16, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Feather size={20} color="#818cf8" />
              {showTermsModal === 'terms' ? 'Regulamin Serwisu Studio Książki' : 'Polityka Prywatności'}
            </h2>
            
            <div style={{
              flex: 1, overflowY: 'auto', paddingRight: 10, fontSize: 13.5,
              color: '#94a3b8', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 14
            }}>
              {showTermsModal === 'terms' ? (
                <>
                  <p><strong style={{ color: '#e2e8f0' }}>1. Postanowienia ogólne i Administrator</strong><br />Serwis Studio Książki służy do tworzenia, zarządzania i edycji utworów literackich oraz materiałów pomocniczych dla autorów. Administratorem serwisu jest właściciel platformy Studio Książki.</p>
                  <p><strong style={{ color: '#e2e8f0' }}>2. Konto Użytkownika</strong><br />Każdy użytkownik jest odpowiedzialny za zachowanie poufności swoich danych logowania oraz za wszelkie działania podejmowane na jego koncie.</p>
                  <p><strong style={{ color: '#e2e8f0' }}>3. Prawa autorskie i treść</strong><br />Wszelkie materiały i treści tworzone przez Użytkownika wewnątrz aplikacji stanowią jego wyłączną własność. Serwis nie rości sobie żadnych praw autorskich do utworów pisarzy.</p>
                  <p><strong style={{ color: '#e2e8f0' }}>4. Dostępność i bazy danych</strong><br />Aplikacja świadczy usługi w modelu SaaS. Korzystanie z wersji darmowej podlega standardowym ograniczeniom technicznym serwisu.</p>
                  <p><strong style={{ color: '#e2e8f0' }}>5. Kontakt i pomoc</strong><br />W sprawach regulaminu i pomocy technicznej prosimy o kontakt pod adresem e-mail: <u style={{ color: '#818cf8' }}>kontakt@studioksiazki.pl</u>.</p>
                </>
              ) : (
                <>
                  <p><strong style={{ color: '#e2e8f0' }}>1. Ochrona danych osobowych i Administrator</strong><br />Zapewniamy pełną ochronę prywatności użytkowników zgodnie z RODO i obowiązującymi przepisami prawa. Administratorem Twoich danych osobowych jest Studio Książki.</p>
                  <p><strong style={{ color: '#e2e8f0' }}>2. Przetwarzanie danych</strong><br />Przetwarzamy Twój adres e-mail oraz nazwę profilu wyłącznie w celu świadczenia usługi logowania i synchronizacji Twoich projektów książkowych.</p>
                  <p><strong style={{ color: '#e2e8f0' }}>3. Bezpieczeństwo i szyfrowanie</strong><br />Dane składowane są w bezpiecznej infrastrukturze Supabase z szyfrowaniem połączeń (TLS/SSL).</p>
                  <p><strong style={{ color: '#e2e8f0' }}>4. Twoje prawa i kontakt</strong><br />Masz prawo wglądu, modyfikacji oraz żądania całkowitego usunięcia swoich danych w dowolnym momencie w ustawieniach profilu. Kontakt w sprawach prywatności: <u style={{ color: '#818cf8' }}>kontakt@studioksiazki.pl</u>.</p>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true)
                  setShowTermsModal(null)
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                }}
              >
                Rozumiem i Akceptuję
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
