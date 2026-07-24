import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { KanbanCard, Chapter } from '../../types/database.types'
import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  useDroppable
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, Pencil, Trash2, BookOpen } from 'lucide-react'

const PRESET_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

// DRAGGABLE CARD COMPONENT
interface CardProps {
  card: KanbanCard
  onEdit: () => void
  onDelete: () => void
}

function SortableCard({ card, onEdit, onDelete }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderLeft: `4px solid ${card.color || '#6366f1'}`,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    cursor: 'grab',
    position: 'relative' as const,
    boxShadow: isDragging ? '0 8px 30px rgba(0,0,0,0.5)' : 'var(--shadow)',
    zIndex: isDragging ? 100 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-card-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.4 }}>
          {card.title || 'Bez tytułu'}
        </h4>
        <div style={{ display: 'flex', gap: 2, pointerEvents: 'auto' }} onPointerDown={e => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="btn-icon btn-ghost"
            style={{ padding: 4, borderRadius: 4 }}
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="btn-icon btn-ghost"
            style={{ padding: 4, borderRadius: 4, color: '#ef4444' }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      {card.description && (
        <p style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          marginTop: 6,
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {card.description}
        </p>
      )}
    </div>
  )
}

// DROPPABLE COLUMN COMPONENT
interface ColumnProps {
  id: string
  title: string
  cards: KanbanCard[]
  onAddCard: () => void
  onEditCard: (card: KanbanCard) => void
  onDeleteCard: (id: string) => void
}

function KanbanColumn({ id, title, cards, onAddCard, onEditCard, onDeleteCard }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        width: 280,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 160px)',
        maxHeight: 700,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
          <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 10, padding: '2px 6px' }}>
            {cards.length}
          </span>
        </div>
        <button
          onClick={onAddCard}
          className="btn-icon btn-ghost"
          style={{ padding: 4, borderRadius: 4 }}
        >
          <Plus size={14} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <SortableCard
              key={card.id}
              card={card}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 11.5,
            border: '1px dashed var(--border)',
            borderRadius: 8,
            minHeight: 80,
            padding: 12,
            textAlign: 'center'
          }}>
            Przeciągnij sceny tutaj lub dodaj nową
          </div>
        )}
      </div>
    </div>
  )
}

