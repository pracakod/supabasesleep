import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2, Feather, Sun, Moon, TreePine, BookOpen } from 'lucide-react'

type Mode = 'login' | 'register' | 'reset' | 'update-password'

export default function AuthPage({ initialMode }: { initialMode?: Mode }) {
  const { signIn, signUp, resetPassword } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mode, setMode] = useState<Mode>(initialMode || 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState<null | 'terms' | 'privacy'>(null)

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || window.location.pathname === '/reset-password') {
      setMode('update-password')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setMessage({ type: 'error', text: 'Nieprawidłowy email lub hasło.' })
    } else if (mode === 'register') {
      if (!displayName.trim()) {
        setMessage({ type: 'error', text: 'Wprowadź imię lub pseudonim autorski.' })
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
      else setMessage({ type: 'success', text: 'Sprawdź pocztę i aktywuj swoje konto autora.' })
    } else if (mode === 'reset') {
      const { error } = await resetPassword(email)
      if (error) setMessage({ type: 'error', text: 'Nie udało się wysłać emaila.' })
      else setMessage({ type: 'success', text: 'Link do resetowania hasła wysłany na Twoją skrzynkę.' })
    } else if (mode === 'update-password') {
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Hasła nie są identyczne.' })
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setMessage({ type: 'error', text: 'Hasło musi mieć co najmniej 6 znaków.' })
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage({ type: 'error', text: 'Błąd zmiany hasła: ' + error.message })
      } else {
        setMessage({ type: 'success', text: 'Hasło zostało zmienione! Możesz się teraz zalogować.' })
        setTimeout(() => {
          setMode('login')
          window.location.hash = ''
        }, 2000)
      }
    }

    setLoading(false)
  }

  const themesList = [
    { id: 'forest', name: 'Zieleń', icon: TreePine },
    { id: 'dark', name: 'Ciemny', icon: Moon },
    { id: 'sepia', name: 'Sepia', icon: BookOpen },
    { id: 'light', name: 'Jasny', icon: Sun },
  ] as const

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 16px))',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflowY: 'auto',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      {/* Przełącznik motywu w prawym górnym rogu */}
      <div style={{
        position: 'absolute',
        top: 16, right: 16,
        display: 'flex',
        gap: 6,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        padding: 4,
        borderRadius: 20,
        zIndex: 20,
      }}>
        {themesList.map((t) => {
          const Icon = t.icon
          const isActive = theme === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={`Motyw: ${t.name}`}
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? (t.id === 'sepia' || t.id === 'light' ? '#ffffff' : '#000000') : 'var(--text-muted)',
                border: 'none',
                borderRadius: 14,
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={14} />
            </button>
          )
        })}
      </div>
      {/* Subtelne linie papeterii / siatki w tle */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
        opacity: 0.6,
      }} />

      {/* Zgrabna, wyważona karta logowania - Zintegrowana z motywami */}
      <div className="fade-in" style={{
        width: '100%',
        maxWidth: 400,
        position: 'relative',
        zIndex: 10,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 22px',
        boxShadow: 'var(--shadow)',
        margin: 'auto 0',
      }}>
        {/* Logo i Nazwa w jednym zgrabnym wierszu u góry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38,
            borderRadius: 10,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px var(--accent-glow)',
            flexShrink: 0,
          }}>
            <Feather size={19} color={theme === 'sepia' || theme === 'light' ? '#ffffff' : '#000000'} />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0, lineHeight: 1.2 }}>
              Studio Książki
            </h1>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>
              {mode === 'login' ? 'Przestrzeń Pracy dla Autorów' :
               mode === 'register' ? 'Dołącz do grona pisarzy' :
               'Odzyskaj dostęp'}
            </span>
          </div>
        </div>

        {/* Przełącznik Logowanie / Rejestracja */}
        {mode !== 'reset' && mode !== 'update-password' && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            padding: 3,
            marginBottom: 16,
            border: '1px solid var(--border)',
          }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setMessage(null) }}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 6,
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  border: 'none',
                  color: mode === m ? (theme === 'sepia' || theme === 'light' ? '#ffffff' : '#000000') : 'var(--text-muted)',
                  fontWeight: mode === m ? 600 : 500,
                  fontSize: 12.5, cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                {m === 'login' ? 'Logowanie' : 'Rejestracja'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
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
                  padding: '9px 11px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {mode !== 'update-password' && (
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
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
                  padding: '9px 11px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {mode !== 'reset' && (
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {mode === 'update-password' ? 'Nowe Hasło' : 'Hasło'}
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
                    padding: '9px 36px 9px 11px',
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'update-password' && (
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Powtórz nowe hasło
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          )}

            {mode === 'register' && (
              <div style={{ marginTop: 2 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: 2, accentColor: 'var(--accent)', cursor: 'pointer', width: 15, height: 15 }}
                  />
                  <span>
                    Akceptuję{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal('terms')}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      Regulamin
                    </button>
                    {' '}oraz{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal('privacy')}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
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
                padding: '10px 14px', borderRadius: 8,
                background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                color: message.type === 'error' ? '#ef4444' : '#22c55e',
                fontSize: 12.5,
              }}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11.5px',
                borderRadius: 9,
                background: 'var(--accent)',
                color: theme === 'sepia' || theme === 'light' ? '#ffffff' : '#000000',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px var(--accent-glow)',
                marginTop: 4,
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === 'login' ? 'Wejdź do Warsztatu' :
               mode === 'register' ? 'Dołącz i Twórz' :
               mode === 'reset' ? 'Wyślij link resetujący' :
               'Zapisz nowe hasło'}
            </button>
          </form>

          {mode === 'login' && (
            <button
              onClick={() => { setMode('reset'); setMessage(null) }}
              style={{
                marginTop: 18, background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: 12.5, cursor: 'pointer',
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
              marginTop: 18, background: 'none', border: 'none',
              color: 'var(--accent)', fontSize: 12.5, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'center',
            }}
          >
            ← Wróć do logowania
          </button>
        )}
      </div>

      {/* Dół strony: Piękny cytat literacki + Wersja i Autor */}
      <div style={{
        marginTop: 20,
        textAlign: 'center',
        maxWidth: 400,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Piękny cytat */}
        <div style={{
          padding: '12px 18px',
          background: 'var(--bg-secondary)',
          borderRadius: 14,
          border: '1px solid var(--border)',
          backdropFilter: 'blur(6px)',
        }}>
          <p style={{
            fontFamily: 'Merriweather, serif',
            fontSize: 12.5,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            „Nie ma większej udręki niż noszenie w sobie nienapisanej historii.”
          </p>
          <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            — Maya Angelou
          </span>
        </div>

        {/* Wersja projektu i Autor */}
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span>Studio Książki v1.0.0</span>
          <span>•</span>
          <span>Dla Pisarzy i Twórców</span>
        </div>
      </div>

      {/* Modal z Regulaminem i Polityką Prywatności */}
      {showTermsModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div className="fade-in" style={{
            maxWidth: 560, width: '100%', maxHeight: '82vh',
            display: 'flex', flexDirection: 'column', padding: 28,
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 20,
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 16, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Feather size={20} color="#818cf8" />
              {showTermsModal === 'terms' ? 'Regulamin Serwisu Studio Książki' : 'Polityka Prywatności'}
            </h2>
            
            <div style={{
              flex: 1, overflowY: 'auto', paddingRight: 10, fontSize: 13.5,
              color: '#cbd5e1', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 14
            }}>
              {showTermsModal === 'terms' ? (
                <>
                  <p><strong style={{ color: '#ffffff' }}>1. Postanowienia ogólne i Administrator</strong><br />Serwis Studio Książki służy do tworzenia, zarządzania i edycji utworów literackich oraz materiałów pomocniczych dla autorów. Administratorem serwisu jest Studio Książki.</p>
                  <p><strong style={{ color: '#ffffff' }}>2. Konto Użytkownika</strong><br />Każdy użytkownik jest odpowiedzialny za zachowanie poufności swoich danych logowania oraz za wszelkie działania podejmowane na jego koncie.</p>
                  <p><strong style={{ color: '#ffffff' }}>3. Prawa autorskie i treść</strong><br />Wszelkie materiały i treści tworzone przez Użytkownika wewnątrz aplikacji stanowią jego wyłączną własność. Serwis nie rości sobie żadnych praw autorskich do utworów pisarzy.</p>
                  <p><strong style={{ color: '#ffffff' }}>4. Dostępność i bazy danych</strong><br />Aplikacja świadczy usługi w modelu SaaS. Korzystanie z wersji darmowej podlega standardowym ograniczeniom technicznym serwisu.</p>
                  <p><strong style={{ color: '#ffffff' }}>5. Kontakt i pomoc</strong><br />W sprawach regulaminu i pomocy technicznej prosimy o kontakt pod adresem e-mail: <u style={{ color: '#a5b4fc' }}>kontakt@studioksiazki.pl</u>.</p>
                </>
              ) : (
                <>
                  <p><strong style={{ color: '#ffffff' }}>1. Ochrona danych osobowych i Administrator</strong><br />Zapewniamy pełną ochronę prywatności użytkowników zgodnie z RODO i obowiązującymi przepisami prawa. Administratorem Twoich danych osobowych jest Studio Książki.</p>
                  <p><strong style={{ color: '#ffffff' }}>2. Przetwarzanie danych</strong><br />Przetwarzamy Twój adres e-mail oraz nazwę profilu wyłącznie w celu świadczenia usługi logowania i synchronizacji Twoich projektów książkowych.</p>
                  <p><strong style={{ color: '#ffffff' }}>3. Bezpieczeństwo i szyfrowanie</strong><br />Dane składowane są w bezpiecznej infrastrukturze Supabase z szyfrowaniem połączeń (TLS/SSL).</p>
                  <p><strong style={{ color: '#ffffff' }}>4. Twoje prawa i kontakt</strong><br />Masz prawo wglądu, modyfikacji oraz żądania całkowitego usunięcia swoich danych w dowolnym momencie w ustawieniach profilu. Kontakt w sprawach prywatności: <u style={{ color: '#a5b4fc' }}>kontakt@studioksiazki.pl</u>.</p>
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
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
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
