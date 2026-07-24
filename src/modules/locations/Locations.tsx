import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Location, CustomTag } from '../../types/database.types'
import ComboboxTag from '../../components/ui/ComboboxTag'
import ImageUploader from '../../components/ui/ImageUploader'
import { Plus, MapPin, X, Pencil, Check } from 'lucide-react'

const DEFAULT_LOCATION_TYPES = ['Miasto', 'Wioska', 'Zamek', 'Las', 'Góry', 'Morze', 'Podziemia', 'Taverna', 'Pałac', 'Ruiny']

export default function Locations() {
  const { currentProject } = useProject()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Location>>({})

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase.from('locations').select('*').eq('project_id', currentProject.id).order('name')
      return (data || []) as Location[]
    },
    enabled: !!currentProject,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags-location', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase.from('custom_tags').select('*')
        .eq('project_id', currentProject.id).eq('tag_type', 'location_type')
      return (data || []) as CustomTag[]
    },
    enabled: !!currentProject,
  })

  const locationTypes = [...DEFAULT_LOCATION_TYPES, ...tags.map(t => t.value)]

  const upsertLocation = useMutation({
    mutationFn: async () => {
      if (form.id) {
        await supabase.from('locations').update({ ...form, updated_at: new Date().toISOString() }).eq('id', form.id)
      } else {
        await supabase.from('locations').insert({ ...form, project_id: currentProject!.id })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); setShowForm(false); setForm({}) },
  })

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('locations').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }) },
  })

  const addTag = async (val: string) => {
    await supabase.from('custom_tags').insert({ project_id: currentProject!.id, tag_type: 'location_type', value: val })
    qc.invalidateQueries({ queryKey: ['tags-location'] })
  }

  if (!currentProject) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <MapPin size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p>Wybierz projekt aby zarządzać lokacjami.</p>
    </div>
  )

  return (
    <>
      <div className="dashboard-container fade-in">
      <div className="module-header">
        <div className="module-header-left">
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Baza Miejsc</h1>
        </div>
        <div className="module-header-actions">
          <button className="btn btn-primary" onClick={() => { setForm({}); setShowForm(true) }}>
            <Plus size={14} /> Nowa Lokacja
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {locations.map(loc => (
          <div key={loc.id} className="card" style={{ transition: 'transform 0.15s', position: 'relative' }}>
            {loc.image_url && (
              <img src={loc.image_url} alt={loc.name} loading="lazy"
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>{loc.name}</h3>
                {loc.location_type && <span className="badge badge-accent" style={{ fontSize: 10 }}>{loc.location_type}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon btn-ghost" style={{ padding: 5 }}
                  onClick={e => { e.stopPropagation(); setForm(loc); setShowForm(true) }}>
                  <Pencil size={13} />
                </button>
                <button className="btn-icon btn-ghost" style={{ padding: 5, color: '#ef4444' }}
                  onClick={e => { e.stopPropagation(); deleteLocation.mutate(loc.id) }}>
                  <X size={13} />
                </button>
              </div>
            </div>
            {loc.description && (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {loc.description}
              </p>
            )}
          </div>
        ))}

        {locations.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <MapPin size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p>Brak lokacji. Dodaj pierwsze miejsce akcji!</p>
          </div>
        )}
      </div>
      </div>

      {/* Modal formularza */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {form.id ? 'Edytuj Lokację' : 'Nowa Lokacja'}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>

            <div className="form-grid-avatar">
              <ImageUploader currentUrl={form.image_url} folder="locations"
                onUpload={url => setForm(f => ({ ...f, image_url: url }))}
                aspectRatio="4/3" size="md" label="Grafika" />
              <div>
                <div className="form-group">
                  <label className="label">Nazwa *</label>
                  <input className="input" placeholder="Nazwa miejsca"
                    value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <ComboboxTag label="Typ lokacji" value={form.location_type || ''}
                  onChange={v => setForm(f => ({ ...f, location_type: v }))}
                  options={locationTypes} onAddOption={addTag} />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Opis</label>
              <textarea className="textarea" placeholder="Opis miejsca..."
                value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Znaczenie fabularne</label>
              <textarea className="textarea" style={{ minHeight: 70 }} placeholder="Jak to miejsce wpływa na fabułę?"
                value={form.story_significance || ''} onChange={e => setForm(f => ({ ...f, story_significance: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Anuluj</button>
              <button onClick={() => upsertLocation.mutate()} className="btn btn-primary" disabled={upsertLocation.isPending}>
                <Check size={14} /> Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
