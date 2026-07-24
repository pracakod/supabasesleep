/**
 * generate-icons.mjs
 * Generuje wszystkie ikony PWA z pliku źródłowego.
 * Uruchom: node scripts/generate-icons.mjs
 * Wymaga: npm install sharp -D
 */

import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC  = join(ROOT, 'src', 'assets', 'icon-source.png')
const DEST = join(ROOT, 'public', 'icons')

if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true })

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

async function generate() {
  console.log('🎨 Generowanie ikon PWA...')
  for (const size of SIZES) {
    const out = join(DEST, `icon-${size}.png`)
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 13, g: 31, b: 21, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(out)
    console.log(`  ✓ icon-${size}.png`)
  }

  // Favicon 32x32
  await sharp(SRC).resize(32, 32).png().toFile(join(ROOT, 'public', 'favicon.png'))
  console.log('  ✓ favicon.png')

  // Apple touch icon 180x180
  await sharp(SRC)
    .resize(180, 180, { fit: 'contain', background: { r: 13, g: 31, b: 21, alpha: 1 } })
    .png()
    .toFile(join(DEST, 'apple-touch-icon.png'))
  console.log('  ✓ apple-touch-icon.png')

  console.log('\n✅ Wszystkie ikony wygenerowane w public/icons/')
}

generate().catch(err => {
  console.error('Błąd:', err.message)
  process.exit(1)
})
