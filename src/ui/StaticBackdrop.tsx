import { useMemo } from 'react'

/** Pengganti WebGL: pola filotaksis statis untuk perangkat tanpa WebGL atau yang meminta gerak dikurangi. */
export function StaticBackdrop() {
  const dots = useMemo(() => {
    const out: { x: number; y: number; r: number }[] = []
    const N = 700
    for (let i = 0; i < N; i++) {
      const r = 46 * Math.sqrt((i + 0.5) / N)
      const th = i * 2.399963
      out.push({ x: 50 + r * Math.cos(th), y: 50 + r * Math.sin(th), r: 0.35 + 0.5 * (i / N) })
    }
    return out
  }, [])
  return (
    <svg className="backdrop" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} />
      ))}
    </svg>
  )
}