// MAIN KANBAN MODULE
export default function Kanban() {
  const { currentProject } = useProject()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<KanbanCard>>({})
  const [activeColumnId, setActiveColumnId] = useState<string>('unassigned')

  // Sensors for DnD
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  // Query chapters
  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('position')
      return (data || []) as Chapter[]
    },
    enabled: !!currentProject,
  })

  // Query kanban cards
  const { data: cards = [] } = useQuery({
    queryKey: ['kanban_cards', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('position')
      return (data || []) as KanbanCard[]
    },
    enabled: !!currentProject,
  })

  // Mutations
  const upsertCard = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        project_id: currentProject!.id,
        chapter_id: form.chapter_id || null,
        color: form.color || '#6366f1',
        position: form.position === undefined ? cards.length : form.position
      }

      if (payload.id) {
        await supabase
          .from('kanban_cards')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', payload.id)
      } else {
        await supabase.from('kanban_cards').insert(payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban_cards'] })
      setShowForm(false)
      setForm({})
    },
  })

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('kanban_cards').delete().eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban_cards'] })
    },
  })

  const updateCardPosition = useMutation({
    mutationFn: async ({ id, chapterId, position }: { id: string; chapterId: string | null; position: number }) => {
      await supabase
        .from('kanban_cards')
        .update({ chapter_id: chapterId, position, updated_at: new Date().toISOString() })
        .eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban_cards'] })
    },
  })

  // Handle Drag End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const cardId = active.id as string
    const overId = over.id as string // Can be a column ID or a card ID

    // Find the active card
    const activeCard = cards.find(c => c.id === cardId)
    if (!activeCard) return

    // Determine target column and target position
    let targetChapterId: string | null = null
    let targetPosition = 0

    // Is the over element a column?
    const isColumn = overId === 'unassigned' || chapters.some(ch => ch.id === overId)

    if (isColumn) {
      targetChapterId = overId === 'unassigned' ? null : overId
      // Append to the end of the column
      const columnCards = cards.filter(c => c.chapter_id === targetChapterId)
      targetPosition = columnCards.length > 0 ? Math.max(...columnCards.map(c => c.position)) + 1 : 0
    } else {
      // Over element is another card
      const overCard = cards.find(c => c.id === overId)
      if (!overCard) return
      targetChapterId = overCard.chapter_id
      targetPosition = overCard.position
    }

    // Only update if something changed
    if (activeCard.chapter_id !== targetChapterId || activeCard.position !== targetPosition) {
      // Optimistic update locally
      qc.setQueryData(['kanban_cards', currentProject?.id], (old: KanbanCard[] | undefined) => {
        if (!old) return []
        return old.map(c => {
          if (c.id === cardId) {
            return { ...c, chapter_id: targetChapterId, position: targetPosition }
          }
          return c
        })
      })

      // Sync with DB
      updateCardPosition.mutate({ id: cardId, chapterId: targetChapterId, position: targetPosition })
    }
  }

  if (!currentProject) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <BookOpen size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p>Wybierz projekt aby zarządzać tablicą korkową.</p>
    </div>
  )

  // Group cards by columns
  const unassignedCards = cards.filter(c => c.chapter_id === null).sort((a, b) => a.position - b.position)
  const columnsData = [
    { id: 'unassigned', title: 'Pomysły / Luźne Sceny', cards: unassignedCards },
    ...chapters.map(ch => ({
      id: ch.id,
      title: ch.title || `Rozdział ${ch.position}`,
      cards: cards.filter(c => c.chapter_id === ch.id).sort((a, b) => a.position - b.position)
    }))
  ]

  return (
    <>
      <div className="dashboard-container fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="module-header">
        <div className="module-header-left">
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Tablica Korkowa (Kanban)</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Przeciągaj sceny i wydarzenia między rozdziałami</p>
        </div>
        <div className="module-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setForm({ color: '#6366f1', chapter_id: null })
              setShowForm(true)
            }}
          >
            <Plus size={14} /> Nowa Karta
          </button>
        </div>
      </div>

      {/* Selector kolumny na mobile */}
      <div className="kanban-mobile-selector" style={{ marginBottom: 16, display: 'none' }}>
        <label className="label">Wybierz kolumnę tablicy</label>
        <select
          className="select"
          value={activeColumnId}
          onChange={e => setActiveColumnId(e.target.value)}
        >
          {columnsData.map(col => (
            <option key={col.id} value={col.id}>
              {col.title} ({col.cards.length})
            </option>
          ))}
        </select>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="kanban-board-container"
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 20,
            flex: 1,
            alignItems: 'flex-start'
          }}
        >
          {columnsData.map(col => {
            const isColumnActive = col.id === activeColumnId
            return (
              <div
                key={col.id}
                className={`kanban-column-wrapper ${isColumnActive ? 'active' : ''}`}
              >
                <KanbanColumn
                  id={col.id}
                  title={col.title}
                  cards={col.cards}
                  onAddCard={() => {
                    setForm({ color: '#6366f1', chapter_id: col.id === 'unassigned' ? null : col.id })
                    setShowForm(true)
                  }}
                  onEditCard={card => {
                    setForm(card)
                    setShowForm(true)
                  }}
                  onDeleteCard={id => deleteCard.mutate(id)}
                />
              </div>
            )
          })}
        </div>
      </DndContext>

      </div>

      {/* Modal formularza */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {form.id ? 'Edytuj Kartę' : 'Nowa Karta'}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="label">Tytuł karty / sceny *</label>
              <input
                className="input"
                placeholder="np. Kradzież talizmanu, Spotkanie w karczmie..."
                value={form.title || ''}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="label">Rozdział docelowy</label>
              <select
                className="select"
                value={form.chapter_id || ''}
                onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value || null }))}
              >
                <option value="">-- Pomysły / Luźne Sceny --</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Kolor karty</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.color || '#6366f1'}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: 36, height: 36, border: 'none', padding: 0, background: 'none', cursor: 'pointer', borderRadius: 4 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  {PRESET_COLORS.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: col }))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: col,
                        border: form.color === col ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Opis / Notatki do sceny</label>
              <textarea
                className="textarea"
                placeholder="Opisz co dzieje się w tej scenie, jacy bohaterowie biorą w niej udział..."
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Anuluj</button>
              <button
                onClick={() => upsertCard.mutate()}
                className="btn btn-primary"
                disabled={upsertCard.isPending}
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
