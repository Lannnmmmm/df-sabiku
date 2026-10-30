import { useI18n, type StringKey } from '../lib/i18n'

const STEPS: [StringKey, StringKey][] = [
  ['growth.s1.t', 'growth.s1.d'],
  ['growth.s2.t', 'growth.s2.d'],
  ['growth.s3.t', 'growth.s3.d'],
  ['growth.s4.t', 'growth.s4.d'],
  ['growth.s5.t', 'growth.s5.d'],
]

export function Growth() {
  const { t } = useI18n()
  return (
    <section id="growth" className="section" data-stage="2.4" aria-labelledby="growth-title">
      <div className="section__inner">
        <div className="col">
          <h2 id="growth-title" className="section__title">
            {t('growth.title')}
          </h2>
          <p className="lead">{t('growth.intro')}</p>
          <ol className="steps">
            {STEPS.map(([title, desc], i) => (
              <li key={title} className="steps__item">
                <span className="steps__n" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="steps__title">{t(title)}</h3>
                  <p className="steps__desc">{t(desc)}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="prose prose--tight">{t('growth.priming')}</p>
          <p className="note">{t('growth.note')}</p>
        </div>
      </div>
    </section>
  )
}
