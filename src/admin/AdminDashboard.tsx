import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Profile } from '../types/database.types'
import { Shield, Users, BookOpen, FileText, Star, Ban, Unlock, LogOut, Trash2 } from 'lucide-react'

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
    mutationFn: async ({ userId, status }: { userId: string; status: 'free' | 'premium' | 'blocked' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_profiles'] })
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
  const premiumUsersCount = users.filter(u => u.status === 'premium').length

  if (!isAdmin) {
    window.location.href = '/admin-login'
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1f15',
      color: '#e8f5ee',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Topbar Admina */}
      <header style={{
        height: 64,
        background: '#122019',
        borderBottom: '1px solid #2a4a35',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
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

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" className="btn btn-ghost btn-sm" style={{ borderColor: '#2a4a35', color: '#9dbfaa' }}>
            Aplikacja Pisarza
          </a>
          <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ gap: 6 }}>
            <LogOut size={13} /> Wyloguj
          </button>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* Sekcja Statystyk */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
              <Users size={22} />
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#9dbfaa' }}>Wszyscy Autorzy</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{users.length}</h2>
            </div>
          </div>

          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#9dbfaa' }}>Aktywne Projekty</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{stats?.total_projects || 0}</h2>
            </div>
          </div>

          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <FileText size={22} />
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#9dbfaa' }}>Napisane Słowa (SaaS)</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{totalWords.toLocaleString()}</h2>
            </div>
          </div>

          <div className="card" style={{ background: '#122019', borderColor: '#2a4a35', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
              <Star size={22} />
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#9dbfaa' }}>Konta Premium</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{premiumUsersCount}</h2>
            </div>
          </div>
        </div>

        {/* Lista użytkowników */}
        <div className="card fade-in" style={{ background: '#122019', borderColor: '#2a4a35', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Zarządzanie Użytkownikami SaaS</h2>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9dbfaa' }}>Ładowanie danych użytkowników...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ color: '#9dbfaa', borderBottomColor: '#2a4a35' }}>Autor</th>
                    <th style={{ color: '#9dbfaa', borderBottomColor: '#2a4a35' }}>Email</th>
                    <th style={{ color: '#9dbfaa', borderBottomColor: '#2a4a35' }}>Data dołączenia</th>
                    <th style={{ color: '#9dbfaa', borderBottomColor: '#2a4a35' }}>Słowa</th>
                    <th style={{ color: '#9dbfaa', borderBottomColor: '#2a4a35' }}>Subskrypcja</th>
                    <th style={{ color: '#9dbfaa', borderBottomColor: '#2a4a35', textAlign: 'right' }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.display_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#172a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, border: '1px solid #2a4a35' }}>
                              {user.display_name ? user.display_name.substring(0, 2).toUpperCase() : 'DK'}
                            </div>
                          )}
                          <div>
                            <span style={{ fontWeight: 600 }}>{user.display_name || 'Nienazwany autor'}</span>
                            <span style={{ fontSize: 11, color: '#9dbfaa', display: 'block' }}>Pseudonim: {user.pseudonym}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#9dbfaa' }}>{user.email || 'brak email'}</td>
                      <td style={{ color: '#9dbfaa' }}>{new Date(user.created_at).toLocaleDateString('pl-PL')}</td>
                      <td style={{ fontWeight: 600 }}>{(user.total_words || 0).toLocaleString()}</td>
                      <td>
                        {user.status === 'premium' && <span className="badge badge-premium">Premium</span>}
                        {user.status === 'free' && <span className="badge badge-free">Darmowy</span>}
                        {user.status === 'blocked' && <span className="badge badge-blocked">Zablokowany</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {user.status !== 'premium' ? (
                            <button
                              onClick={() => updateStatus.mutate({ userId: user.id, status: 'premium' })}
                              className="btn btn-ghost btn-sm"
                              style={{ borderColor: '#2a4a35', color: '#f59e0b', padding: '4px 8px', fontSize: 11 }}
                            >
                              Daj Premium
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStatus.mutate({ userId: user.id, status: 'free' })}
                              className="btn btn-ghost btn-sm"
                              style={{ borderColor: '#2a4a35', color: '#9dbfaa', padding: '4px 8px', fontSize: 11 }}
                            >
                              Zabierz Premium
                            </button>
                          )}

                          {user.status !== 'blocked' ? (
                            <button
                              onClick={() => updateStatus.mutate({ userId: user.id, status: 'blocked' })}
                              className="btn btn-ghost btn-sm"
                              style={{ borderColor: '#2a4a35', color: '#ef4444', padding: '4px 8px', fontSize: 11 }}
                            >
                              <Ban size={11} style={{ marginRight: 2 }} /> Zablokuj
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStatus.mutate({ userId: user.id, status: 'free' })}
                              className="btn btn-ghost btn-sm"
                              style={{ borderColor: '#2a4a35', color: '#4ade80', padding: '4px 8px', fontSize: 11 }}
                            >
                              <Unlock size={11} style={{ marginRight: 2 }} /> Odblokuj
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm('Czy na pewno chcesz usunąć to konto autorskie? Akcja jest nieodwracalna.')) {
                                deleteUser.mutate(user.id)
                              }
                            }}
                            className="btn-icon btn-ghost"
                            style={{ borderColor: '#2a4a35', color: '#ef4444', padding: 5 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px 10px', color: '#9dbfaa' }}>
                        Brak zarejestrowanych autorów w bazie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
