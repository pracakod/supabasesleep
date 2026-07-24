import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.15,        // max 150 KB
    maxWidthOrHeight: 800,  // max 800px
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
  }

  try {
    const compressed = await imageCompression(file, options)
    // Nadaj rozszerzenie .webp
    const webpFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
    })
    return webpFile
  } catch {
    return file // fallback - zwróć oryginał
  }
}

export async function uploadToSupabase(
  supabaseClient: typeof import('../lib/supabase').supabase,
  file: File,
  path: string
): Promise<string | null> {
  const compressed = await compressImage(file)
  const { data, error } = await supabaseClient.storage
    .from('book-media')
    .upload(path, compressed, { upsert: true, contentType: 'image/webp' })

  if (error) return null

  const { data: urlData } = supabaseClient.storage
    .from('book-media')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}
