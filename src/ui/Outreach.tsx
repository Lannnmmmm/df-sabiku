import { useI18n } from '../lib/i18n'
import { itemsOf } from '../lib/content'
import { hasDetail, useModal } from './Modal'

export function Outreach() {
  const { t, pick } = useI18n()
  const { showItem } = useModal()
  const items = itemsOf('pengabdian')
  return (
    <section id="outreach" className="section" data-stage="3.25" aria-labelledby="out-title">
      <div className="section__inner">
        <h2 id="out-title" className="section__title">
          {t('out.title')}
        </h2>
        {items.length === 0 ? (
          <p className="note">{t('out.none')}</p>
        ) : (
          <div className="cards">
            {items.map((it) => (
              <article key={it.id} className="glass card">
                <p className="card__year">{it.year}</p>
                <h3 className="card__title">{pick(it.title)}</h3>
                {pick(it.summary) && <p className="card__text">{pick(it.summary)}</p>}
                {it.cover && (
                  <img className="card__img" src={it.cover.thumb || it.cover.url} alt="" loading="lazy" decoding="async" />
                )}
                {hasDetail(it) && (
                  <button className="btn btn--quiet card__btn" onClick={() => showItem(it)}>
                    {t('modal.details')}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
