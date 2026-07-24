import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Character, CharacterRelation, CustomTag } from '../../types/database.types'
import ComboboxTag from '../../components/ui/ComboboxTag'
import ImageUploader from '../../components/ui/ImageUploader'
import CharacterTree from './CharacterTree'
import { Plus, X, Check, Users, GitBranch, Star, User } from 'lucide-react'
import { useNotification } from '../../contexts/NotificationContext'

const DEFAULT_FACTIONS = ['Dobro', 'Zło', 'Neutralni', 'Niezdecydowani', 'Tajemni']
const ROLE_LABELS = { main: 'Główna', secondary: 'Poboczna', minor: 'Epizodyczna' }

function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    ['#10b981', '#059669'], // emerald
    ['#3b82f6', '#2563eb'], // blue
    ['#8b5cf6', '#7c3aed'], // violet
    ['#ec4899', '#db2777'], // pink
    ['#f59e0b', '#d97706'], // amber
    ['#06b6d4', '#0891b2'], // cyan
    ['#14b8a6', '#0d9488'], // teal
    ['#6366f1', '#4f46e5'], // indigo
  ]
  const index = Math.abs(hash) % colors.length
  return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`
}

export default function Characters() {
  const { currentProject } = useProject()
  const { showToast } = useNotification()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'list' | 'tree'>('list')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Character>>({ role: 'secondary' })
  const [relationForm, setRelationForm] = useState<Partial<CharacterRelation> & { showFor?: string }>({})
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'faction' | 'newest'>('name')
  const [sourceRelationCharId, setSourceRelationCharId] = useState<string | null>(null)

  const { data: characters = [] } = useQuery({
    queryKey: ['characters', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase.from('characters').select('*').eq('project_id', currentProject.id).order('name')
      return (data || []) as Character[]
    },
    enabled: !!currentProject,
  })

  const { data: relations = [] } = useQuery({
    queryKey: ['char-relations', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase.from('character_relations').select('*').eq('project_id', currentProject.id)
      return (data || []) as CharacterRelation[]
    },
    enabled: !!currentProject,
  })

  const { data: factionTags = [] } = useQuery({
    queryKey: ['tags-faction', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase.from('custom_tags').select('*')
        .eq('project_id', currentProject.id).eq('tag_type', 'faction')
      return (data || []) as CustomTag[]
    },
    enabled: !!currentProject,
  })

  const factions = [...DEFAULT_FACTIONS, ...factionTags.map(t => t.value)]

  const upsertCharacter = useMutation({
    mutationFn: async () => {
      let newCharId = form.id
      if (form.id) {
        const { error } = await supabase.from('characters').update({ ...form, updated_at: new Date().toISOString() }).eq('id', form.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('characters').insert({ ...form, project_id: currentProject!.id }).select().single()
        if (error) throw error
        newCharId = data.id

        if (sourceRelationCharId && newCharId) {
          const { error: relError } = await supabase.from('character_relations').upsert([
            {
              project_id: currentProject!.id,
              from_character_id: sourceRelationCharId,
              to_character_id: newCharId,
              relation_type: 'znajomy',
              description: '',
            },
            {
              project_id: currentProject!.id,
              from_character_id: newCharId,
              to_character_id: sourceRelationCharId,
              relation_type: 'znajomy',
              description: '',
            }
          ])
          if (relError) throw relError
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['characters'] })
      qc.invalidateQueries({ queryKey: ['char-relations'] })
      showToast(form.id ? 'Postać zaktualizowana!' : 'Postać utworzona!', 'success')
      setShowForm(false)
      setForm({ role: 'secondary' })
      setSourceRelationCharId(null)
    },
    onError: (err: any) => {
      showToast(`Nie udało się zapisać postaci: ${err.message}`, 'error')
    }
  })

  const deleteChar = useMutation({
    mutationFn: async (id: string) => { 
      const { error } = await supabase.from('characters').delete().eq('id', id) 
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['characters'] })
      showToast('Postać została usunięta.', 'success')
    },
    onError: (err: any) => {
      showToast(`Błąd usuwania postaci: ${err.message}`, 'error')
    }
  })

  const addRelation = useMutation({
    mutationFn: async () => {
      if (!relationForm.from_character_id || !relationForm.to_character_id || !relationForm.relation_type) {
        throw new Error('Wypełnij wszystkie wymagane pola (postać i typ relacji)!')
      }
      // Dodaj relację dwukierunkową
      const { error } = await supabase.from('character_relations').upsert([
        {
          project_id: currentProject!.id,
          from_character_id: relationForm.from_character_id,
          to_character_id: relationForm.to_character_id,
          relation_type: relationForm.relation_type,
          description: relationForm.description || '',
        },
        {
          project_id: currentProject!.id,
          from_character_id: relationForm.to_character_id,
          to_character_id: relationForm.from_character_id,
          relation_type: relationForm.relation_type,
          description: relationForm.description || '',
        },
      ])
      if (error) throw error
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['char-relations'] })
      setRelationForm({}) 
      showToast('Relacja została dodana pomyślnie!', 'success')
    },
    onError: (err: any) => {
      showToast(`Nie udało się dodać relacji: ${err.message}`, 'error')
    }
  })

  const addFactionTag = async (val: string) => {
    await supabase.from('custom_tags').insert({ project_id: currentProject!.id, tag_type: 'faction', value: val })
    qc.invalidateQueries({ queryKey: ['tags-faction'] })
  }

  const handleAddCharacterAtPosition = (_x: number, _y: number, sourceId?: string) => {
    setForm({ role: 'secondary' })
    setSourceRelationCharId(sourceId || null)
    setShowForm(true)
  }

  const sortedCharacters = [...characters].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'pl')
    }
    if (sortBy === 'role') {
      const roles = { main: 1, secondary: 2, minor: 3 }
      return (roles[a.role] || 3) - (roles[b.role] || 3)
    }
    if (sortBy === 'faction') {
      return (a.faction || '').localeCompare(b.faction || '', 'pl')
    }
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    }
    return 0
  })

  if (!currentProject) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <Users size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p>Wybierz projekt aby zarządzać postaciami.</p>
    </div>
  )

  return (
    <>
      <div className="dashboard-container fade-in">
      {/* Nagłówek */}
      <div className="module-header">
        <div className="module-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Baza Postaci</h1>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 }}>
              <button onClick={() => setTab('list')}
                className={`btn btn-sm ${tab === 'list' ? 'btn-primary' : 'btn-ghost'}`} style={{ gap: 5 }}>
                <Users size={12} /> Lista
              </button>
              <button onClick={() => setTab('tree')}
                className={`btn btn-sm ${tab === 'tree' ? 'btn-primary' : 'btn-ghost'}`} style={{ gap: 5 }}>
                <GitBranch size={12} /> Drzewo
              </button>
            </div>
            {tab === 'list' && (
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="select"
                style={{ width: 'auto', height: 32, fontSize: 13, padding: '4px 28px 4px 8px', borderRadius: 8 }}
              >
                <option value="name">Sortuj: Alfabetycznie</option>
                <option value="role">Sortuj: Po roli</option>
                <option value="faction">Sortuj: Po frakcji</option>
                <option value="newest">Sortuj: Najnowsze</option>
              </select>
            )}
          </div>
        </div>
        <div className="module-header-actions">
          <button className="btn btn-primary" onClick={() => { setForm({ role: 'secondary' }); setShowForm(true) }}>
            <Plus size={14} /> Nowa Postać
          </button>
        </div>
      </div>

      {tab === 'tree' ? (
        <CharacterTree
          characters={characters}
          relations={relations}
          onAddCharacterAtPosition={handleAddCharacterAtPosition}
          onAddRelation={async (fromId, toId, type) => {
            await supabase.from('character_relations').upsert([
              { project_id: currentProject!.id, from_character_id: fromId, to_character_id: toId, relation_type: type, description: '' },
              { project_id: currentProject!.id, from_character_id: toId, to_character_id: fromId, relation_type: type, description: '' }
            ])
            qc.invalidateQueries({ queryKey: ['char-relations'] })
            showToast('Połączono postacie w drzewie!', 'success')
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {sortedCharacters.map(char => (
            <div key={char.id} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {char.avatar_url ? (
                  <img src={char.avatar_url} alt={char.name} loading="lazy"
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: getAvatarGradient(char.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700, color: '#fff',
                  }}>
                    {char.name[0]}
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    {char.role === 'main' && <Star size={11} color="#f59e0b" fill="#f59e0b" />}
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {char.name}
                    </span>
                  </div>
                  {char.nickname && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>„{char.nickname}"</div>}
                  <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                    <span className="badge badge-free" style={{ fontSize: 10 }}>{ROLE_LABELS[char.role]}</span>
                    {char.faction && <span className="badge badge-accent" style={{ fontSize: 10 }}>{char.faction}</span>}
                    {char.birth_year && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ur. {char.birth_year}</span>}
                  </div>
                </div>
              </div>

              {char.psychology && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {char.psychology}
                </p>
              )}

              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setForm(char); setShowForm(true) }}>Edytuj</button>
                <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }}
                  onClick={() => deleteChar.mutate(char.id)}><X size={12} /></button>
              </div>
            </div>
          ))}

          {sortedCharacters.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <User size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
              <p>Brak postaci. Stwórz pierwszego bohatera!</p>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Modal formularza postaci */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 680,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {/* Sticky Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {form.id ? 'Edytuj Postać' : 'Nowa Postać'}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>

            {/* Scrollable Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
            }}>
              <div className="form-grid-avatar">
                <ImageUploader currentUrl={form.avatar_url} folder="avatars"
                  onUpload={url => setForm(f => ({ ...f, avatar_url: url }))}
                  size="md" label="Awatar" />
                <div>
                  <div className="form-group">
                    <label className="label">Imię *</label>
                    <input className="input" placeholder="Imię postaci"
                      value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="label">Pseudonim / Przydomek</label>
                    <input className="input" placeholder="Przydomek, ksywka..."
                      value={form.nickname || ''} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="form-grid-three">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Rola</label>
                  <select className="select" value={form.role || 'secondary'}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as Character['role'] }))}>
                    <option value="main">Główna</option>
                    <option value="secondary">Poboczna</option>
                    <option value="minor">Epizodyczna</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Rok urodzenia</label>
                  <input className="input" type="number" placeholder="np. 1985 lub -500"
                    value={form.birth_year || ''} onChange={e => setForm(f => ({ ...f, birth_year: Number(e.target.value) }))} />
                </div>
                <ComboboxTag label="Frakcja" value={form.faction || ''}
                  onChange={v => setForm(f => ({ ...f, faction: v }))}
                  options={factions} onAddOption={addFactionTag} />
              </div>

              {[
                { key: 'appearance', label: 'Wygląd' },
                { key: 'psychology', label: 'Psychologia' },
                { key: 'motivations', label: 'Motywacje' },
                { key: 'secrets', label: 'Sekrety' },
              ].map(field => (
                <div key={field.key} className="form-group">
                  <label className="label">{field.label}</label>
                  <textarea className="textarea" style={{ minHeight: 70 }} placeholder={`${field.label} postaci...`}
                    value={(form as Record<string, unknown>)[field.key] as string || ''}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
                </div>
              ))}

              {/* Relacje */}
              {form.id && characters.length > 1 && (
                <div style={{ marginTop: 8, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Dodaj relację z inną postacią
                  </h4>
                  <div className="form-grid-two">
                    <div>
                      <label className="label">Z postacią</label>
                      <select className="select"
                        value={relationForm.to_character_id || ''}
                        onChange={e => setRelationForm(r => ({ ...r, from_character_id: form.id, to_character_id: e.target.value }))}>
                        <option value="">Wybierz...</option>
                        {characters.filter(c => c.id !== form.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Typ relacji</label>
                      <input className="input" placeholder="np. brat, mentor, rywal..."
                        value={relationForm.relation_type || ''}
                        onChange={e => setRelationForm(r => ({ ...r, relation_type: e.target.value }))} />
                    </div>
                  </div>
                  <button onClick={() => addRelation.mutate()} className="btn btn-ghost btn-sm">
                    <Plus size={12} /> Dodaj relację (dwukierunkową)
                  </button>

                  {/* Lista istniejących relacji */}
                  {relations.filter(r => r.from_character_id === form.id).map(rel => (
                    <div key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent)' }}>{rel.relation_type}</span>
                      <span>→</span>
                      <span>{characters.find(c => c.id === rel.to_character_id)?.name || 'Nieznana'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Anuluj</button>
              <button onClick={() => upsertCharacter.mutate()} className="btn btn-primary" disabled={upsertCharacter.isPending}>
                <Check size={14} /> Zapisz Postać
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
