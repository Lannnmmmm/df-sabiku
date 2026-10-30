import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../lib/i18n'
import { itemById, type Item } from '../lib/content'
import { Markdown } from '../lib/markdown'

interface ModalState {
  title: string
  node: ReactNode
}

interface Ctx {
  show: (title: string, node: ReactNode) => void
  showItem: (item: Item) => void
  close: () => void
}

const ModalContext = createContext<Ctx | null>(null)

export function useModal() {
  const c = useContext(ModalContext)
  if (!c) throw new Error('useModal harus dipakai di dalam ModalProvider')
  return c
}

export function hasDetail(item: Item) {
  return !!(item.body || item.summary || item.files.length || item.link)
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [state, setState] = useState<ModalState | null>(null)
  const ref = useRef<HTMLDialogElement>(null)

  const show = useCallback((title: string, node: ReactNode) => setState({ title, node }), [])
  const close = useCallback(() => setState(null), [])
  const showItem = useCallback(
    (item: Item) => setState({ title: item.type || t('modal.details'), node: <ItemDetail item={item} /> }),
    [t],
  )

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (state && !d.open) d.showModal()
    if (!state && d.open) d.close()
  }, [state])

  const title = state ? state.title : ''

  return (
    <ModalContext.Provider value={{ show, showItem, close }}>
      {children}
      <dialog
        ref={ref}
        className="modal"
        aria-label={title}
        onClose={close}
        onClick={(e) => {
          if (e.target === ref.current) close()
        }}
      >
        {state && (
          <div className="modal__inner">
            <header className="modal__head">
              <h2 className="modal__title">{state.title}</h2>
              <button className="modal__close" onClick={close} aria-label={t('modal.close')}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </header>
            <div className="modal__body">{state.node}</div>
          </div>
        )}
      </dialog>
    </ModalContext.Provider>
  )
}

export function ItemDetail({ item }: { item: Item }) {
  const { t, pick, lang } = useI18n()
  const [active, setActive] = useState<number | null>(null)
  const images = item.files.filter((f) => f.kind === 'image')
  const docs = item.files.filter((f) => f.kind !== 'image')
  const body = pick(item.body)

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActive((a) => (a === null ? a : (a + 1) % images.length))
      if (e.key === 'ArrowLeft') setActive((a) => (a === null ? a : (a - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, images.length])

  if (active !== null && images[active]) {
    const img = images[active]
    return (
      <div className="lightbox">
        <img className="lightbox__img" src={img.url} alt={`${pick(item.title)} (${active + 1}/${images.length})`} />
        <div className="lightbox__bar">
          <button className="btn btn--quiet" onClick={() => setActive(null)}>
            {t('modal.back')}
          </button>
          {images.length > 1 && (
            <span className="lightbox__nav">
              <button className="btn btn--quiet" onClick={() => setActive((active - 1 + images.length) % images.length)}>
                {t('modal.prev')}
              </button>
              <span className="lightbox__count">
                {active + 1} / {images.length}
              </span>
              <button className="btn btn--quiet" onClick={() => setActive((active + 1) % images.length)}>
                {t('modal.next')}
              </button>
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="detail">
      <p className="detail__title">{pick(item.title)}</p>
      <dl className="detail__meta">
        {item.year && (
          <div>
            <dt className="sr-only">Tahun</dt>
            <dd>{item.year}</dd>
          </div>
        )}
        {item.type && (
          <div>
            <dt className="sr-only">Jenis</dt>
            <dd>{item.type}</dd>
          </div>
        )}
        {item.source && (
          <div>
            <dt>{t('modal.source')}</dt>
            <dd>{item.source}</dd>
          </div>
        )}
      </dl>
      {pick(item.summary) && <p className="detail__summary">{pick(item.summary)}</p>}
      {body && (
        <div className="prose" lang={lang}>
          <Markdown source={body} />
        </div>
      )}
      {(docs.length > 0 || item.link) && (
        <div className="detail__actions">
          {docs.map((f) => (
            <a key={f.url} className="btn" href={f.url} target="_blank" rel="noopener noreferrer">
              {f.kind === 'pdf' ? t('modal.openPdf') : f.name}
              {f.kind === 'pdf' && <span className="btn__file">{f.name}</span>}
            </a>
          ))}
          {item.link && (
            <a className="btn" href={item.link} target="_blank" rel="noopener noreferrer">
              {t('modal.link')}
            </a>
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className="detail__photos">
          <h3 className="detail__sub">{t('modal.photos')}</h3>
          <div className="thumbs">
            {images.map((img, i) => (
              <button key={img.url} className="thumbs__btn" onClick={() => setActive(i)}>
                <img src={img.thumb || img.url} alt={`${pick(item.title)} (${i + 1})`} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function RelatedList({ refs }: { refs: string[] }) {
  const { pick } = useI18n()
  const { showItem } = useModal()
  const items = refs.map(itemById).filter((i): i is Item => !!i)
  return (
    <ul className="related">
      {items.map((it) => (
        <li key={it.id}>
          <button className="related__btn" onClick={() => showItem(it)}>
            <span className="related__year">{it.year}</span>
            <span className="related__title">{pick(it.title)}</span>
            {it.type && <span className="related__type">{it.type}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}

