import { useI18n } from '../lib/i18n'
import { profile } from '../lib/content'

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="footer">
      <p>
        {profile.name}, {profile.degrees}
      </p>
      <p>{t('footer.data')}</p>
      <p>{t('footer.built')}</p>
    </footer>
  )
}
