import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TimelineEvent, Character, Location, CustomTag } from '../../types/database.types'
import ComboboxTag from '../../components/ui/ComboboxTag'
import { Plus, Clock, X, Pencil, Trash2, Calendar, MapPin, Users } from 'lucide-react'

const DEFAULT_PLOTLINES = ['Główny Wątek', 'Wątek Miłosny', 'Intryga', 'Prolog/Epilog']
const PLOTLINE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

export default function Timeline() {
  const { currentProject } = useProject()
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<TimelineEvent>>({})
  const [sortBy, setSortBy] = useState<'reader' | 'world'>('reader')

  // Pobierz wydarzenia
  const { data: events = [] } = useQuery({
    queryKey: ['timeline_events', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', currentProject.id)
      return (data || []) as TimelineEvent[]
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

  // Pobierz lokacje
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('name')
      return (data || []) as Location[]
    },
    enabled: !!currentProject,
  })

  // Pobierz tagi dla wątków (plotline)
  const { data: plotlineTags = [] } = useQuery({
    queryKey: ['tags-plotline', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('custom_tags')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('tag_type', 'plotline')
      return (data || []) as CustomTag[]
    },
    enabled: !!currentProject,
  })

  const plotlines = Array.from(new Set([...DEFAULT_PLOTLINES, ...plotlineTags.map(t => t.value)]))

  // Mutacje
  const upsertEvent = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        project_id: currentProject!.id,
        character_ids: form.character_ids || [],
        plotline_color: form.plotline_color || '#6366f1',
        reader_order: Number(form.reader_order || 0),
        world_year: Number(form.world_year || 0),
      }

      if (payload.id) {
        await supabase
          .from('timeline_events')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', payload.id)
      } else {
        await supabase.from('timeline_events').insert(payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeline_events'] })
      setShowForm(false)
      setForm({})
    },
  })

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('timeline_events').delete().eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeline_events'] })

    },
  })

  const addPlotlineTag = async (val: string) => {
    await supabase.from('custom_tags').insert({
      project_id: currentProject!.id,
      tag_type: 'plotline',
      value: val,
      color: '#6366f1',
    })
    qc.invalidateQueries({ queryKey: ['tags-plotline'] })
  }

  // Sortowanie wydarzeń
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === 'reader') {
      return (a.reader_order || 0) - (b.reader_order || 0)
    } else {
      return (a.world_year || 0) - (b.world_year || 0)
    }
  })

  const handleToggleCharacter = (charId: string) => {
    const current = form.character_ids || []
    if (current.includes(charId)) {
      setForm({ ...form, character_ids: current.filter(id => id !== charId) })
    } else {
      setForm({ ...form, character_ids: [...current, charId] })
    }
  }

  if (!currentProject) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <Clock size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p>Wybierz projekt aby wyświetlić oś czasu.</p>
    </div>
  )

  return (
    <>
      <div className="dashboard-container fade-in" style={{ position: 'relative' }}>
      <div className="module-header">
        <div className="module-header-left">
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Oś Czasu</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Zarządzaj chronologią i wątkami swojej powieści</p>
        </div>
        <div className="module-header-actions" style={{ flexWrap: 'wrap' }}>
          <div className="card-sm" style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setSortBy('reader')}
              className="btn btn-sm"
              style={{
                background: sortBy === 'reader' ? 'var(--bg-card)' : 'transparent',
                color: sortBy === 'reader' ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: sortBy === 'reader' ? 'var(--shadow)' : 'none'
              }}
            >
              Kolejność Czytelnika
            </button>
            <button
              onClick={() => setSortBy('world')}
              className="btn btn-sm"
              style={{
                background: sortBy === 'world' ? 'var(--bg-card)' : 'transparent',
                color: sortBy === 'world' ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: sortBy === 'world' ? 'var(--shadow)' : 'none'
              }}
            >
              Czas w Świecie
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ timeline_type: 'present', plotline_color: '#6366f1', character_ids: [] }); setShowForm(true) }}>
            <Plus size={14} /> Nowe Wydarzenie
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 40, marginTop: 10 }}>
        {/* Pionowa linia osi czasu */}
        <div className="timeline-line" />

        {sortedEvents.map((event, idx) => {
          const loc = locations.find(l => l.id === event.location_id)
          const typeLabel = {
            present: 'Teraźniejszość',
            flashback: 'Retrospekcja',
            time_travel: 'Podróż w czasie',
            alternate: 'Alternatywna linia'
          }[event.timeline_type] || event.timeline_type

          return (
            <div key={event.id} className="slide-in" style={{ marginBottom: 32, position: 'relative', animationDelay: `${idx * 0.05}s` }}>
              {/* Kropka na osi czasu */}
              <div
                className="timeline-dot"
                style={{
                  position: 'absolute',
                  left: -29,
                  top: 8,
                  background: event.plotline_color || 'var(--accent)',
                  borderColor: 'var(--bg-primary)',
                  boxShadow: `0 0 8px ${event.plotline_color || 'var(--accent)'}`
                }}
              />

              <div
                className="card"
                style={{
                  borderLeft: `4px solid ${event.plotline_color || 'var(--accent)'}`,
                  padding: '16px 20px',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 11, border: '1px solid var(--border)' }}>
                        <Calendar size={11} style={{ marginRight: 4 }} />
                        {sortBy === 'world' ? `Rok w świecie: ${event.world_year}` : `Kolejność czyt.: ${event.reader_order}`}
                      </span>
                      {sortBy === 'world' && (
                        <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 11 }}>
                          Kolejność czytelnika: {event.reader_order}
                        </span>
                      )}
                      {sortBy === 'reader' && (
                        <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 11 }}>
                          Rok w świecie: {event.world_year}
                        </span>
                      )}
                      <span className="badge badge-accent" style={{ fontSize: 10 }}>{typeLabel}</span>
                      {event.plotline && (
                        <span className="badge" style={{ background: `${event.plotline_color}20`, color: event.plotline_color, fontSize: 10, border: `1px solid ${event.plotline_color}40` }}>
                          {event.plotline}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{event.title}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-icon btn-ghost"
                      style={{ padding: 6 }}
                      onClick={() => { setForm(event); setShowForm(true) }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="btn-icon btn-ghost"
                      style={{ padding: 6, color: '#ef4444' }}
                      onClick={() => deleteEvent.mutate(event.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {event.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {event.description}
                  </p>
                )}

                {/* Powiązane postacie i lokacja */}
                <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  {loc && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                      <MapPin size={13} />
                      <span>{loc.name}</span>
                    </div>
                  )}

                  {event.character_ids && event.character_ids.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Users size={13} style={{ color: 'var(--text-muted)' }} />
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {event.character_ids.map(charId => {
                          const char = characters.find(c => c.id === charId)
                          if (!char) return null
                          
                          // Oblicz wiek postaci
                          let ageStr = ''
                          if (char.birth_year !== null && char.birth_year !== undefined) {
                            const age = event.world_year - char.birth_year
                            ageStr = age >= 0 ? ` (${age} l.)` : ` (jeszcze nie żyje, ur. ${char.birth_year})`
                          }

                          return (
                            <span key={charId} className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 11 }}>
                              {char.name}{ageStr}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {sortedEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p>Brak wydarzeń na osi czasu. Kliknij "Nowe Wydarzenie", aby dodać pierwsze zdarzenie.</p>
          </div>
        )}
      </div>

      </div>

      {/* Modal formularza */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {form.id ? 'Edytuj Wydarzenie' : 'Nowe Wydarzenie'}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>

            <div className="form-grid-two">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Tytuł wydarzenia *</label>
                <input className="input" placeholder="np. Bitwa o Czarny Las, Narodziny bohatera..."
                  value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="label">Rok w świecie (np. -44, 1056)</label>
                <input className="input" type="number" placeholder="Rok wydarzenia"
                  value={form.world_year === undefined ? '' : form.world_year}
                  onChange={e => setForm(f => ({ ...f, world_year: e.target.value === '' ? undefined : Number(e.target.value) }))} />
              </div>

              <div className="form-group">
                <label className="label">Kolejność czytelnika (sortowanie)</label>
                <input className="input" type="number" placeholder="np. 1, 2, 3"
                  value={form.reader_order === undefined ? '' : form.reader_order}
                  onChange={e => setForm(f => ({ ...f, reader_order: e.target.value === '' ? undefined : Number(e.target.value) }))} />
              </div>

              <div className="form-group">
                <label className="label">Rodzaj czasu</label>
                <select className="select" value={form.timeline_type || 'present'}
                  onChange={e => setForm(f => ({ ...f, timeline_type: e.target.value as any }))}>
                  <option value="present">Teraźniejszość</option>
                  <option value="flashback">Retrospekcja (Flashback)</option>
                  <option value="time_travel">Podróż w czasie</option>
                  <option value="alternate">Alternatywna linia czasowa</option>
                </select>
              </div>

              <div className="form-group">
                <ComboboxTag
                  label="Wątek fabularny (Plotline)"
                  value={form.plotline || ''}
                  onChange={v => setForm(f => ({ ...f, plotline: v }))}
                  options={plotlines}
                  onAddOption={addPlotlineTag}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Kolor wątku</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.plotline_color || '#6366f1'}
                    onChange={e => setForm(f => ({ ...f, plotline_color: e.target.value }))}
                    style={{ width: 42, height: 42, border: 'none', padding: 0, background: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    {PLOTLINE_COLORS.map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, plotline_color: col }))}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: col,
                          border: form.plotline_color === col ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Lokacja</label>
                <select className="select" value={form.location_id || ''}
                  onChange={e => setForm(f => ({ ...f, location_id: e.target.value || null }))}>
                  <option value="">-- Brak lokacji --</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Występujące postacie</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {characters.map(char => {
                    const isChecked = (form.character_ids || []).includes(char.id)
                    return (
                      <label key={char.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCharacter(char.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                        />
                        <span>{char.name}</span>
                      </label>
                    )
                  })}
                  {characters.length === 0 && (
                    <span style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--text-muted)' }}>Brak utworzonych postaci w tym projekcie.</span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Opis wydarzenia</label>
                <textarea className="textarea" placeholder="Opisz co się wydarzyło, jakie były konsekwencje..."
                  value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Anuluj</button>
              <button onClick={() => upsertEvent.mutate()} className="btn btn-primary" disabled={upsertEvent.isPending}>
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
