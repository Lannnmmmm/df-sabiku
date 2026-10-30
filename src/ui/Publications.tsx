import { useMemo, useState } from 'react'
import { useI18n, type StringKey } from '../lib/i18n'
import { itemsOf, pubGroup, type PubGroup } from '../lib/content'
import { ItemRows } from './ItemRows'

const GROUPS: PubGroup[] = ['jurnal', 'prosiding', 'buku', 'hki', 'lain']

export function Publications() {
  const { t } = useI18n()
  const all = useMemo(() => itemsOf('publikasi'), [])
  const [filter, setFilter] = useState<PubGroup | 'all'>('all')

  const present = GROUPS.filter((g) => all.some((i) => pubGroup(i.type) === g))
  const shown = filter === 'all' ? all : all.filter((i) => pubGroup(i.type) === filter)

  return (
    <section id="publications" className="section" data-stage="3" aria-labelledby="pub-title">
      <div className="section__inner">
        <div className="sheet">
          <h2 id="pub-title" className="section__title">
            {t('pub.title')}
          </h2>
          <p className="lead">
            {all.length} {t('pub.count')}
          </p>
          {present.length > 1 && (
            <div className="chips" role="group" aria-label={t('pub.title')}>
              <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                {t('pub.all')}
              </button>
              {present.map((g) => (
                <button key={g} className="chip" aria-pressed={filter === g} onClick={() => setFilter(g)}>
                  {t(`pub.${g}` as StringKey)}
                </button>
              ))}
            </div>
          )}
          <ItemRows items={shown} />
          <p className="note">{t('pub.source')}</p>
        </div>
      </div>
    </section>
  )
}
