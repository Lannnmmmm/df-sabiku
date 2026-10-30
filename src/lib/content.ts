import manifest from '../generated/content.json'

export type Lang = 'id' | 'en'
export type Category = 'penelitian' | 'publikasi' | 'pengabdian' | 'dokumentasi'

export interface L10n {
  id: string
  en?: string
}

export interface MediaFile {
  name: string
  kind: 'pdf' | 'image' | 'other'
  url: string
  thumb?: string
}

export interface Item {
  id: string
  cat: Category
  slug: string
  year?: number
  order?: number
  type?: string
  source?: string
  link?: string
  title: L10n
  summary?: L10n
  body?: L10n
  cover?: MediaFile
  files: MediaFile[]
}

export interface Profile {
  name: string
  degrees: string
  role: L10n
  institution: string
  program: L10n
  position: L10n
  tagline: L10n
  bio: { id: string[]; en?: string[] }
  education: { level: string; year: number; institution: string; program: L10n }[]
  researchFocus: { title: L10n; text: L10n; refs?: string[] }[]
  links: Record<string, string>
  address?: string
  contactFormEndpoint?: string
}

interface Manifest {
  profile: Profile
  cv?: { name: string; url: string }
  items: Item[]
}

const data = manifest as unknown as Manifest

export const profile = data.profile
export const cv = data.cv
export const allItems = data.items

export const itemsOf = (cat: Category) => allItems.filter((i) => i.cat === cat)
export const itemById = (id: string) => allItems.find((i) => i.id === id)

export function pick(l: L10n | undefined, lang: Lang): string {
  if (!l) return ''
  return (lang === 'en' && l.en) || l.id
}

export function pickList(l: { id: string[]; en?: string[] } | undefined, lang: Lang): string[] {
  if (!l) return []
  return (lang === 'en' && l.en && l.en.length ? l.en : l.id) || []
}

export type PubGroup = 'jurnal' | 'prosiding' | 'buku' | 'hki' | 'lain'

export function pubGroup(type?: string): PubGroup {
  const t = (type || '').toLowerCase()
  if (t.includes('jurnal') || t.includes('journal')) return 'jurnal'
  if (t.includes('prosiding') || t.includes('proceeding')) return 'prosiding'
  if (t.includes('buku') || t.includes('book')) return 'buku'
  if (t.includes('hak cipta') || t.includes('hki') || t.includes('copyright') || t.includes('paten')) return 'hki'
  return 'lain'
}
