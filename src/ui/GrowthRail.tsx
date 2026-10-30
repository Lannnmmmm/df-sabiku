import { useEffect, useState } from 'react'
import { store } from '../lib/store'
import { useI18n, type StringKey } from '../lib/i18n'

/** Label tahap yang selalu cocok dengan apa yang sedang digambar di kanvas. */
export function GrowthRail() {
  const { t } = useI18n()
  const [key, setKey] = useState<StringKey>('rail.seed')

  useEffect(() => {
    let raf = 0
    let cur: StringKey = 'rail.seed'
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const { grow, spiral, calm } = store
      let k: StringKey
      if (calm > 0.5) k = 'rail.dispersal'
      else if (spiral > 0.5) k = 'rail.phyllotaxis'
      else if (grow < 0.05) k = 'rail.seed'
      else if (grow < 0.12) k = 'rail.imbibition'
      else if (grow < 0.22) k = 'rail.radicle'
      else if (grow < 0.45) k = 'rail.shoot'
      else if (grow < 0.8) k = 'rail.seedling'
      else k = 'rail.vegetative'
      if (k !== cur) {
        cur = k
        setKey(k)
      }
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="rail" aria-hidden="true">
      <span className="rail__label">{t(key)}</span>
    </div>
  )
}
