import { useMemo, useState } from 'react'
import { useI18n, type StringKey } from '../lib/i18n'
import { itemsOf, pubGroup, type PubGroup } from '../lib/content'
import { usePageMode } from '../lib/pages'
import { ItemRows } from './ItemRows'

const PER_PAGE = 4
const GROUPS: PubGroup[] = ['jurnal', 'prosiding', 'buku', 'hki', 'lain']

export function Publications() {
  const { t } = useI18n()
  const all = useMemo(() => itemsOf('publikasi'), [])
  const [filter, setFilter] = useState<PubGroup | 'all'>('all')
  const [page, setPage] = useState(0)
  const paged = usePageMode()

  const present = GROUPS.filter((g) => all.some((i) => pubGroup(i.type) === g))
  const matching = filter === 'all' ? all : all.filter((i) => pubGroup(i.type) === filter)
  // pada mode satu halaman daftar dipecah per 4 karya supaya muat dalam satu layar
  const pageCount = paged ? Math.max(1, Math.ceil(matching.length / PER_PAGE)) : 1
  const cur = Math.min(page, pageCount - 1)
  const shown = paged ? matching.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE) : matching
  const pick = (f: PubGroup | 'all') => {
    setFilter(f)
    setPage(0)
  }

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
              <button className="chip" aria-pressed={filter === 'all'} onClick={() => pick('all')}>
                {t('pub.all')}
              </button>
              {present.map((g) => (
                <button key={g} className="chip" aria-pressed={filter === g} onClick={() => pick(g)}>
                  {t(`pub.${g}` as StringKey)}
                </button>
              ))}
            </div>
          )}
          <ItemRows items={shown} />
          {pageCount > 1 && (
            <div className="pager" role="group" aria-label={t('pub.page')}>
              <button className="btn btn--quiet" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
                {t('pub.prev')}
              </button>
              <span className="pager__n" aria-live="polite">
                {t('pub.page')} {cur + 1} / {pageCount}
              </span>
              <button className="btn btn--quiet" disabled={cur >= pageCount - 1} onClick={() => setPage(cur + 1)}>
                {t('pub.next')}
              </button>
            </div>
          )}
          <p className="note">{t('pub.source')}</p>
        </div>
      </div>
    </section>
  )
}
