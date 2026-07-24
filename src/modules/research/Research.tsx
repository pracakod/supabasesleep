import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { GlossaryTerm, ResearchLink, Character, CustomTag } from '../../types/database.types'
import ComboboxTag from '../../components/ui/ComboboxTag'
import ImageUploader from '../../components/ui/ImageUploader'
import { Plus, X, Search, Link2, Book, Bookmark, Trash2, Pencil, ExternalLink, Users } from 'lucide-react'

const DEFAULT_GLOSSARY_CATEGORIES = ['Magia / Zdolności', 'Przedmioty / Artefakty', 'Rasy / Frakcje', 'Historia / Wydarzenia', 'Geografia / Świat']

export default function Research() {
  const { currentProject } = useProject()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'glossary' | 'moodboard'>('glossary')
  const [searchQuery, setSearchQuery] = useState('')
  const [showTermForm, setShowTermForm] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [termForm, setTermForm] = useState<Partial<GlossaryTerm>>({})
  const [linkForm, setLinkForm] = useState<Partial<ResearchLink>>({})

  // Pobierz słownik (glossary_terms)
  const { data: terms = [] } = useQuery({
    queryKey: ['glossary_terms', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('glossary_terms')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('name')
      return (data || []) as GlossaryTerm[]
    },
    enabled: !!currentProject,
  })

  // Pobierz moodboard (research_links)
  const { data: researchLinks = [] } = useQuery({
    queryKey: ['research_links', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('research_links')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
      return (data || []) as ResearchLink[]
    },
    enabled: !!currentProject,
  })

  // Pobierz postacie
  const { data: characters = [] } = useQuery({
    queryKey: ['characters', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('name')
      return (data || []) as Character[]
    },
    enabled: !!currentProject,
  })

  // Pobierz tagi dla słownika
  const { data: categoryTags = [] } = useQuery({
    queryKey: ['tags-glossary', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('custom_tags')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('tag_type', 'glossary_category')
      return (data || []) as CustomTag[]
    },
    enabled: !!currentProject,
  })

  const glossaryCategories = Array.from(new Set([...DEFAULT_GLOSSARY_CATEGORIES, ...categoryTags.map(t => t.value)]))

  // Słownik: Mutacje
  const upsertTerm = useMutation({
    mutationFn: async () => {
      const payload = {
        ...termForm,
        project_id: currentProject!.id,
        related_character_ids: termForm.related_character_ids || [],
      }

      if (payload.id) {
        await supabase
          .from('glossary_terms')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', payload.id)
      } else {
        await supabase.from('glossary_terms').insert(payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['glossary_terms'] })
      setShowTermForm(false)
      setTermForm({})
    },
  })

  const deleteTerm = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('glossary_terms').delete().eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['glossary_terms'] })
    },
  })

  // Moodboard: Mutacje
  const upsertLink = useMutation({
    mutationFn: async () => {
      const payload = {
        ...linkForm,
        project_id: currentProject!.id,
      }

      if (payload.id) {
        await supabase
          .from('research_links')
          .update(payload)
          .eq('id', payload.id)
      } else {
        await supabase.from('research_links').insert(payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research_links'] })
      setShowLinkForm(false)
      setLinkForm({})
    },
  })

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('research_links').delete().eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research_links'] })
    },
  })

  const addCategoryTag = async (val: string) => {
    await supabase.from('custom_tags').insert({
      project_id: currentProject!.id,
      tag_type: 'glossary_category',
      value: val,
    })
    qc.invalidateQueries({ queryKey: ['tags-glossary'] })
  }

  const handleToggleTermCharacter = (charId: string) => {
    const current = termForm.related_character_ids || []
    if (current.includes(charId)) {
      setTermForm({ ...termForm, related_character_ids: current.filter(id => id !== charId) })
    } else {
      setTermForm({ ...termForm, related_character_ids: [...current, charId] })
    }
  }

  // Filtrowanie
  const filteredTerms = terms.filter(t => {
    const query = searchQuery.toLowerCase()
    return (
      t.name.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.definition.toLowerCase().includes(query)
    )
  })

  const filteredLinks = researchLinks.filter(l => {
    const query = searchQuery.toLowerCase()
    return (
      l.title.toLowerCase().includes(query) ||
      l.description.toLowerCase().includes(query) ||
      l.url.toLowerCase().includes(query)
    )
  })

  if (!currentProject) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <Search size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p>Wybierz projekt aby przejść do panelu Research & Glosariusz.</p>
    </div>
  )

  return (
    <>
      <div className="dashboard-container fade-in">
      {/* Nagłówek i Taby */}
      <div className="module-header">
        <div className="module-header-left">
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Research & Glosariusz</h1>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActiveTab('glossary'); setSearchQuery('') }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === 'glossary' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'glossary' ? '2px solid var(--accent)' : '2px solid transparent',
                paddingBottom: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Book size={14} /> Słownik Pojęć ({terms.length})
            </button>
            <button
              onClick={() => { setActiveTab('moodboard'); setSearchQuery('') }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === 'moodboard' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'moodboard' ? '2px solid var(--accent)' : '2px solid transparent',
                paddingBottom: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Bookmark size={14} /> Moodboard / Linki ({researchLinks.length})
            </button>
          </div>
        </div>

        <div className="module-header-actions">
          {/* Szukajka */}
          <div style={{ position: 'relative', width: 220 }}>
            <input
              className="input"
              style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
              placeholder={activeTab === 'glossary' ? 'Szukaj pojęć...' : 'Szukaj w moodboardzie...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-muted)' }} />
          </div>

          {activeTab === 'glossary' ? (
            <button className="btn btn-primary" onClick={() => { setTermForm({ category: '', related_character_ids: [] }); setShowTermForm(true) }}>
              <Plus size={14} /> Nowe Pojęcie
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => { setLinkForm({}); setShowLinkForm(true) }}>
              <Plus size={14} /> Nowy Link / Inspiracja
            </button>
          )}
        </div>
      </div>

      {/* ZAWARTOŚĆ TABA 1: GLOSARIUSZ */}
      {activeTab === 'glossary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredTerms.map(term => (
            <div key={term.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span className="badge badge-accent" style={{ fontSize: 10 }}>{term.category || 'Ogólne'}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon btn-ghost" style={{ padding: 4 }} onClick={() => { setTermForm(term); setShowTermForm(true) }}>
                      <Pencil size={12} />
                    </button>
                    <button className="btn-icon btn-ghost" style={{ padding: 4, color: '#ef4444' }} onClick={() => deleteTerm.mutate(term.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 8 }}>{term.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{term.definition}</p>
              </div>

              {term.related_character_ids && term.related_character_ids.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Users size={12} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {term.related_character_ids.map(charId => {
                      const char = characters.find(c => c.id === charId)
                      return char ? (
                        <span key={charId} className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: 10 }}>
                          {char.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredTerms.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Book size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
              <p>Brak haseł w słowniku. Dodaj pierwsze pojęcie!</p>
            </div>
          )}
        </div>
      )}

      {/* ZAWARTOŚĆ TABA 2: MOODBOARD */}
      {activeTab === 'moodboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredLinks.map(link => (
            <div key={link.id} className="card fade-in" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {link.image_url ? (
                <img src={link.image_url} alt={link.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: 120, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Link2 size={32} style={{ opacity: 0.3 }} />
                </div>
              )}
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{link.title}</h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon btn-ghost" style={{ padding: 4 }} onClick={() => { setLinkForm(link); setShowLinkForm(true) }}>
                        <Pencil size={12} />
                      </button>
                      <button className="btn-icon btn-ghost" style={{ padding: 4, color: '#ef4444' }} onClick={() => deleteLink.mutate(link.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {link.description && (
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {link.description}
                    </p>
                  )}
                </div>
                {link.url && (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 'auto', gap: 4 }}>
                    Otwórz link <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}

          {filteredLinks.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Bookmark size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
              <p>Brak elementów w moodboardzie. Dodaj linki, szkice lub inspiracje!</p>
            </div>
          )}
        </div>
      )}

      </div>

      {/* Modal: Formularz Pojęcia */}
      {showTermForm && (
        <div className="modal-backdrop" onClick={() => setShowTermForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {termForm.id ? 'Edytuj Pojęcie' : 'Nowe Pojęcie'}
              </h2>
              <button onClick={() => setShowTermForm(false)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="label">Nazwa pojęcia / hasła *</label>
              <input className="input" placeholder="np. Srebrny Miecz, Zakon Cienia..."
                value={termForm.name || ''}
                style={{ width: '100%' }}
                onChange={e => setTermForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <ComboboxTag
                label="Kategoria pojęcia"
                value={termForm.category || ''}
                onChange={v => setTermForm(f => ({ ...f, category: v }))}
                options={glossaryCategories}
                onAddOption={addCategoryTag}
              />
            </div>

            <div className="form-group">
              <label className="label">Definicja / Opis pojęcia</label>
              <textarea className="textarea" placeholder="Opisz co to jest, jakie ma właściwości..."
                value={termForm.definition || ''} onChange={e => setTermForm(f => ({ ...f, definition: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="label">Powiązane postacie</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                {characters.map(char => {
                  const isChecked = (termForm.related_character_ids || []).includes(char.id)
                  return (
                    <label key={char.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTermCharacter(char.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                      <span>{char.name}</span>
                    </label>
                  )
                })}
                {characters.length === 0 && (
                  <span style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--text-muted)' }}>
                    Brak utworzonych postaci w tym projekcie. Dodaj je najpierw w sekcji <b>Baza Postaci</b>.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowTermForm(false)} className="btn btn-ghost">Anuluj</button>
              <button onClick={() => upsertTerm.mutate()} className="btn btn-primary" disabled={upsertTerm.isPending}>
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Formularz Linku */}
      {showLinkForm && (
        <div className="modal-backdrop" onClick={() => setShowLinkForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {linkForm.id ? 'Edytuj Inspirację' : 'Nowy Link / Inspiracja'}
              </h2>
              <button onClick={() => setShowLinkForm(false)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>

            <div className="form-grid-avatar">
              <ImageUploader
                currentUrl={linkForm.image_url}
                folder="research"
                onUpload={url => setLinkForm(f => ({ ...f, image_url: url }))}
                aspectRatio="16/9"
                size="md"
                label="Grafika"
              />
              <div>
                <div className="form-group">
                  <label className="label">Tytuł *</label>
                  <input className="input" placeholder="Tytuł inspiracji..."
                    value={linkForm.title || ''} onChange={e => setLinkForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Adres URL</label>
                  <input className="input" placeholder="https://..."
                    value={linkForm.url || ''} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Opis / Notatki</label>
              <textarea className="textarea" placeholder="Co Cię inspiruje w tym linku?"
                value={linkForm.description || ''} onChange={e => setLinkForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowLinkForm(false)} className="btn btn-ghost">Anuluj</button>
              <button onClick={() => upsertLink.mutate()} className="btn btn-primary" disabled={upsertLink.isPending}>
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
