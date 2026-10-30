import { useI18n } from '../lib/i18n'
import type { Item } from '../lib/content'
import { hasDetail, useModal } from './Modal'

/** Daftar baris: tahun, judul, jenis. Dipakai untuk penelitian dan publikasi. */
export function ItemRows({ items }: { items: Item[] }) {
  const { t, pick } = useI18n()
  const { showItem } = useModal()
  return (
    <ol className="rows">
      {items.map((it) => {
        const detail = hasDetail(it)
        const pdf = it.files.find((f) => f.kind === 'pdf')
        return (
          <li key={it.id} className="row">
            <span className="row__year">{it.year ?? ''}</span>
            <div className="row__main">
              <p className="row__title">{pick(it.title)}</p>
              {it.type && <p className="row__type">{it.type}</p>}
            </div>
            {(detail || pdf) && (
              <div className="row__actions">
                {pdf && (
                  <a className="btn btn--quiet" href={pdf.url} target="_blank" rel="noopener noreferrer">
                    PDF
                  </a>
                )}
                {detail && (
                  <button className="btn btn--quiet" onClick={() => showItem(it)}>
                    {t('modal.details')}
                  </button>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
