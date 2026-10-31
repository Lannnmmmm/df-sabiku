import { store } from './store'

interface Anchor {
  y: number
  s: number
}

let anchors: Anchor[] = [{ y: 0, s: 0 }]
/** Seberapa awal (dalam tinggi layar) tahap sebuah bagian tercapai sebelum bagian itu tiba di puncak layar. */
let lead = 0.3

/** Pada mode satu halaman gulir berhenti tepat di puncak bagian, jadi tahap dicapai di sana. */
export function setPageMode(on: boolean) {
  lead = on ? 0 : 0.3
  measureAnchors()
  store.stage = stageAt(window.scrollY)
}

/**
 * Setiap <section data-stage="n"> menandai tahap pertumbuhan yang harus tercapai
 * ketika bagian itu tiba di layar. Posisi diukur ulang saat ukuran halaman berubah,
 * jadi menambah konten (yang membuat halaman lebih panjang) tidak merusak animasi.
 */
export function measureAnchors() {
  const vh = window.innerHeight
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'))
  const list = els.map((el, i) => {
    const top = el.getBoundingClientRect().top + window.scrollY
    const y = i === 0 ? 0 : Math.min(top - vh * lead, maxScroll)
    return { y, s: Number(el.dataset.stage) }
  })
  // y harus naik monoton supaya interpolasi masuk akal
  for (let i = 1; i < list.length; i++) {
    if (list[i].y <= list[i - 1].y) list[i].y = list[i - 1].y + 1
  }
  anchors = list.length ? list : [{ y: 0, s: 0 }]
}

export function stageAt(y: number): number {
  if (y <= anchors[0].y) return anchors[0].s
  for (let i = 1; i < anchors.length; i++) {
    if (y <= anchors[i].y) {
      const a = anchors[i - 1]
      const b = anchors[i]
      return a.s + ((y - a.y) / (b.y - a.y)) * (b.s - a.s)
    }
  }
  return anchors[anchors.length - 1].s
}

/** Mulai membaca gulir. Mengembalikan fungsi pembersih. */
export function startScrollTracking(): () => void {
  const onScroll = () => {
    store.scrollY = window.scrollY
    store.stage = stageAt(window.scrollY)
  }
  const onResize = () => {
    measureAnchors()
    onScroll()
  }
  const ro = new ResizeObserver(onResize)
  ro.observe(document.body)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  // fonts dan gambar bisa mengubah tinggi halaman setelah render pertama
  const t1 = window.setTimeout(onResize, 400)
  const t2 = window.setTimeout(onResize, 1800)
  onResize()
  return () => {
    ro.disconnect()
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    window.clearTimeout(t1)
    window.clearTimeout(t2)
  }
}
