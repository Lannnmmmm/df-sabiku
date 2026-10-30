import { useI18n } from '../lib/i18n'
import { pickList, profile } from '../lib/content'

export function About() {
  const { t, pick, lang } = useI18n()
  const bio = pickList(profile.bio, lang)
  return (
    <section id="about" className="section" data-stage="1" aria-labelledby="about-title">
      <div className="section__inner">
        <div className="col">
          <h2 id="about-title" className="section__title">
            {t('about.title')}
          </h2>
          <div className="prose">
            {bio.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <h3 className="subhead">{t('about.education')}</h3>
          <ol className="edu">
            {profile.education.map((e) => (
              <li key={e.level + e.year} className="edu__row">
                <span className="edu__year">{e.year}</span>
                <span className="edu__text">
                  <span className="edu__inst">{e.institution}</span>
                  <span className="edu__prog">
                    {e.level}, {pick(e.program)}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <dl className="facts">
            <div>
              <dt>{t('hero.position')}</dt>
              <dd>{pick(profile.position)}</dd>
            </div>
            <div>
              <dt>{t('about.facts')}</dt>
              <dd>{t('about.employment')}</dd>
            </div>
          </dl>
          <p className="note">
            {profile.links.pddikti ? (
              <a href={profile.links.pddikti} target="_blank" rel="noopener noreferrer">
                {t('about.source')}
              </a>
            ) : (
              t('about.source')
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
