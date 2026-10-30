import { useEffect, useRef, useState } from 'react'
import { loader } from '../lib/store'
import { useI18n } from '../lib/i18n'

interface Props {
  /** Dipanggil saat hitungan mencapai 100%: scene mulai mengumpulkan partikel. */
  onReveal: () => void
  /** Dipanggil setelah overlay selesai memudar. */
  onDone: () => void
}

/** Hitungan 0-100% mengikuti progres pemuatan aset yang sebenarnya, dengan waktu tampil minimum singkat. */
export function Preloader({ onReveal, onDone }: Props) {
  const { t } = useI18n()
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const target = useRef(loader.progress)
  const cb = useRef({ onReveal, onDone })
  cb.current = { onReveal, onDone }

  useEffect(() => loader.subscribe((p) => (target.current = p)), [])

  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    let v = 0
    let revealed = false
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const elapsed = now - t0
      // tidak lebih cepat dari 1,1 detik, dan tidak menunggu lebih dari 9 detik
      const real = target.current >= 1 || elapsed > 9000 ? 1 : target.current * 0.94
      const goal = Math.min(real, elapsed / 1100)
      v += (goal - v) * 0.12
      setShown(Math.min(100, Math.round(v * 100)))
      if (!revealed && v > 0.995) {
        revealed = true
        setShown(100)
        setLeaving(true)
        cb.current.onReveal()
        window.setTimeout(() => cb.current.onDone(), 950)
        cancelAnimationFrame(raf)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={`preloader${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <div className="preloader__count" aria-hidden="true">
        {shown}
        <span className="preloader__pct">%</span>
      </div>
      <p className="preloader__label">{t('preload.label')}</p>
      <div className="preloader__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${shown / 100})` }} />
      </div>
    </div>
  )
}
