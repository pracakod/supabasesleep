import React from 'react'
import {
  LayoutDashboard, BookOpen, Users, MapPin, Clock, Kanban,
  Search, Lightbulb, LogOut, ChevronRight, BookMarked,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export type ModuleId =
  | 'dashboard' | 'editor' | 'characters' | 'locations'
  | 'timeline' | 'kanban' | 'research' | 'writer-zone' | 'profile'

interface SidebarProps {
  active: ModuleId
  onChange: (id: ModuleId) => void
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS: { id: ModuleId; label: string; icon: React.ReactNode; section?: string }[] = [
  { id: 'dashboard', label: 'Panel Główny', icon: <LayoutDashboard size={16} />, section: 'PROJEKT' },
  { id: 'editor', label: 'Edytor Rozdziałów', icon: <BookOpen size={16} /> },
  { id: 'characters', label: 'Baza Postaci', icon: <Users size={16} /> },
  { id: 'locations', label: 'Baza Miejsc', icon: <MapPin size={16} /> },
  { id: 'timeline', label: 'Oś Czasu', icon: <Clock size={16} /> },
  { id: 'kanban', label: 'Tablica Korkowa', icon: <Kanban size={16} /> },
  { id: 'research', label: 'Research & Słownik', icon: <Search size={16} />, section: 'ŚWIAT' },
  { id: 'writer-zone', label: 'Strefa Pisarza', icon: <Lightbulb size={16} /> },
  { id: 'profile', label: 'Profil Autora', icon: <BookMarked size={16} />, section: 'KONTO' },
]

export default function Sidebar({ active, onChange, isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth()

  const handleNav = (id: ModuleId) => {
    onChange(id)
    onClose()
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <BookOpen size={16} color="#000" strokeWidth={2.5} />
          </div>
          <span className="sidebar-logo-text">Studio Książki</span>
        </div>

        {/* Nawigacja */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <React.Fragment key={item.id}>
              {item.section && (
                <p className="sidebar-section-label">{item.section}</p>
              )}
              <button
                className={`nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
              >
                <span className="icon" style={{ color: active === item.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                {item.label}
                {active === item.id && (
                  <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />
                )}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Profil użytkownika w stopce */}
        <div style={{
          padding: '12px 12px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#000',
          }}>
            {profile?.pseudonym?.[0] || profile?.display_name?.[0] || '?'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.pseudonym || 'D. K.'}
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.status === 'premium' ? '⭐ Premium' : '🆓 Darmowy'}
            </p>
          </div>
          <button
            onClick={() => { signOut() }}
            className="btn-icon btn-ghost"
            title="Wyloguj się"
            style={{ color: 'var(--text-muted)', padding: 6 }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>
    </>
  )
}
