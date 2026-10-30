import { useState } from 'react'
import { useI18n, type StringKey } from '../lib/i18n'
import { profile } from '../lib/content'

const LINKS: [string, StringKey][] = [
  ['about', 'nav.about'],
  ['research', 'nav.research'],
  ['growth', 'nav.growth'],
  ['publications', 'nav.publications'],
  ['outreach', 'nav.outreach'],
  ['gallery', 'nav.gallery'],
  ['contact', 'nav.contact'],
]

export function Nav() {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <a className="nav__brand" href="#top" onClick={() => setOpen(false)}>
        {profile.name}
      </a>
      <button
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen((o) => !o)}
      >
        {t('nav.menu')}
      </button>
      <nav id="nav-links" className={`nav__links${open ? ' is-open' : ''}`} aria-label="Navigasi utama">
        <ul>
          {LINKS.map(([id, key]) => (
            <li key={id}>
              <a href={`#${id}`} onClick={() => setOpen(false)}>
                {t(key)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="nav__lang" role="group" aria-label={t('nav.lang')}>
        <button aria-pressed={lang === 'id'} onClick={() => setLang('id')}>
          ID
        </button>
        <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
          EN
        </button>
      </div>
    </header>
  )
}
