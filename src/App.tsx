import { useCallback, useEffect, useRef, useState } from 'react'
import { I18nProvider } from './lib/i18n'
import { detectQuality, prefersReducedMotion, webglSupported } from './lib/quality'
import { loader, store } from './lib/store'
import { setPageMode, startScrollTracking } from './lib/scroll'
import { usePageMode } from './lib/pages'
import { startPager } from './lib/pager'
import type { HeroScene } from './gl/HeroScene'
import { ModalProvider } from './ui/Modal'
import { Preloader } from './ui/Preloader'
import { Stage } from './ui/Stage'
import { StaticBackdrop } from './ui/StaticBackdrop'
import { Nav } from './ui/Nav'
import { GrowthRail } from './ui/GrowthRail'
import { PageDots } from './ui/PageDots'
import { Hero } from './ui/Hero'
import { About } from './ui/About'
import { Research } from './ui/Research'
import { Growth } from './ui/Growth'
import { Publications } from './ui/Publications'
import { Outreach } from './ui/Outreach'
import { Gallery } from './ui/Gallery'
import { Contact } from './ui/Contact'
import { Footer } from './ui/Footer'

type Mode = 'webgl' | 'static'

function decideMode(): Mode {
  if (new URLSearchParams(location.search).has('static')) return 'static'
  return webglSupported() && !prefersReducedMotion() ? 'webgl' : 'static'
}

function useMedia(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    on()
    return () => mq.removeEventListener('change', on)
  }, [query])
  return m
}

export default function App() {
  const [mode, setMode] = useState<Mode>(decideMode)
  const [quality] = useState(detectQuality)
  const [loading, setLoading] = useState(mode === 'webgl')
  const sceneRef = useRef<HeroScene | null>(null)
  const wide = useMedia('(min-width: 1024px)')
  const pages = usePageMode()

  // gulir dan kursor
  useEffect(() => {
    const stop = startScrollTracking()
    const onMove = (e: PointerEvent) => {
      store.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      store.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
      store.mouse.active = true
      store.mouse.last = performance.now()
    }
    const onLeave = () => (store.mouse.active = false)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      stop()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  // mode satu halaman: CSS membaca atribut ini, dan jangkar tahap pertumbuhan diukur ulang
  useEffect(() => {
    document.documentElement.dataset.pages = pages ? 'on' : 'off'
    setPageMode(pages)
    const stopPager = pages ? startPager() : undefined
    return () => {
      stopPager?.()
      delete document.documentElement.dataset.pages
    }
  }, [pages])

  // font termasuk langkah pemuatan, tapi tidak ditunggu lebih dari 2,5 detik
  useEffect(() => {
    if (mode !== 'webgl') return
    const fonts = document.fonts?.ready ?? Promise.resolve()
    Promise.race([fonts, new Promise((r) => window.setTimeout(r, 2500))]).then(() => loader.tick())
  }, [mode])

  // progres pemuatan menggerakkan biji di belakang preloader
  useEffect(() => loader.subscribe((p) => sceneRef.current?.setLoadProgress(p)), [])

  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', loading)
  }, [loading])

  const onFail = useCallback((reason: string) => {
    console.warn('[WebGL] dimatikan:', reason)
    setMode('static')
    setLoading(false)
  }, [])

  const onScene = useCallback((s: HeroScene) => {
    sceneRef.current = s
    s.setLoadProgress(loader.progress)
  }, [])

  return (
    <I18nProvider>
      <ModalProvider>
        <a className="skip" href="#about">
          Lewati ke konten
        </a>
        {mode === 'webgl' ? <Stage quality={quality} onScene={onScene} onFail={onFail} /> : <StaticBackdrop />}
        {loading && (
          <Preloader onReveal={() => sceneRef.current?.startIntro()} onDone={() => setLoading(false)} />
        )}
        <Nav />
        {mode === 'webgl' && wide && <GrowthRail />}
        {pages && <PageDots />}
        <main id="main">
          <Hero staticPhoto={mode === 'static'} />
          <About />
          <Research orbit={mode === 'webgl' && wide} />
          <Growth />
          <Publications />
          <Outreach />
          <Gallery />
          <Contact />
        </main>
        <Footer />
      </ModalProvider>
    </I18nProvider>
  )
}
