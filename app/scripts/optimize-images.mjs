// One-off image optimizer: convert used photos to WebP (q80, max width 1920),
// delete originals, and remove dead/duplicate files.
import sharp from 'sharp'
import { rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const MAX_W = 1920
const Q = 80

const toWebp = [
  ...Array.from({ length: 9 }, (_, i) => `src/assets/class-0${i + 1}.png`),
  ...Array.from({ length: 6 }, (_, i) => `src/assets/s${i + 1}.png`),
  'src/assets/debora-pilati-dOG0z4-gqp0-unsplash.jpg',
  'public/images/s4/gt.png',
  'public/images/s9-bg.jpg',
  'public/images/s4-bg.jpg',
]

const dead = [
  'public/images/s5',
  'src/assets/gt.png',
  'src/assets/yuriy-kovalev-nN1HSDtKdlw-unsplash.jpg',
  'src/assets/ikhlas-y9Ujplj3KIU-unsplash.jpg',
  'src/assets/alessio-soggetti-cfKC0UOZHJo-unsplash.jpg',
]

const size = async (p) => (existsSync(p) ? (await stat(p)).size : 0)
const mb = (n) => (n / 1048576).toFixed(2)

let before = 0
let after = 0

for (const src of toWebp) {
  if (!existsSync(src)) {
    console.log(`SKIP missing: ${src}`)
    continue
  }
  const out = src.replace(/\.(png|jpe?g)$/i, '.webp')
  const inBytes = await size(src)
  await sharp(src)
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: Q, effort: 6 })
    .toFile(out)
  const outBytes = await size(out)
  before += inBytes
  after += outBytes
  await rm(src)
  console.log(`${mb(inBytes)}MB -> ${mb(outBytes)}MB  ${src}  ->  ${out}`)
}

let deadBytes = 0
for (const p of dead) {
  if (!existsSync(p)) {
    console.log(`SKIP dead missing: ${p}`)
    continue
  }
  const s = await stat(p)
  if (s.isDirectory()) {
    // sum dir
    const { readdirSync, statSync } = await import('node:fs')
    for (const f of readdirSync(p)) deadBytes += statSync(`${p}/${f}`).size
  } else {
    deadBytes += s.size
  }
  await rm(p, { recursive: true, force: true })
  console.log(`DELETED dead: ${p}`)
}

console.log('\n=== SUMMARY ===')
console.log(`Converted: ${mb(before)}MB -> ${mb(after)}MB (saved ${mb(before - after)}MB)`)
console.log(`Dead files removed: ${mb(deadBytes)}MB`)
console.log(`Total saved: ${mb(before - after + deadBytes)}MB`)
