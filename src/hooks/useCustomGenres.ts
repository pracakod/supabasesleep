import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { UserCustomGenre } from '../types/database.types'

// ─── Publiczny typ uproszczony (do użycia w komponentach) ────────────────────
export interface CustomGenreInput {
  name: string
  min_words: number
  max_words: number
  description: string
}

interface UseCustomGenresReturn {
  genres: UserCustomGenre[]
  loading: boolean
  error: string | null
  addGenre: (input: CustomGenreInput) => Promise<UserCustomGenre | null>
  deleteGenre: (id: string) => Promise<void>
}

export function useCustomGenres(): UseCustomGenresReturn {
  const { user } = useAuth()
  const [genres, setGenres] = useState<UserCustomGenre[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Pobierz gatunki użytkownika ────────────────────────────────────────────
  const fetchGenres = useCallback(async () => {
    if (!user) { setGenres([]); return }

    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('user_custom_genres')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setGenres((data ?? []) as UserCustomGenre[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchGenres() }, [fetchGenres])

  // ── Dodaj gatunek ──────────────────────────────────────────────────────────
  const addGenre = useCallback(async (input: CustomGenreInput): Promise<UserCustomGenre | null> => {
    if (!user) return null

    setError(null)

    const { data, error: err } = await supabase
      .from('user_custom_genres')
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        min_words: input.min_words,
        max_words: input.max_words,
        description: input.description.trim(),
      })
      .select()
      .single()

    if (err) {
      // Duplikat nazwy (UNIQUE constraint)
      if (err.code === '23505') {
        setError('Gatunek o tej nazwie już istnieje.')
      } else {
        setError(err.message)
      }
      return null
    }

    const newGenre = data as UserCustomGenre
    setGenres(prev => [newGenre, ...prev])
    return newGenre
  }, [user])

  // ── Usuń gatunek ───────────────────────────────────────────────────────────
  const deleteGenre = useCallback(async (id: string): Promise<void> => {
    if (!user) return

    setError(null)

    const { error: err } = await supabase
      .from('user_custom_genres')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // dodatkowe zabezpieczenie (poza RLS)

    if (err) {
      setError(err.message)
      return
    }

    setGenres(prev => prev.filter(g => g.id !== id))
  }, [user])

  return { genres, loading, error, addGenre, deleteGenre }
}
