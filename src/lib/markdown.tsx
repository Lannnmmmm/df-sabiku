import { Fragment, type ReactNode } from 'react'

/** Markdown mini: paragraf, daftar, judul ##, **tebal**, *miring*, dan [tautan](url). Aman: tanpa HTML mentah. */

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<strong key={key++}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('*')) out.push(<em key={key++}>{tok.slice(1, -1)}</em>)
    else {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (mm && /^(https?:|mailto:|\.\/|\/|#)/.test(mm[2])) {
        out.push(
          <a key={key++} href={mm[2]} target={mm[2].startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
            {mm[1]}
          </a>,
        )
      } else out.push(tok)
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        if (lines.every((l) => /^[-*]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          )
        }
        const h = b.match(/^#{1,3}\s+(.*)$/)
        if (h && lines.length === 1) return <h3 key={i}>{inline(h[1])}</h3>
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </>
  )
}
