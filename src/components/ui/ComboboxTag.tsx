import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

interface ComboboxTagProps {
  value: string
  onChange: (val: string) => void
  options: string[]
  onAddOption?: (val: string) => void
  placeholder?: string
  label?: string
}

export default function ComboboxTag({
  value, onChange, options, onAddOption, placeholder = 'Wybierz lub wpisz...', label,
}: ComboboxTagProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  const canAdd = query.trim() && !options.includes(query.trim())

  const select = (val: string) => {
    onChange(val)
    setQuery(val)
    setOpen(false)
  }

  const addNew = () => {
    const val = query.trim()
    if (!val) return
    onAddOption?.(val)
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && <label className="label">{label}</label>}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          ref={inputRef}
          className="input"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); canAdd ? addNew() : filtered[0] && select(filtered[0]) }
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        {value && (
          <button className="btn-icon btn-ghost" onClick={() => { onChange(''); setQuery('') }} style={{ flexShrink: 0, padding: 8 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {open && (filtered.length > 0 || canAdd) && (
        <div className="combobox-dropdown">
          {filtered.map(opt => (
            <div key={opt} className="combobox-option" onMouseDown={() => select(opt)}>
              {opt}
            </div>
          ))}
          {canAdd && (
            <div
              className="combobox-option"
              onMouseDown={addNew}
              style={{ color: 'var(--accent)', borderTop: filtered.length ? '1px solid var(--border)' : 'none' }}
            >
              <Plus size={13} />
              Dodaj „{query.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
