import React, { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Project } from '../../types/database.types'
import type { CollabPresence } from '../../hooks/useRealtimeCollab'
import NetworkStatus from './NetworkStatus'
import ThemeSwitcher from './ThemeSwitcher'
import { Menu, Plus, BookOpen, Check, X, Shield, Users } from 'lucide-react'

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Panel',
  editor: 'Edytor',
  characters: 'Postacie',
  locations: 'Miejsca',
  timeline: 'Oś czasu',
  kanban: 'Kanban',
  research: 'Research',
  'writer-zone': 'Strefa',
  profile: 'Profil',
}

interface TopBarProps {
  onMenuToggle: () => void
  participants?: CollabPresence[]
  activeModule?: string
}

export default function TopBar({ onMenuToggle, participants = [], activeModule = '' }: TopBarProps) {
  const { currentProject, setCurrentProject } = useProject()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    genre: '',
    target_words: 80000,
    description: ''
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return []
      console.log('[TopBar] Pobieram listę projektów dla użytkownika:', user.id)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
      if (error) {
        console.error('[TopBar] Błąd podczas pobierania projektów z bazy:', error)
        throw error
      }
      console.log('[TopBar] Pomyślnie pobrano projekty:', data)
      return (data || []) as Project[]
    },
    enabled: !!user,
  })

  React.useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      console.log('[TopBar] Automatycznie ustawiam pierwszy projekt jako aktywny:', projects[0])
      setCurrentProject(projects[0])
    }
  }, [projects, currentProject, setCurrentProject])

  const createProject = useMutation({
    mutationFn: async () => {
      console.log('[TopBar] Rozpoczynam mutację tworzenia projektu z danymi:', newProjectForm)
      if (!user) {
        throw new Error('Musisz być zalogowany, aby stworzyć projekt.')
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          title: newProjectForm.title || 'Nowa Książka',
          genre: newProjectForm.genre,
          target_words: Number(newProjectForm.target_words || 80000),
          description: newProjectForm.description
        })
        .select()
        .single()
        
      if (error) {
        console.error('[TopBar] Błąd bazy danych przy insert projects:', error)
        throw error
      }
      console.log('[TopBar] Projekt pomyślnie wstawiony do tabeli projects:', data)
      return data as Project
    },
    onSuccess: (newProj) => {
      console.log('[TopBar] Sukces! Projekt został pomyślnie utworzony:', newProj)
      qc.invalidateQueries({ queryKey: ['projects'] })
      if (newProj) {
        setCurrentProject(newProj)
      }
      setShowNewProjectModal(false)
      setErrorMsg(null)
      setNewProjectForm({ title: '', genre: '', target_words: 80000, description: '' })
    },
    onError: (err: any) => {
      console.error('[TopBar] Błąd podczas tworzenia projektu:', err)
      setErrorMsg(err.message || 'Wystąpił nieoczekiwany błąd podczas tworzenia projektu.')
    }
  })

  const adminSession = localStorage.getItem('admin_session') === 'true'

  return (
    <div className="topbar">
      {/* Przycisk mobile menu */}
      <button
        onClick={onMenuToggle}
        className="btn-icon btn-ghost mobile-only"
        style={{ marginRight: 4 }}
        aria-label="Otwórz menu"
      >
        <Menu size={18} />
      </button>

      {/* Switcher projektów */}
      <div className="topbar-center">
        <BookOpen size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} className="mobile-hide" />
        <select
          className="topbar-select"
          value={currentProject?.id || ''}
          onChange={(e) => {
            const selected = projects.find(p => p.id === e.target.value)
            if (selected) setCurrentProject(selected)
          }}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
          {projects.length === 0 && <option value="">Brak projektów</option>}
        </select>

        <button
          onClick={() => { setErrorMsg(null); setShowNewProjectModal(true); }}
          className="btn btn-ghost btn-sm mobile-hide"
          style={{ height: 32, padding: '0 10px', gap: 4, borderRadius: 6 }}
        >
          <Plus size={13} /> Nowy
        </button>

        {activeModule && (
          <div
            className="mobile-hide"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-secondary)',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ color: 'var(--accent)', opacity: 0.6 }}>/</span>
            <span>{MODULE_LABELS[activeModule] ?? activeModule}</span>
          </div>
        )}
      </div>

      {/* Prawy panel */}
      <div className="topbar-actions">

        {/* Avatary uczestników współpracy */}
        {participants.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowParticipants(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--accent-glow)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '3px 10px 3px 6px', cursor: 'pointer',
              }}
              title="Aktywni współpracownicy"
            >
              <Users size={12} style={{ color: 'var(--accent)' }} />
              {/* Stackowane avatary */}
              <div style={{ display: 'flex', marginLeft: 2 }}>
                {participants.slice(0, 4).map((p, i) => (
                  <div
                    key={p.userId}
                    title={`${p.displayName} – ${MODULE_LABELS[p.module] ?? p.module}`}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: p.color,
                      border: '2px solid var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: '#000',
                      marginLeft: i > 0 ? -6 : 0,
                      zIndex: 10 - i,
                      position: 'relative',
                    }}
                  >
                    {p.displayName[0]?.toUpperCase()}
                  </div>
                ))}
                {participants.length > 4 && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--border)', border: '2px solid var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: 'var(--text-muted)',
                    marginLeft: -6, position: 'relative', zIndex: 5,
                  }}>
                    +{participants.length - 4}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                {participants.length}
              </span>
            </button>

            {/* Dropdown uczestników */}
            {showParticipants && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 8, minWidth: 200,
                boxShadow: 'var(--shadow)', zIndex: 60,
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 8px 8px' }}>
                  Teraz online
                </p>
                {participants.map(p => (
                  <div key={p.userId} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 6,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: p.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0,
                    }}>
                      {p.displayName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.displayName}
                      </p>
                      <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        📍 {MODULE_LABELS[p.module] ?? p.module}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminSession && (
          <a
            href="/admin"
            className="btn btn-ghost btn-sm mobile-hide"
            style={{
              borderColor: 'var(--border)',
              background: 'rgba(74,222,128,0.1)',
              color: 'var(--accent)',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <Shield size={12} /> Admin
          </a>
        )}

        <NetworkStatus />
        <ThemeSwitcher />
      </div>

      {/* Modal nowego projektu */}
      {showNewProjectModal && (
        <div className="modal-backdrop" onClick={() => setShowNewProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Utwórz Nowy Projekt</h2>
              <button onClick={() => setShowNewProjectModal(false)} className="btn-icon btn-ghost"><X size={16} /></button>
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12.5,
                marginBottom: 16,
                wordBreak: 'break-word'
              }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="label">Tytuł Książki *</label>
              <input
                className="input"
                placeholder="np. Ostatni Strażnik, Cicha Noc..."
                value={newProjectForm.title}
                onChange={e => setNewProjectForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Gatunek</label>
              <input
                className="input"
                placeholder="np. Fantasy, Sci-Fi, Romans, Kryminał"
                value={newProjectForm.genre}
                onChange={e => setNewProjectForm(f => ({ ...f, genre: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="label">Cel słów</label>
              <input
                type="number"
                className="input"
                value={newProjectForm.target_words}
                onChange={e => setNewProjectForm(f => ({ ...f, target_words: Number(e.target.value) }))}
              />
            </div>

            <div className="form-group">
              <label className="label">Krótki opis</label>
              <textarea
                className="textarea"
                style={{ minHeight: 70 }}
                placeholder="Opisz zarys fabuły lub główne założenie..."
                value={newProjectForm.description}
                onChange={e => setNewProjectForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowNewProjectModal(false)} className="btn btn-ghost">Anuluj</button>
              <button
                onClick={() => createProject.mutate()}
                className="btn btn-primary"
                disabled={createProject.isPending || !newProjectForm.title.trim()}
              >
                <Check size={14} /> Stwórz Książkę
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
