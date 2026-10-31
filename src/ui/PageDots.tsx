import { useEffect, useState } from 'react'
import { useI18n, type StringKey } from '../lib/i18n'

const PAGES: [string, StringKey][] = [
  ['top', 'nav.top'],
  ['about', 'nav.about'],
  ['research', 'nav.research'],
  ['growth', 'nav.growth'],
  ['publications', 'nav.publications'],
  ['outreach', 'nav.outreach'],
  ['gallery', 'nav.gallery'],
  ['contact', 'nav.contact'],
]

/**
 * Penanda halaman di sisi kanan (mode satu halaman). Sekaligus menandai bagian yang
 * sedang di tengah layar dengan kelas "is-active" supaya isinya bisa dianimasikan masuk.
 */
export function PageDots() {
  const { t } = useI18n()
  const [active, setActive] = useState('top')

  useEffect(() => {
    const secs = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'))
    // sebuah bagian dianggap aktif saat melewati garis tengah layar (berlaku juga untuk bagian yang lebih tinggi dari layar)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          e.target.classList.toggle('is-active', e.isIntersecting)
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    secs.forEach((s) => io.observe(s))
    return () => {
      io.disconnect()
      secs.forEach((s) => s.classList.remove('is-active'))
    }
  }, [])

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <nav className="dots" aria-label="Halaman">
      <ol>
        {PAGES.map(([id, key], i) => (
          <li key={id}>
            <button
              className="dots__dot"
              aria-label={`${i + 1}. ${t(key)}`}
              aria-current={active === id ? 'true' : undefined}
              onClick={() => go(id)}
            >
              <span className="dots__label" aria-hidden="true">
                {t(key)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
