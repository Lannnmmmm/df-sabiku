import { useState, type FormEvent } from 'react'
import { useI18n } from '../lib/i18n'
import { cv, profile } from '../lib/content'

const PROFILE_LABELS: Record<string, string> = {
  scholar: 'Google Scholar',
  sinta: 'SINTA',
  scopus: 'Scopus',
  orcid: 'ORCID',
  researchgate: 'ResearchGate',
  pddikti: 'PDDikti',
  institution: 'Politeknik Negeri Jember',
}

export function Contact() {
  const { t } = useI18n()
  const links = profile.links
  const email = links.email
  const endpoint = profile.contactFormEndpoint
  const profiles = Object.keys(PROFILE_LABELS).filter((k) => links[k])
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!endpoint) return
    setStatus('sending')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(e.currentTarget),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('ok')
      e.currentTarget.reset()
    } catch {
      setStatus('fail')
    }
  }

  return (
    <section id="contact" className="section section--contact" data-stage="4" aria-labelledby="contact-title">
      <div className="section__inner">
        <div className="col">
          <h2 id="contact-title" className="section__title">
            {t('contact.title')}
          </h2>
          <p className="lead">{t('contact.intro')}</p>

          <div className="contact__actions">
            {email && (
              <a className="btn btn--primary" href={`mailto:${email}`}>
                {t('contact.email')}
              </a>
            )}
            {cv && (
              <a className="btn" href={cv.url} target="_blank" rel="noopener noreferrer">
                {t('contact.cv')}
              </a>
            )}
          </div>
          {!email && !endpoint && <p className="note">{t('contact.soon')}</p>}

          {endpoint && (
            <form className="form" onSubmit={submit}>
              <label>
                {t('form.name')}
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                {t('form.email')}
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label>
                {t('form.message')}
                <textarea name="message" rows={5} required />
              </label>
              <button className="btn btn--primary" disabled={status === 'sending'}>
                {status === 'sending' ? t('form.sending') : t('form.send')}
              </button>
              {status === 'ok' && <p role="status">{t('form.ok')}</p>}
              {status === 'fail' && <p role="alert">{t('form.fail')}</p>}
            </form>
          )}

          {profiles.length > 0 && (
            <>
              <h3 className="subhead">{t('contact.profiles')}</h3>
              <ul className="plinks">
                {profiles.map((k) => (
                  <li key={k}>
                    <a href={links[k]} target="_blank" rel="noopener noreferrer">
                      {PROFILE_LABELS[k]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {profile.address && (
            <>
              <h3 className="subhead">{t('contact.address')}</h3>
              <address className="address">{profile.address}</address>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
