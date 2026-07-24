import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface CollabPresence {
  userId: string
  displayName: string
  module: string
  color: string
  lastSeen: number
}

const PRESENCE_COLORS = [
  '#4ade80', '#f472b6', '#60a5fa', '#fb923c',
  '#a78bfa', '#34d399', '#f87171', '#fbbf24',
]

/**
 * Warunkowy hook do współpracy w czasie rzeczywistym.
 * Aktywuje się tylko gdy projekt jest widoczny dla współpracowników
 * (visibility !== 'private'). W trybie prywatnym nie otwiera żadnego kanału.
 */
export function useRealtimeCollab(
  projectId: string | null,
  visibility: 'private' | 'readonly' | 'collaborative' | undefined,
  activeModule: string,
) {
  const { user, profile } = useAuth()
  const [participants, setParticipants] = useState<CollabPresence[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const colorRef = useRef(
    PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)],
  )

  useEffect(() => {
    // Nie otwieraj kanału dla prywatnych projektów lub brak projektu
    if (!projectId || !user || visibility === 'private') {
      setParticipants([])
      return
    }

    const channelName = `collab:${projectId}`

    // Zamknij poprzedni kanał jeśli istnieje
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, any[]>
        const all: CollabPresence[] = []
        Object.values(state).forEach((presences) => {
          // Każdy user może mieć wiele sesji – bierzemy najnowszą
          const sorted = [...presences].sort((a, b) => b.lastSeen - a.lastSeen)
          if (sorted[0]) all.push(sorted[0] as CollabPresence)
        })
        // Wyklucz siebie z listy uczestników
        setParticipants(all.filter(p => p.userId !== user.id))
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any[] }) => {
        setParticipants(prev => {
          const ids = new Set(prev.map(p => p.userId))
          const toAdd = (newPresences as unknown as CollabPresence[]).filter(
            p => p.userId !== user.id && !ids.has(p.userId),
          )
          return [...prev, ...toAdd]
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
        const leftIds = new Set((leftPresences as unknown as CollabPresence[]).map(p => p.userId))
        setParticipants(prev => prev.filter(p => !leftIds.has(p.userId)))
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            displayName: profile?.display_name ?? profile?.pseudonym ?? 'Anonim',
            module: activeModule,
            color: colorRef.current,
            lastSeen: Date.now(),
          } satisfies CollabPresence)
        }
      })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [projectId, visibility, user?.id])

  // Aktualizuj aktywny moduł bez ponownego tworzenia kanału
  useEffect(() => {
    if (!channelRef.current || !user) return
    channelRef.current.track({
      userId: user.id,
      displayName: profile?.display_name ?? profile?.pseudonym ?? 'Anonim',
      module: activeModule,
      color: colorRef.current,
      lastSeen: Date.now(),
    } satisfies CollabPresence)
  }, [activeModule])

  return { participants }
}
