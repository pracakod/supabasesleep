import { useOfflineSync } from '../../hooks/useOfflineSync'
import { Cloud, CloudOff, CloudUpload } from 'lucide-react'

export default function NetworkStatus() {
  const { isOnline, pendingCount } = useOfflineSync()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${isOnline ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
      fontSize: 11.5, fontWeight: 600,
      color: isOnline ? '#22c55e' : '#ef4444',
      cursor: 'default',
      userSelect: 'none',
    }}
      title={!isOnline ? `Tryb offline – ${pendingCount} niezapisanych zmian` : 'Połączono z serwerem'}
    >
      <div className={`network-dot ${isOnline ? 'online' : 'offline'}`} />
      {pendingCount > 0 ? (
        <>
          <CloudUpload size={13} />
          <span>{pendingCount}</span>
        </>
      ) : isOnline ? (
        <Cloud size={13} />
      ) : (
        <CloudOff size={13} />
      )}
      <span style={{ display: 'none' }}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}
