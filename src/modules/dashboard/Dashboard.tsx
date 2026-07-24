import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProject } from '../../contexts/ProjectContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import WordProgressBar from '../../components/ui/WordProgressBar'
import { useDebounce } from '../../hooks/useDebounce'
import { uploadToSupabase } from '../../hooks/useImageCompress'
import { useNotification } from '../../contexts/NotificationContext'
import type { Project } from '../../types/database.types'
import {
  Plus, Download, BookOpen, Target,
  Pencil, Check, X, Loader2, Trash2, AlertTriangle,
} from 'lucide-react'

export default function Dashboard() {
  const { profile, updateProfile } = useAuth()
  const { currentProject, setCurrentProject } = useProject()
  const { addLog } = useNotification()
  const qc = useQueryClient()

  const [pseudonym, setPseudonym] = useState(profile?.pseudonym || 'D. K.')
  const [editingProject, setEditingProject] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState({ title: '', subtitle: '', genre: '', target_words: 80000 })

  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentProject || !profile) return
    setUploadingCover(true)
    try {
      const path = `${profile.id}/covers/${Date.now()}.webp`
      const url = await uploadToSupabase(supabase, file, path)
      if (url) {
        await updateCover(url)
      }
    } catch (err: any) {
      alert(err.message || 'Błąd podczas wgrywania okładki')
    } finally {
      setUploadingCover(false)
    }
  }

  useEffect(() => {
    if (profile?.pseudonym) setPseudonym(profile.pseudonym)
  }, [profile?.pseudonym])

  // Pobierz projekty użytkownika
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data } = await supabase.from('projects').select('*').eq('owner_id', profile.id).order('updated_at', { ascending: false })
      return (data || []) as Project[]
    },
    enabled: !!profile?.id,
  })

  // Autozapis pseudonimu
  const savePseudonym = useDebounce(async (val: string) => {
    await updateProfile({ pseudonym: val })
  }, 1750)

  const handlePseudonymChange = (val: string) => {
    setPseudonym(val)
    savePseudonym(val)
  }

  // Nowy projekt
  const createProject = useMutation({
    mutationFn: async () => {
      console.log('[Dashboard] Rozpoczynam tworzenie projektu:', projectForm)
      if (!profile?.id) {
        throw new Error('Musisz być zalogowany, aby stworzyć projekt.')
      }
      const { data, error } = await supabase.from('projects').insert({
        owner_id: profile.id,
        title: projectForm.title || 'Nowa Książka',
        subtitle: projectForm.subtitle,
        genre: projectForm.genre,
        target_words: projectForm.target_words,
      }).select().single()
      if (error) {
        console.error('[Dashboard] Błąd bazy danych przy insert projects:', error)
        throw error
      }
      console.log('[Dashboard] Projekt wstawiony pomyślnie:', data)
      return data as Project
    },
    onSuccess: (data) => {
      addLog(`Utworzono nowy projekt: "${data.title}"`, 'info')
      qc.invalidateQueries({ queryKey: ['projects'] })
      setCurrentProject(data)
      setEditingProject(false)
      setErrorMsg(null)
      setProjectForm({ title: '', subtitle: '', genre: '', target_words: 80000 })
    },
    onError: (err: any) => {
      addLog(`Błąd tworzenia projektu: ${err.message}`, 'error')
      setErrorMsg(err.message || 'Wystąpił nieoczekiwany błąd podczas tworzenia projektu.')
    }
  })
  // Usunięcie projektu
  const deleteProject = useMutation({
    mutationFn: async () => {
      if (!currentProject) return
      addLog(`Rozpoczęto usuwanie projektu "${currentProject.title}" (ID: ${currentProject.id})`, 'warn')
      const { error } = await supabase.from('projects').delete().eq('id', currentProject.id)
      if (error) throw error
    },
    onSuccess: () => {
      addLog(`Pomyślnie usunięto projekt`, 'info')
      qc.invalidateQueries({ queryKey: ['projects'] })
      const remaining = projects.filter(p => p.id !== currentProject?.id)
      setCurrentProject(remaining.length > 0 ? remaining[0] : null)
      setShowDeleteModal(false)
      setDeleteConfirmInput('')
    },
    onError: (err: any) => {
      addLog(`Błąd usuwania projektu: ${err.message}`, 'error')
      alert('Błąd podczas usuwania projektu: ' + err.message)
    }
  })

  // Upload okładki
  const updateCover = async (url: string) => {
    if (!currentProject) return
    addLog(`Zaktualizowano okładkę dla projektu "${currentProject.title}"`, 'info')
    await supabase.from('projects').update({ cover_url: url }).eq('id', currentProject.id)
    setCurrentProject({ ...currentProject, cover_url: url })
    qc.invalidateQueries({ queryKey: ['projects'] })
  }

  // Backup projektu
  const downloadBackup = async () => {
    if (!currentProject) return
    const [chapters, chars, locs, events] = await Promise.all([
      supabase.from('chapters').select('*').eq('project_id', currentProject.id),
      supabase.from('characters').select('*').eq('project_id', currentProject.id),
      supabase.from('locations').select('*').eq('project_id', currentProject.id),
      supabase.from('timeline_events').select('*').eq('project_id', currentProject.id),
    ])
    const backup = {
      exportDate: new Date().toISOString(),
      project: currentProject,
      chapters: chapters.data,
      characters: chars.data,
      locations: locs.data,
      timeline: events.data,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.title.replace(/\s+/g, '_')}_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const proj = currentProject || projects[0]

  return (
    <div className="dashboard-container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Panel Główny</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Witaj, {profile?.display_name || profile?.pseudonym || 'Autorze'} 👋
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingProject(true)}>
          <Plus size={15} /> Nowy Projekt
        </button>
      </div>

      {/* Wybór projektu */}
      {projects.length > 1 && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {projects.map(p => (
            <button key={p.id}
              onClick={() => setCurrentProject(p)}
              className={`btn ${currentProject?.id === p.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            >
              <BookOpen size={12} /> {p.title}
            </button>
          ))}
        </div>
      )}

      {proj ? (
        <div className="dashboard-layout">
          {/* LEWA: Okładka */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
            {/* Okładka książki */}
            <div className="book-cover" style={{ position: 'relative' }}>
              {proj.cover_url && (
                <div className="book-cover-bg" style={{ backgroundImage: `url(${proj.cover_url})` }} />
              )}
              <div className="book-cover-overlay" />
              <div className="book-cover-content">
                <div className="book-cover-title-area">
                  <div className="book-cover-title">{proj.title}</div>
                  {proj.subtitle && <div className="book-cover-subtitle">{proj.subtitle}</div>}
                </div>
                {/* Pseudonim DOKŁADNIE na środku */}
                <div className="book-cover-pseudonym">
                  <div className="book-cover-pseudonym-text">{pseudonym}</div>
                </div>
              </div>

              {/* Przycisk edycji okładki (ołowek) */}
              {currentProject && (
                <>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      color: '#000',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                      transition: 'all 0.2s',
                    }}
                    title="Zmień okładkę"
                    className="cover-edit-btn"
                  >
                    {uploadingCover ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Pencil size={15} />
                    )}
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          </div>

          {/* PRAWA: Reszta dashboardu */}
          <div style={{ display: 'grid', gap: 16, width: '100%', minWidth: 0 }}>
            {/* Metadane projektu */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{proj.title}</h2>
                  {proj.subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{proj.subtitle}</p>}
                  {proj.genre && <span className="badge badge-accent" style={{ marginTop: 4 }}>{proj.genre}</span>}
                </div>
                <span className={`badge ${proj.visibility === 'private' ? 'badge-free' : 'badge-accent'}`}>
                  {proj.visibility === 'private' ? '🔒 Prywatny' : proj.visibility === 'readonly' ? '👁 Tylko odczyt' : '👥 Wspólny'}
                </span>
              </div>
              <WordProgressBar current={proj.total_words} target={proj.target_words} />
            </div>

            {/* Laboratorium Pseudonimów */}
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={14} color="var(--accent)" /> Laboratorium Pseudonimów
              </h3>
              <input
                className="input"
                value={pseudonym}
                onChange={e => handlePseudonymChange(e.target.value)}
                placeholder="Twój pseudonim..."
              />
            </div>

            {/* Cel słów */}
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} color="var(--accent)" /> Cel Projektu
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Słowa w projekcie', val: (proj.total_words ?? 0).toLocaleString('pl-PL') },
                  { label: 'Cel słów', val: (proj.target_words ?? 0).toLocaleString('pl-PL') },
                  { label: 'Pozostało', val: Math.max(0, (proj.target_words ?? 0) - (proj.total_words ?? 0)).toLocaleString('pl-PL') },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Akcje - Wyśrodkowane */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 8 }}>
              <button onClick={() => { addLog('Rozpoczęto eksport kopii zapasowej projektu (.json)', 'info'); downloadBackup(); }} className="btn btn-ghost">
                <Download size={14} /> Backup (.json)
              </button>
              <button onClick={() => { addLog('Otwarto okno potwierdzenia usunięcia projektu', 'warn'); setShowDeleteModal(true); setDeleteConfirmInput(''); }} className="btn btn-ghost" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <Trash2 size={14} /> Usuń projekt
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Brak projektów</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
            Stwórz swój pierwszy projekt i zacznij pisać!
          </p>
          <button className="btn btn-primary" onClick={() => { setErrorMsg(null); setEditingProject(true); }}>
            <Plus size={15} /> Nowy Projekt
          </button>
        </div>
      )}

      {/* Modal usuwania projektu z wpisaniem DELETE */}
      {showDeleteModal && currentProject && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Usuwanie projektu
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ta operacja jest nieodwracalna</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Czy na pewno chcesz bezpowrotnie usunąć projekt <strong>„{currentProject.title}”</strong>? Wszystkie rozdziały, postacie i dane projektu zostaną skasowane.
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Aby potwierdzić, wpisz poniżej słowo <span style={{ color: '#ef4444', fontWeight: 800 }}>DELETE</span>:
              </label>
              <input
                type="text"
                className="input"
                placeholder="Wpisz DELETE"
                value={deleteConfirmInput}
                onChange={e => setDeleteConfirmInput(e.target.value)}
                style={{
                  borderColor: deleteConfirmInput === 'DELETE' ? '#ef4444' : undefined,
                  letterSpacing: 1,
                  fontWeight: 600,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost">
                Anuluj
              </button>
              <button
                disabled={deleteConfirmInput !== 'DELETE' || deleteProject.isPending}
                onClick={() => deleteProject.mutate()}
                className="btn btn-danger"
                style={{
                  opacity: deleteConfirmInput === 'DELETE' ? 1 : 0.5,
                  cursor: deleteConfirmInput === 'DELETE' ? 'pointer' : 'not-allowed'
                }}
              >
                {deleteProject.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Usuń nieodwracalnie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nowego projektu */}
      {editingProject && (
        <div className="modal-backdrop" onClick={() => setEditingProject(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Nowy Projekt</h2>
              <button onClick={() => setEditingProject(false)} className="btn-icon btn-ghost"><X size={18} /></button>
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
              <label className="label">Tytuł książki *</label>
              <input className="input" placeholder="Tytuł Twojej książki"
                value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Podtytuł</label>
              <input className="input" placeholder="Opcjonalny podtytuł"
                value={projectForm.subtitle} onChange={e => setProjectForm(f => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Gatunek</label>
              <input className="input" placeholder="np. Fantasy, Thriller, Romans..."
                value={projectForm.genre} onChange={e => setProjectForm(f => ({ ...f, genre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Cel słów</label>
              <input className="input" type="number" placeholder="80000"
                value={projectForm.target_words}
                onChange={e => setProjectForm(f => ({ ...f, target_words: Number(e.target.value) }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setEditingProject(false)} className="btn btn-ghost">Anuluj</button>
              <button
                onClick={() => createProject.mutate()}
                className="btn btn-primary"
                disabled={createProject.isPending}
              >
                <Check size={14} /> Stwórz Projekt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
