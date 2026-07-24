import { useEffect, useState } from 'react'
import { openDB } from 'idb'
import { supabase } from '../lib/supabase'

const DB_NAME = 'studio-ksiazki-offline'
const DB_VERSION = 1

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pending-writes')) {
        db.createObjectStore('pending-writes', { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}

export interface PendingWrite {
  id?: number
  table: string
  operation: 'upsert' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: number
}

export async function saveOffline(write: Omit<PendingWrite, 'id' | 'timestamp'>) {
  const db = await getDB()
  await db.add('pending-writes', { ...write, timestamp: Date.now() })
}

export async function syncOfflineWrites() {
  const db = await getDB()
  const pending = await db.getAll('pending-writes')

  for (const write of pending) {
    try {
      if (write.operation === 'upsert') {
        await supabase.from(write.table).upsert(write.data)
      } else if (write.operation === 'update') {
        const { id, ...rest } = write.data as { id: string; [key: string]: unknown }
        await supabase.from(write.table).update(rest).eq('id', id)
      } else if (write.operation === 'delete') {
        await supabase.from(write.table).delete().eq('id', (write.data as { id: string }).id)
      }
      await db.delete('pending-writes', write.id!)
    } catch {
      // Zostaw w kolejce jeśli błąd
    }
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      await syncOfflineWrites()
      const db = await getDB()
      setPendingCount((await db.getAll('pending-writes')).length)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Sprawdź pending przy starcie
    getDB().then(db => db.getAll('pending-writes')).then(p => setPendingCount(p.length))

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, pendingCount }
}
