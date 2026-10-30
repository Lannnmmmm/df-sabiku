import { useI18n } from '../lib/i18n'
import { profile } from '../lib/content'

export function Hero({ staticPhoto }: { staticPhoto: boolean }) {
  const { t, pick } = useI18n()
  const [first, ...rest] = profile.name.split(' ')
  const surname = rest.join(' ')

  return (
    <section id="top" className="hero" data-stage="0" aria-labelledby="hero-name">
      {staticPhoto && (
        <img className="hero__photo" src="./images/dewi-cutout.webp" alt={`Foto ${profile.name}`} width="840" height="780" />
      )}
      <div className="hero__inner">
        <h1 id="hero-name" className="hero__name">
          <span className="hero__line">{first}</span>
          <span className="hero__line">
            {surname}
            <span className="hero__degrees">{profile.degrees}</span>
          </span>
        </h1>
        <div className="hero__meta">
          <p className="hero__role">{pick(profile.role)}</p>
          <p className="hero__aff">
            {pick(profile.program)}
            <br />
            {profile.institution}
          </p>
          <p className="hero__tagline">{pick(profile.tagline)}</p>
        </div>
      </div>
      <p className="hero__scroll">{t('hero.scroll')}</p>
    </section>
  )
}
