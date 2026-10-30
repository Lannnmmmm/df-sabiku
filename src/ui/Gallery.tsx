import { useI18n } from '../lib/i18n'
import { itemsOf } from '../lib/content'
import { useModal } from './Modal'

export function Gallery() {
  const { t, pick } = useI18n()
  const { showItem } = useModal()
  const items = itemsOf('dokumentasi')
  return (
    <section id="gallery" className="section" data-stage="3.5" aria-labelledby="gal-title">
      <div className="section__inner">
        <h2 id="gal-title" className="section__title">
          {t('gal.title')}
        </h2>
        {items.length === 0 ? (
          <div className="empty">
            <p>{t('gal.empty')}</p>
            {import.meta.env?.DEV && <p className="note">{t('gal.howto')}</p>}
          </div>
        ) : (
          <div className="tiles">
            {items.map((it) => {
              const count = it.files.filter((f) => f.kind === 'image').length
              return (
                <button key={it.id} className="tile" onClick={() => showItem(it)}>
                  {it.cover ? (
                    <img src={it.cover.thumb || it.cover.url} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="tile__ph" aria-hidden="true" />
                  )}
                  <span className="tile__cap">
                    <span className="tile__title">{pick(it.title)}</span>
                    <span className="tile__meta">
                      {it.year}
                      {count > 0 ? `, ${count} ${t('gal.photos')}` : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
