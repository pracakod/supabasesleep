import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Profile } from '../types/database.types'
import { Shield, Users, BookOpen, FileText, Star, LogOut, Trash2 } from 'lucide-react'

export default function AdminDashboard() {
  const qc = useQueryClient()

  const isAdmin = localStorage.getItem('admin_session') === 'true'

  // Pobierz profile użytkowników
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_profiles'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Profile[]
    }
  })

  // Pobierz statystyki (liczba projektów)
  const { data: stats } = useQuery({
    queryKey: ['admin_stats'],
    enabled: isAdmin,
    queryFn: async () => {
      // Pobieramy z widoku admin_stats
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single()
      
      if (error) {
        // Fallback w razie braku uprawnień do widoku
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        return {
          total_users: usersCount || 0,
          total_projects: usersCount ? usersCount * 2 : 0, // Szacunkowo
          total_words: 0
        }
      }
      return data
    }
  })

  // Mutacje statusu użytkownika
  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'free' | 'basic' | 'pro' | 'premium' | 'blocked' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) {
        console.error('[Admin] Błąd zmiany statusu:', error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries()
    },
    onError: (err: any) => {
      console.error('[Admin] Błąd:', err)
      alert(`Nie udało się zmienić statusu! Błąd z bazy danych: ${err.message || JSON.stringify(err)}`)
    }
  })

  // Mutacja usuwania użytkownika
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Usuwamy profil w public.profiles (powiązany kaskadowo z auth.users w bazie deweloperskiej)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_profiles'] })
    }
  })

  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    window.location.href = '/admin-login'
  }

  // Obliczenia statystyk z pobranych profili (jako backup)
  const totalWords = users.reduce((acc, u) => acc + (u.total_words || 0), 0)
  const premiumCount = users.filter(u => u.status === 'premium').length

  if (!isAdmin) {
    window.location.href = '/admin-login'
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      height: 'auto',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      background: '#0d1f15',
      color: '#e8f5ee',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Topbar Admina */}
      <header style={{
        minHeight: 64,
        background: '#122019',
        borderBottom: '1px solid #2a4a35',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        flexWrap: 'wrap',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid #4ade80',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4ade80'
          }}>
            <Shield size={18} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>Studio Admin</span>
          <span className="badge badge-accent" style={{ fontSize: 9, padding: '2px 6px' }}>SaaS Console</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/" className="btn btn-ghost btn-sm" style={{ borderColor: '#2a4a35', color: '#9dbfaa', fontSize: 12 }}>
            Aplikacja
          </a>
          <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ gap: 4, fontSize: 12 }}>
            <LogOut size={13} /> Wyloguj
          </button>
        </div>
      </header>

      <main style={{ padding: '16px 12px 80px 12px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Sekcja Statystyk */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', flexShrink: 0 }}>
              <Users size={18} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#9dbfaa' }}>Autorzy</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 1 }}>{users.length}</h2>
            </div>
          </div>

          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
              <BookOpen size={18} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#9dbfaa' }}>Projekty</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 1 }}>{stats?.total_projects || 0}</h2>
            </div>
          </div>

          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
              <FileText size={18} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#9dbfaa' }}>Słowa</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 1 }}>{totalWords.toLocaleString()}</h2>
            </div>
          </div>

          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', flexShrink: 0 }}>
              <Star size={18} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#9dbfaa' }}>Premium</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 1 }}>{premiumCount}</h2>
            </div>
          </div>
        </div>

        {/* Lista użytkowników */}
        <div className="card fade-in" style={{ background: '#122019', borderColor: '#2a4a35', padding: '16px 12px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Zarządzanie Użytkownikami SaaS</h2>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9dbfaa' }}>Ładowanie danych użytkowników...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {users.map(user => (
                <div key={user.id} style={{
                  background: '#172a1e',
                  border: '1px solid #2a4a35',
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0d1f15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: '1px solid #2a4a35', color: '#4ade80', fontWeight: 700 }}>
                          {user.display_name ? user.display_name.substring(0, 2).toUpperCase() : 'DK'}
                        </div>
                      )}
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{user.display_name || 'Nienazwany autor'}</span>
                        <span style={{ fontSize: 11, color: '#9dbfaa', display: 'block' }}>{user.email || 'brak email'}</span>
                      </div>
                    </div>

                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: user.status === 'pro' ? 'rgba(236,72,153,0.15)'
                        : user.status === 'basic' || user.status === 'premium' ? 'rgba(59,130,246,0.15)'
                        : user.status === 'blocked' ? 'rgba(239,68,68,0.15)'
                        : 'rgba(74,222,128,0.1)',
                      color: user.status === 'pro' ? '#ec4899'
                        : user.status === 'basic' || user.status === 'premium' ? '#3b82f6'
                        : user.status === 'blocked' ? '#ef4444'
                        : '#4ade80',
                    }}>
                      {user.status === 'pro' ? '🚀 Pro'
                        : user.status === 'basic' ? '⭐ Podstawowa'
                        : user.status === 'premium' ? '⭐ Premium'
                        : user.status === 'blocked' ? '🚫 Zablokowany'
                        : '🆓 Darmowy'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#9dbfaa', paddingTop: 6, borderTop: '1px dashed #2a4a35' }}>
                    <span>Słowa: <strong style={{ color: '#e8f5ee' }}>{(user.total_words || 0).toLocaleString()}</strong></span>
                    <span>Dołączył: {new Date(user.created_at).toLocaleDateString('pl-PL')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                    <label style={{ fontSize: 12, color: '#9dbfaa' }}>Status konta:</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        value={user.status || 'free'}
                        disabled={updateStatus.isPending}
                        onChange={e => updateStatus.mutate({ userId: user.id, status: e.target.value as any })}
                        style={{
                          background: '#0d1f15',
                          border: '1px solid #2a4a35',
                          borderRadius: 6,
                          color: '#e8f5ee',
                          fontSize: 12,
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="free">🆓 Darmowy</option>
                        <option value="basic">⭐ Podstawowa</option>
                        <option value="pro">🚀 Pro</option>
                        <option value="blocked">🚫 Zablokowany</option>
                      </select>

                      <button
                        onClick={() => {
                          if (confirm('Czy na pewno chcesz usunąć to konto autorskie? Akcja jest nieodwracalna.')) {
                            deleteUser.mutate(user.id)
                          }
                        }}
                        className="btn-icon btn-ghost"
                        style={{ borderColor: '#2a4a35', color: '#ef4444', padding: 6 }}
                        title="Usuń konto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#9dbfaa' }}>
                  Brak zarejestrowanych autorów w bazie.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
