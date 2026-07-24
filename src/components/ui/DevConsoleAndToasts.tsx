import { useEffect, useState } from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import { registerSW } from 'virtual:pwa-register'
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, Terminal, Trash2, X } from 'lucide-react'

const TOAST_ICONS = {
  success: <CheckCircle2 className="toast-icon" size={18} style={{ color: '#10b981' }} />,
  error: <AlertOctagon className="toast-icon" size={18} style={{ color: '#ef4444' }} />,
  warning: <AlertTriangle className="toast-icon" size={18} style={{ color: '#f59e0b' }} />,
  info: <Info className="toast-icon" size={18} style={{ color: '#3b82f6' }} />,
}

export default function DevConsoleAndToasts() {
  const { toasts, logs, clearLogs, showConsole, setShowConsole, showToast } = useNotification()
  const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all')

  // Register PWA Service Worker
  useEffect(() => {
    try {
      registerSW({
        onNeedRefresh() {
          showToast('Dostępna jest nowa wersja aplikacji. Odśwież stronę, aby zaktualizować.', 'info')
        },
        onOfflineReady() {
          showToast('Aplikacja jest gotowa do pracy offline!', 'success')
        },
      })
    } catch (err) {
      console.error('Błąd rejestracji Service Workera:', err)
    }
  }, [showToast])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.type === filter
  })

  return (
    <>
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {TOAST_ICONS[toast.type]}
            <div style={{ flex: 1 }}>{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Floating button to open logs console */}
      <button
        className="dev-console-trigger"
        onClick={() => setShowConsole(!showConsole)}
        title="Otwórz konsolę logów systemowych"
      >
        <Terminal size={20} />
      </button>

      {/* Developer Logs Console */}
      {showConsole && (
        <div className="dev-console">
          <div className="dev-console-header">
            <span className="dev-console-title">Logi systemowe</span>
            <div className="dev-console-tabs">
              <button
                className={`dev-console-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Wszystkie ({logs.length})
              </button>
              <button
                className={`dev-console-tab ${filter === 'log' ? 'active' : ''}`}
                onClick={() => setFilter('log')}
              >
                Logi ({logs.filter(l => l.type === 'log').length})
              </button>
              <button
                className={`dev-console-tab ${filter === 'warn' ? 'active' : ''}`}
                onClick={() => setFilter('warn')}
              >
                Ostrzeżenia ({logs.filter(l => l.type === 'warn').length})
              </button>
              <button
                className={`dev-console-tab ${filter === 'error' ? 'active' : ''}`}
                onClick={() => setFilter('error')}
              >
                Błędy ({logs.filter(l => l.type === 'error').length})
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={clearLogs}
                style={{ height: 26, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4, borderColor: 'transparent', fontSize: 11 }}
              >
                <Trash2 size={12} /> Wyczyść
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowConsole(false)}
                style={{ height: 26, padding: 0, width: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: 'transparent' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="dev-console-body">
            {filteredLogs.map(log => (
              <div key={log.id} className={`dev-log-row ${log.type}`}>
                <span className="dev-log-time">[{log.timestamp}]</span>
                <span>{log.message}</span>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Brak logów w tej kategorii.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
