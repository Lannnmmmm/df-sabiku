import { useEffect, useRef } from 'react'
import { HeroScene } from '../gl/HeroScene'
import type { Quality } from '../lib/quality'

interface Props {
  quality: Quality
  onScene: (scene: HeroScene) => void
  onFail: (reason: string) => void
}

/** Kanvas WebGL tetap di belakang halaman. Seluruh logika ada di gl/HeroScene.ts. */
export function Stage({ quality, onScene, onFail }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const cb = useRef({ onScene, onFail })
  cb.current = { onScene, onFail }

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let dead = false
    let scene: HeroScene
    try {
      scene = new HeroScene(canvas, {
        quality,
        cutoutUrl: './images/dewi-cutout.webp',
        depthUrl: './images/dewi-depth.webp',
        onFail: (r) => cb.current.onFail(r),
      })
    } catch (e) {
      cb.current.onFail(String(e))
      return
    }
    scene
      .init()
      .then(() => {
        if (dead) return
        scene.start()
        cb.current.onScene(scene)
      })
      .catch((e) => {
        if (!dead) cb.current.onFail(String(e))
      })

    const onResize = () => scene.resize()
    const onVisibility = () => (document.hidden ? scene.stop() : scene.start())
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      dead = true
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      scene.dispose()
    }
  }, [quality])

  return <canvas ref={ref} className="stage" aria-hidden="true" />
}
