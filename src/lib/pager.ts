/**
 * Pengendali roda untuk mode satu halaman: satu gerakan roda atau trackpad berpindah tepat satu halaman.
 *
 * Snap CSS saja tidak cukup, karena satu "tik" roda kecil bisa berakhir di titik snap terdekat,
 * yaitu halaman yang sama, sehingga terasa macet. Keyboard, sentuhan, dan tombol navigasi tetap
 * ditangani snap CSS dan scrollIntoView.
 */

const COOLDOWN = 750 // ms, kira-kira selama animasi perpindahan
const QUIET = 110 // ms tanpa kejadian roda sebelum gerakan berikutnya dihitung (menyaring inersia trackpad)

/** Apakah elemen (atau induknya, sampai <main>) punya gulir sendiri yang masih bisa bergerak ke arah itu? */
function innerScroll(el: Element | null, dir: number): boolean {
  for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n)
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 1) {
      const atEnd = dir > 0 ? n.scrollTop + n.clientHeight >= n.scrollHeight - 1 : n.scrollTop <= 0
      if (!atEnd) return true
    }
  }
  return false
}

export function startPager(): () => void {
  let busyUntil = 0
  let lastWheel = 0

  const flip = (dir: 1 | -1): boolean => {
    const list = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'))
    const vh = window.innerHeight
    const rects = list.map((s) => s.getBoundingClientRect())
    let idx = rects.findIndex((r) => r.top <= vh / 2 && r.bottom > vh / 2)
    if (idx < 0) idx = 0
    const r = rects[idx]
    // bagian yang lebih tinggi dari layar digulir dulu secara normal sampai tepinya terlihat
    if (dir > 0 && r.bottom > vh + 4) return false
    if (dir < 0 && r.top < -4) return false
    const target = rects[idx + dir]
    if (!target) return true // sudah di ujung
    const top = window.scrollY + target.top + (dir < 0 ? Math.max(0, target.height - vh) : 0)
    window.scrollTo({ top, behavior: 'smooth' })
    return true
  }

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.defaultPrevented) return // zoom cubit
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    if (document.documentElement.classList.contains('is-loading')) return
    const t = e.target as Element | null
    if (t?.closest('dialog, [data-no-pager]')) return
    const dir = e.deltaY > 0 ? 1 : -1
    if (innerScroll(t, dir)) return

    const now = performance.now()
    const quiet = now - lastWheel > QUIET
    lastWheel = now
    if (now < busyUntil || !quiet) {
      // masih dalam animasi atau inersia: tahan, jangan menggulir
      e.preventDefault()
      return
    }
    if (flip(dir)) {
      e.preventDefault()
      busyUntil = now + COOLDOWN
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false })
  return () => window.removeEventListener('wheel', onWheel)
}
