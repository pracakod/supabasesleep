import { useState, useEffect, useRef } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '../../hooks/useDebounce'
import type { Chapter } from '../../types/database.types'
import {
  Plus, Trash2, Download, FileText, GripVertical,
  Hash, AlignJustify, ChevronRight, ChevronLeft,
} from 'lucide-react'

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function smartDashes(text: string): string {
  return text
    .replace(/ - /g, ' – ')
    .replace(/^- /gm, '— ')
    .replace(/\n- /g, '\n— ')
}

export default function Editor() {
  const { currentProject } = useProject()
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('sk-editor-font-size')
    return saved ? Number(saved) : 15
  })
  const [fontFamily, setFontFamily] = useState<string>(() => {
    const saved = localStorage.getItem('sk-editor-font-family')
    return saved || 'Merriweather, serif'
  })

  const [saved, setSaved] = useState(true)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    localStorage.setItem('sk-editor-font-size', fontSize.toString())
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('sk-editor-font-family', fontFamily)
  }, [fontFamily])

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return []
      const { data } = await supabase
        .from('chapters').select('*')
        .eq('project_id', currentProject.id)
        .order('position')
      return (data || []) as Chapter[]
    },
    enabled: !!currentProject,
  })

  const selected = chapters.find(c => c.id === selectedId)

  useEffect(() => {
    if (selected) {
      setContent(selected.content)
      setTitle(selected.title)
      setWordCount(countWords(selected.content))
      setCharCount(selected.content.length)
      setSaved(true)
    }
  }, [selected?.id])

  const saveChapter = useDebounce(async (id: string, newContent: string, newTitle: string) => {
    const wc = countWords(newContent)
    await supabase.from('chapters').update({
      content: newContent,
      title: newTitle,
      word_count: wc,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['chapters', currentProject?.id] })
    setSaved(true)
  }, 1750)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = smartDashes(e.target.value)
    setContent(val)
    setWordCount(countWords(val))
    setCharCount(val.length)
    setSaved(false)
    if (selectedId) saveChapter(selectedId, val, title)
  }

  const handleTitleChange = (val: string) => {
    setTitle(val)
    setSaved(false)
    if (selectedId) saveChapter(selectedId, content, val)
  }

  const addChapter = useMutation({
    mutationFn: async () => {
      const pos = chapters.length
      const { data } = await supabase.from('chapters').insert({
        project_id: currentProject!.id,
        title: `Rozdział ${pos + 1}`,
        content: '',
        position: pos,
      }).select().single()
      return data as Chapter
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['chapters', currentProject?.id] })
      setSelectedId(data.id)
    },
  })

  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('chapters').delete().eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chapters', currentProject?.id] })
      setSelectedId(null)
    },
  })

  const exportManuscript = () => {
    const projectTitle = currentProject?.title || 'Manuskrypt'
    const pseudonym = 'D. K.'
    let html = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8">
<title>${projectTitle}</title>
<style>
body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.8; margin: 60pt 80pt; color: #000; }
h1 { text-align: center; font-size: 28pt; margin-top: 100pt; }
h2 { text-align: center; font-size: 14pt; margin-top: 8pt; color: #555; }
.author { text-align: center; font-size: 16pt; margin-top: 40pt; letter-spacing: 3pt; }
.chapter-title { font-size: 16pt; font-weight: bold; margin-top: 48pt; margin-bottom: 24pt; text-align: center; }
p { text-indent: 1.5em; margin: 0; }
.page-break { page-break-after: always; }
</style></head><body>
<h1>${projectTitle}</h1>
<h2>${currentProject?.subtitle || ''}</h2>
<div class="author">${pseudonym}</div>
<div class="page-break"></div>`

    chapters.forEach(ch => {
      html += `<div class="chapter-title">${ch.title}</div>`
      const paragraphs = ch.content.split(/\n+/).filter(Boolean)
      paragraphs.forEach(p => { html += `<p>${p}</p>` })
      html += `<div class="page-break"></div>`
    })

    html += `</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectTitle}_manuskrypt.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!currentProject) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <FileText size={48} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text-muted)' }} />
        <p>Wybierz projekt w Panelu Głównym, aby edytować rozdziały.</p>
      </div>
    )
  }

  return (
    <div className={`editor-layout ${selectedId ? 'has-selected' : ''}`}>
      {/* Lista rozdziałów */}
      <div className="editor-sidebar">
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Rozdziały ({chapters.length})
          </span>
          <button onClick={() => addChapter.mutate()} className="btn-icon btn-ghost" title="Nowy rozdział" style={{ padding: 5 }}>
            <Plus size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {chapters.map((ch) => (
            <div
              key={ch.id}
              onClick={() => setSelectedId(ch.id)}
              style={{
                padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                background: selectedId === ch.id ? 'var(--accent-glow)' : 'transparent',
                border: selectedId === ch.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                marginBottom: 2, transition: 'all 0.1s',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}
            >
              <GripVertical size={12} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: selectedId === ch.id ? 'var(--accent)' : 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ch.title}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                  {ch.word_count} słów
                </div>
              </div>
            </div>
          ))}

          {chapters.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
              Brak rozdziałów.<br />Kliknij + aby dodać.
            </div>
          )}
        </div>

        <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
          <button onClick={exportManuscript} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            <Download size={13} /> Eksportuj manuskrypt
          </button>
        </div>
      </div>

      {/* Obszar edytora */}
      <div className="editor-content">
        {selected ? (
          <>
            {/* Pasek tytułu */}
            <div style={{
              padding: '10px 24px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {/* Przycisk wstecz na mobile */}
              <button
                onClick={() => setSelectedId(null)}
                className="btn-icon btn-ghost mobile-only-back-btn"
                style={{ padding: 6, display: 'none', alignItems: 'center', justifyContent: 'center' }}
                title="Powrót do rozdziałów"
              >
                <ChevronLeft size={16} />
              </button>

              <input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                  flex: 1, fontFamily: 'Inter, sans-serif', minWidth: 0,
                }}
                placeholder="Tytuł rozdziału..."
              />
              <div className="editor-stats-container" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {/* Rozmiar czcionki */}
                <select
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="select"
                  style={{ width: 'auto', height: 26, fontSize: 11, padding: '2px 20px 2px 6px', borderRadius: 6 }}
                  title="Rozmiar czcionki"
                >
                  <option value={13}>Mała (13px)</option>
                  <option value={15}>Domyślna (15px)</option>
                  <option value={17}>Duża (17px)</option>
                  <option value={20}>Bardzo duża (20px)</option>
                </select>

                {/* Krój czcionki */}
                <select
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value)}
                  className="select"
                  style={{ width: 'auto', height: 26, fontSize: 11, padding: '2px 20px 2px 6px', borderRadius: 6 }}
                  title="Krój czcionki"
                >
                  <option value="Merriweather, serif">Szeryfowa (Książkowa)</option>
                  <option value="Inter, sans-serif">Bezszeryfowa (Nowoczesna)</option>
                  <option value="Courier New, monospace">Maszynopis (Monospace)</option>
                </select>

                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <Hash size={11} /> {wordCount}<span className="editor-stats-text"> słów</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <AlignJustify size={11} /> {charCount}<span className="editor-stats-text"> znaków</span>
                </span>
                <span style={{ fontSize: 10, color: saved ? '#22c55e' : '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                  <span>{saved ? '✓' : '●'}</span><span className="editor-stats-text">{saved ? 'Zapisano' : 'Zapisywanie...'}</span>
                </span>
                <button
                  onClick={() => deleteChapter.mutate(selected.id)}
                  className="btn-icon btn-ghost"
                  title="Usuń rozdział"
                  style={{ color: '#ef4444', padding: 6 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Edytor */}
            <div style={{ flex: 1, overflow: 'auto', background: 'var(--editor-bg)', padding: '20px 10px' }}>
              <textarea
                ref={editorRef}
                className="manuscript-editor"
                value={content}
                onChange={handleContentChange}
                placeholder="Zacznij pisać... Hypheny ( - ) będą automatycznie zamieniane na półpauzy."
                style={{
                  display: 'block',
                  minHeight: '100%',
                  resize: 'none',
                  border: 'none',
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily,
                }}
              />
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12, color: 'var(--text-muted)',
          }}>
            <ChevronRight size={40} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Wybierz rozdział z listy lub utwórz nowy</p>
            <button onClick={() => addChapter.mutate()} className="btn btn-primary">
              <Plus size={14} /> Nowy Rozdział
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
