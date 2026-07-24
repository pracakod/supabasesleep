import React, { useRef, useState } from 'react'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { compressImage, uploadToSupabase } from '../../hooks/useImageCompress'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface ImageUploaderProps {
  currentUrl?: string | null
  onUpload: (url: string) => void
  folder?: string
  aspectRatio?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ImageUploader({
  currentUrl, onUpload, folder = 'uploads', aspectRatio = '1/1', label, size = 'md',
}: ImageUploaderProps) {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const sizes = { sm: 80, md: 120, lg: 180 }
  const dim = sizes[size]

  const handleFile = async (file: File) => {
    if (!user) return
    setLoading(true)
    setProgress('Kompresja...')

    try {
      const compressed = await compressImage(file)
      setProgress('Wysyłanie...')
      const path = `${user.id}/${folder}/${Date.now()}.webp`
      const url = await uploadToSupabase(supabase, compressed, path)
      if (url) onUpload(url)
      setProgress('')
    } catch {
      setProgress('Błąd')
    } finally {
      setLoading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="image-uploader-container">
      {label && <label className="label">{label}</label>}
      <div
        style={{
          width: dim, height: dim / parseFloat(aspectRatio.split('/')[0]) * parseFloat(aspectRatio.split('/')[1] || '1'),
          position: 'relative', cursor: 'pointer',
          borderRadius: aspectRatio === '1/1' ? '50%' : 8,
          overflow: 'hidden',
          border: '2px dashed var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 4,
        }}
        onClick={() => fileRef.current?.click()}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl} alt="Podgląd"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }}
              className="img-hover-overlay"
            >
              <Camera size={20} color="#fff" />
            </div>
          </>
        ) : loading ? (
          <>
            <Loader2 size={20} color="var(--text-muted)" className="animate-spin" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{progress}</span>
          </>
        ) : (
          <>
            <Upload size={16} color="var(--text-muted)" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '0 4px' }}>
              Dodaj zdjęcie
            </span>
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={onInputChange}
        />
      </div>




      <style>{`
        .img-hover-overlay { opacity: 0; transition: opacity 0.2s; }
        @media (hover: hover) {
          div:hover .img-hover-overlay { opacity: 1 !important; }
        }
      `}</style>
    </div>
  )
}
