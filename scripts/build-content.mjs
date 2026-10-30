#!/usr/bin/env node
/**
 * Membaca folder `content/` lalu membuat:
 *   - src/generated/content.json  (daftar konten yang dibaca situs)
 *   - public/media/...            (salinan PDF dan gambar; gambar dikompres saat --optimize)
 *
 * Dijalankan otomatis oleh `npm run dev` dan `npm run build`.
 * Aturan lengkap ada di docs/PANDUAN-KONTEN.md.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = path.join(root, 'content')
const MEDIA_OUT = path.join(root, 'public', 'media')
const JSON_OUT = path.join(root, 'src', 'generated', 'content.json')

const CATEGORIES = ['penelitian', 'publikasi', 'pengabdian', 'dokumentasi']
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])
const MAX_SIDE = 1800
const THUMB_WIDTH = 720
const PDF_WARN_MB = 25

const optimize = process.argv.includes('--optimize') || process.env.OPTIMIZE === '1'

let sharp = null
if (optimize) {
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('[content] sharp tidak tersedia, gambar disalin tanpa kompresi.')
  }
}

const warnings = []

// ---------- util ----------

const exists = (p) => fs.access(p).then(() => true, () => false)
const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' })

function parseMarkdown(text) {
  const clean = text.replace(/^﻿/, '')
  const m = clean.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: clean.trim() }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    meta[kv[1]] = v
  }
  return { meta, body: m[2].trim() }
}

function titleFromFolder(name) {
  const t = name
    .replace(/^\d{4}[-_ ]+/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : name
}

const urlFor = (...segments) =>
  './media/' + segments.map((s) => encodeURIComponent(s)).join('/')

async function listDirs(dir) {
  if (!(await exists(dir))) return []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name)
}

// ---------- media ----------

async function processImage(src, destDir, name) {
  const dest = path.join(destDir, name)
  const ext = path.extname(name).toLowerCase()
  if (!sharp || ext === '.gif') {
    await fs.copyFile(src, dest)
    return { dest, thumb: null }
  }
  const base = sharp(src, { failOn: 'none' }).rotate()
  let pipe = base.clone().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
  if (ext === '.jpg' || ext === '.jpeg') pipe = pipe.jpeg({ quality: 82, mozjpeg: true })
  else if (ext === '.png') pipe = pipe.png({ compressionLevel: 9 })
  else if (ext === '.webp') pipe = pipe.webp({ quality: 82 })
  else if (ext === '.avif') pipe = pipe.avif({ quality: 55 })
  await pipe.toFile(dest)

  const thumbName = name.replace(/\.[^.]+$/, '') + '.thumb.webp'
  await base
    .clone()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(path.join(destDir, thumbName))
  return { dest, thumb: thumbName }
}

async function copyFiles(cat, slug, srcDir, names) {
  const destDir = path.join(MEDIA_OUT, cat, slug)
  await fs.mkdir(destDir, { recursive: true })
  const out = []
  for (const name of names) {
    const src = path.join(srcDir, name)
    const ext = path.extname(name).toLowerCase()
    if (IMAGE_EXT.has(ext)) {
      const { thumb } = await processImage(src, destDir, name)
      out.push({
        name,
        kind: 'image',
        url: urlFor(cat, slug, name),
        thumb: thumb ? urlFor(cat, slug, thumb) : undefined,
      })
    } else {
      await fs.copyFile(src, path.join(destDir, name))
      const kind = ext === '.pdf' ? 'pdf' : 'other'
      if (kind === 'pdf') {
        const { size } = await fs.stat(src)
        if (size > PDF_WARN_MB * 1024 * 1024) {
          warnings.push(`${cat}/${slug}/${name} berukuran ${(size / 1048576).toFixed(1)} MB (disarankan di bawah ${PDF_WARN_MB} MB).`)
        }
      }
      out.push({ name, kind, url: urlFor(cat, slug, name) })
    }
  }
  return out
}

// ---------- konten ----------

function l10n(idVal, enVal) {
  if (!idVal && !enVal) return undefined
  const o = { id: idVal || enVal }
  if (enVal) o.en = enVal
  return o
}

async function readItem(cat, slug) {
  const dir = path.join(CONTENT, cat, slug)
  const names = (await fs.readdir(dir)).filter((n) => !n.startsWith('.'))
  const idName = names.find((n) => n.toLowerCase() === 'index.md')
  const enName = names.find((n) => n.toLowerCase() === 'index.en.md')

  const id = idName ? parseMarkdown(await fs.readFile(path.join(dir, idName), 'utf8')) : { meta: {}, body: '' }
  const en = enName ? parseMarkdown(await fs.readFile(path.join(dir, enName), 'utf8')) : { meta: {}, body: '' }
  const meta = { ...en.meta, ...id.meta }

  if (/^(true|ya|yes)$/i.test(meta.hidden || '')) return null

  const yearFromFolder = slug.match(/^(\d{4})[-_ ]/)
  const yearRaw = meta.year || (yearFromFolder && yearFromFolder[1])
  const year = yearRaw && /^\d{4}$/.test(String(yearRaw)) ? Number(yearRaw) : undefined

  const fallbackTitle = titleFromFolder(slug)
  const title = l10n(id.meta.title || fallbackTitle, en.meta.title)

  const fileNames = names
    .filter((n) => {
      const low = n.toLowerCase()
      if (low === 'index.md' || low === 'index.en.md') return false
      if (low === 'thumbs.db' || low === 'desktop.ini') return false
      return true
    })
    .sort((a, b) => collator.compare(a, b))
  const files = await copyFiles(cat, slug, dir, fileNames)

  const coverName = meta.cover
  const cover =
    (coverName && files.find((f) => f.kind === 'image' && f.name === coverName)) ||
    files.find((f) => f.kind === 'image')

  let link = meta.link || undefined
  if (!link && meta.doi) link = `https://doi.org/${meta.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}`

  const order = meta.order !== undefined && meta.order !== '' ? Number(meta.order) : undefined

  return {
    id: `${cat}/${slug}`,
    cat,
    slug,
    year,
    order: Number.isFinite(order) ? order : undefined,
    type: meta.type || undefined,
    source: meta.source || undefined,
    link,
    title,
    summary: l10n(id.meta.summary, en.meta.summary),
    body: l10n(id.body || undefined, en.body || undefined),
    cover,
    files,
  }
}

function sortItems(a, b) {
  const ya = a.year ?? 0
  const yb = b.year ?? 0
  if (ya !== yb) return yb - ya
  const oa = a.order ?? 9999
  const ob = b.order ?? 9999
  if (oa !== ob) return oa - ob
  return collator.compare(a.title.id, b.title.id)
}

async function main() {
  const t0 = Date.now()
  await fs.rm(MEDIA_OUT, { recursive: true, force: true })
  await fs.mkdir(MEDIA_OUT, { recursive: true })
  await fs.mkdir(path.dirname(JSON_OUT), { recursive: true })

  let profile = {}
  const profilePath = path.join(CONTENT, 'profil.json')
  if (await exists(profilePath)) {
    try {
      profile = JSON.parse(await fs.readFile(profilePath, 'utf8'))
    } catch (e) {
      throw new Error(`content/profil.json bukan JSON yang valid: ${e.message}`)
    }
  } else {
    warnings.push('content/profil.json tidak ditemukan.')
  }

  const items = []
  for (const cat of CATEGORIES) {
    for (const slug of await listDirs(path.join(CONTENT, cat))) {
      const item = await readItem(cat, slug)
      if (item) items.push(item)
    }
  }
  items.sort(sortItems)

  // CV: PDF pertama di content/cv/
  let cv
  const cvDir = path.join(CONTENT, 'cv')
  if (await exists(cvDir)) {
    const pdfs = (await fs.readdir(cvDir)).filter((n) => n.toLowerCase().endsWith('.pdf')).sort(collator.compare)
    if (pdfs.length) {
      await fs.mkdir(path.join(MEDIA_OUT, 'cv'), { recursive: true })
      await fs.copyFile(path.join(cvDir, pdfs[0]), path.join(MEDIA_OUT, 'cv', pdfs[0]))
      cv = { name: pdfs[0], url: urlFor('cv', pdfs[0]) }
    }
  }

  // Cek rujukan di profil.json
  const ids = new Set(items.map((i) => i.id))
  for (const f of profile.researchFocus || []) {
    for (const ref of f.refs || []) {
      if (!ids.has(ref)) warnings.push(`researchFocus merujuk "${ref}" yang tidak ada di folder content/.`)
    }
  }

  const manifest = { generatedAt: new Date().toISOString(), profile, cv, items }
  await fs.writeFile(JSON_OUT, JSON.stringify(manifest, null, 1) + '\n')

  const counts = CATEGORIES.map((c) => `${c}: ${items.filter((i) => i.cat === c).length}`).join(', ')
  console.log(`[content] ${items.length} item (${counts})${cv ? ', CV ditemukan' : ''} dalam ${Date.now() - t0} ms${optimize && sharp ? ' [gambar dioptimalkan]' : ''}`)
  for (const w of warnings) console.warn(`[content] PERINGATAN: ${w}`)
}

main().catch((e) => {
  console.error('[content] GAGAL:', e.message)
  process.exit(1)
})
