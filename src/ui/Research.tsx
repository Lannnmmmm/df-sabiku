import { useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'
import { itemsOf, profile } from '../lib/content'
import { store } from '../lib/store'
import { RelatedList, useModal } from './Modal'
import { ItemRows } from './ItemRows'

export function Research({ orbit }: { orbit: boolean }) {
  const { t, pick } = useI18n()
  const { show } = useModal()
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const paused = useRef(false)
  const focus = profile.researchFocus
  const recorded = itemsOf('penelitian')

  // Kartu kaca mengorbit di sekitar tumbuhan (yang berada sekitar 70% lebar layar).
  useEffect(() => {
    if (!orbit) return
    let raf = 0
    let angle = 0
    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const stage = stageRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      if (rect.bottom < -300 || rect.top > window.innerHeight + 300) return
      if (!paused.current) angle += dt * 0.07
      const cx = window.innerWidth * 0.7 - rect.left
      const cy = rect.height / 2
      const rx = Math.min(window.innerWidth * 0.19, 300)
      const ry = Math.min(rect.height * 0.34, 190)
      const n = focus.length
      const spin = angle + store.scrollY * 0.0009
      cardRefs.current.forEach((el, i) => {
        if (!el) return
        const a = spin + (i / n) * Math.PI * 2
        const depth = (Math.sin(a) + 1) / 2
        const x = cx + Math.cos(a) * rx
        const y = cy + Math.sin(a) * ry * 0.85
        const sc = 0.8 + 0.2 * depth
        el.style.transform = `translate3d(${x - el.offsetWidth / 2}px, ${y - el.offsetHeight / 2}px, 0) scale(${sc})`
        el.style.opacity = String(0.5 + 0.5 * depth)
        el.style.zIndex = String(Math.round(depth * 10))
        el.style.filter = depth < 0.3 ? `blur(${((0.3 - depth) * 4).toFixed(2)}px)` : 'none'
      })
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [orbit, focus.length])

  const card = (i: number) => {
    const f = focus[i]
    const refs = f.refs || []
    return (
      <button
        key={i}
        ref={(el) => {
          cardRefs.current[i] = el
        }}
        className="glass focus"
        onClick={() => show(pick(f.title), <RelatedList refs={refs} />)}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
      >
        <span className="focus__title">{pick(f.title)}</span>
        <span className="focus__text">{pick(f.text)}</span>
        <span className="focus__count">
          {refs.length} {t('research.related')}
        </span>
      </button>
    )
  }

  return (
    <section id="research" className="section section--research" data-stage="2" aria-labelledby="research-title">
      <div className="section__inner">
        <div className="col">
          <h2 id="research-title" className="section__title">
            {t('research.title')}
          </h2>
          <p className="lead">{t('research.intro')}</p>
        </div>

        {orbit ? (
          <div ref={stageRef} className="orbit">
            {focus.map((_, i) => card(i))}
          </div>
        ) : (
          <div className="focus-grid">{focus.map((_, i) => card(i))}</div>
        )}

        <div className="col col--wide">
          <h3 className="subhead">{t('research.recorded')}</h3>
          {recorded.length ? <ItemRows items={recorded} /> : <p className="note">{t('research.none')}</p>}
        </div>
      </div>
    </section>
  )
}
