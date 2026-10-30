import * as THREE from 'three'
import { buildTargets } from './targets'
import { BG_FRAG, BG_VERT, PARTICLE_FRAG, PARTICLE_VERT, PHOTO_FRAG, PHOTO_VERT } from './shaders'
import { store, loader } from '../lib/store'
import { DPR_CAP, PARTICLES, type Quality } from '../lib/quality'

const FOV = 40
const CAM_Z = 12
const PHOTO_W = 4.9
const PHOTO_H = (PHOTO_W * 780) / 840

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

export interface HeroSceneOptions {
  quality: Quality
  cutoutUrl: string
  depthUrl: string
  onFail: (reason: string) => void
}

/**
 * Satu kanvas WebGL tetap di belakang seluruh halaman:
 *  - latar gradien hijau
 *  - foto semi-3D (peta kedalaman + paralaks + cahaya lembut) yang menoleh mengikuti kursor
 *  - ribuan partikel: awan biji -> tumbuhan -> spiral filotaksis -> penyebaran biji
 * Tahap ditentukan oleh posisi gulir (store.stage).
 */
export class HeroScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60)
  private canvas: HTMLCanvasElement
  private opts: HeroSceneOptions

  private bgMat!: THREE.ShaderMaterial
  private particleMat!: THREE.ShaderMaterial
  private photoMat!: THREE.ShaderMaterial
  private photo!: THREE.Mesh
  private points!: THREE.Points
  private geometry!: THREE.BufferGeometry
  private textures: THREE.Texture[] = []

  private raf = 0
  private running = false
  private disposed = false
  private firstFrame = false
  private t0 = performance.now()
  private last = performance.now()

  private intro = 0
  private introTarget = 0.12
  private sm = { stage: 0, mx: 0, my: 0, wx: 0, wy: 0, mouseOn: 0 }

  private vw = 15
  private vh = 8.7
  private fit = 1
  private portrait = false
  private plantX = 0
  private quality: Quality
  private total = 0
  private ema = 16
  private slow = 0

  constructor(canvas: HTMLCanvasElement, opts: HeroSceneOptions) {
    this.canvas = canvas
    this.opts = opts
    this.quality = opts.quality
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x0a1f13, 1)
    this.camera.position.set(0, 0, CAM_Z)

    canvas.addEventListener('webglcontextlost', this.onContextLost)
  }

  private onContextLost = (e: Event) => {
    e.preventDefault()
    this.stop()
    this.opts.onFail('Konteks WebGL hilang')
  }

  /** Memuat tekstur, membangun objek, lalu merender frame pertama. */
  async init() {
    const loadTex = (url: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(
          url,
          (tex) => {
            loader.tick()
            resolve(tex)
          },
          undefined,
          () => reject(new Error(`Gagal memuat ${url}`)),
        )
      })
    const [map, depth] = await Promise.all([loadTex(this.opts.cutoutUrl), loadTex(this.opts.depthUrl)])
    if (this.disposed) return
    for (const t of [map, depth]) {
      t.minFilter = THREE.LinearFilter
      t.magFilter = THREE.LinearFilter
      t.generateMipmaps = false
      t.anisotropy = 4
    }
    this.textures.push(map, depth)

    this.buildBackground()
    this.buildPhoto(map, depth)
    this.buildParticles()
    this.resize()
    this.render(performance.now())
    this.firstFrame = true
    loader.tick()
  }

  private buildBackground() {
    this.bgMat = new THREE.ShaderMaterial({
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      uniforms: {
        uGlow: { value: 0 },
        uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: 1.6 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMat)
    bg.frustumCulled = false
    bg.renderOrder = -10
    this.scene.add(bg)
  }

  private buildPhoto(map: THREE.Texture, depth: THREE.Texture) {
    this.photoMat = new THREE.ShaderMaterial({
      vertexShader: PHOTO_VERT,
      fragmentShader: PHOTO_FRAG,
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: map },
        uDepth: { value: depth },
        uDepthAmt: { value: 0.55 },
        uMouse: { value: new THREE.Vector2() },
        uTexel: { value: new THREE.Vector2(1 / 840, 1 / 780) },
        uDissolve: { value: 0 },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
    })
    this.photo = new THREE.Mesh(new THREE.PlaneGeometry(PHOTO_W, PHOTO_H, 84, 78), this.photoMat)
    this.photo.renderOrder = 0
    this.photo.frustumCulled = false
    this.scene.add(this.photo)
  }

  private buildParticles() {
    const n = PARTICLES[this.quality]
    this.total = n
    const tg = buildTargets(n)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(tg.cloud, 3))
    g.setAttribute('aPlant', new THREE.BufferAttribute(tg.plant, 3))
    g.setAttribute('aSpiral', new THREE.BufferAttribute(tg.spiral, 3))
    g.setAttribute('aCalm', new THREE.BufferAttribute(tg.calm, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(tg.rand, 4))
    g.setAttribute('aT', new THREE.BufferAttribute(tg.t, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(tg.color, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(tg.size, 1))
    this.geometry = g

    this.particleMat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uGrow: { value: 0 },
        uSpiral: { value: 0 },
        uCalm: { value: 0 },
        uIntro: { value: 0 },
        uScale: { value: 1 },
        uSizeK: { value: 1000 },
        uMouseOn: { value: 0 },
        uAlpha: { value: 1 },
        uOffset: { value: new THREE.Vector3() },
        uMouse: { value: new THREE.Vector2(99, 99) },
      },
    })
    this.points = new THREE.Points(g, this.particleMat)
    this.points.frustumCulled = false
    this.points.renderOrder = 1
    this.scene.add(this.points)
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP[this.quality]))
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()

    const tanHalf = Math.tan((FOV * Math.PI) / 360)
    this.vh = 2 * CAM_Z * tanHalf
    this.vw = this.vh * this.camera.aspect
    this.portrait = this.camera.aspect < 0.9
    this.fit = Math.min(1, Math.max(0.45, (this.vw * 0.92) / 5.6))
    this.plantX = this.camera.aspect > 1.15 ? this.vw * 0.2 : 0

    if (this.particleMat) {
      this.particleMat.uniforms.uSizeK.value = this.renderer.domElement.height / (2 * tanHalf)
    }
    if (this.bgMat) this.bgMat.uniforms.uAspect.value = this.camera.aspect
  }

  start() {
    if (this.running || this.disposed) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  /** Dipanggil App ketika semua aset siap: partikel mulai berkumpul dan foto muncul. */
  startIntro() {
    this.introTarget = 1
  }

  /** Progres pemuatan menggerakkan sedikit biji yang melayang di belakang preloader. */
  setLoadProgress(p: number) {
    if (this.introTarget < 1) this.introTarget = 0.12 + 0.3 * p
  }

  private frame = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    this.render(now)
  }

  private render(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    const time = (now - this.t0) / 1000

    this.adapt(dt)

    // ---- tahap gulir ----
    this.sm.stage += (store.stage - this.sm.stage) * (1 - Math.exp(-dt * 5))
    this.intro += (this.introTarget - this.intro) * (1 - Math.exp(-dt * 1.7))
    const s = this.sm.stage
    const grow = smooth(s / 2)
    const spiral = clamp01((s - 2.5) / 0.5)
    const calm = clamp01((s - 3.5) / 0.5)
    store.grow = grow
    store.spiral = spiral
    store.calm = calm

    // ---- kursor ----
    const m = store.mouse
    let tx = m.x
    let ty = m.y
    const idle = !m.active || now - m.last > 3000
    if (idle) {
      tx = Math.sin(time * 0.5) * 0.45
      ty = Math.cos(time * 0.37) * 0.25
    }
    const k = 1 - Math.exp(-dt * 4)
    this.sm.mx += (tx - this.sm.mx) * k
    this.sm.my += (ty - this.sm.my) * k
    this.sm.mouseOn += ((idle ? 0 : 1) - this.sm.mouseOn) * (1 - Math.exp(-dt * 3))
    // posisi kursor di dunia 3D (bidang z = 0)
    this.sm.wx = m.x * (this.vw / 2)
    this.sm.wy = m.y * (this.vh / 2)

    // ---- foto ----
    const dissolve = smooth(s / 0.6)
    const photoOpacity = smooth((this.intro - 0.35) / 0.55)
    const heroY = this.portrait ? 1.35 : 0.35
    this.photo.visible = dissolve < 0.999 && photoOpacity > 0.001
    this.photo.position.set(this.sm.mx * 0.1 * this.fit, heroY + this.sm.my * 0.05, 0)
    // menoleh mengikuti kursor, dibatasi sekitar 15 derajat supaya wajah tidak melar
    this.photo.rotation.set(-this.sm.my * 0.16, this.sm.mx * 0.26, -this.sm.mx * 0.02)
    this.photo.scale.setScalar(this.fit * (1 + dissolve * 0.05))
    const pu = this.photoMat.uniforms
    pu.uMouse.value.set(this.sm.mx, this.sm.my)
    pu.uDissolve.value = dissolve
    pu.uOpacity.value = photoOpacity
    pu.uTime.value = time

    // ---- partikel ----
    const move = smooth(s / 1.2)
    const u = this.particleMat.uniforms
    u.uTime.value = time
    u.uGrow.value = grow
    u.uSpiral.value = spiral
    u.uCalm.value = calm
    u.uIntro.value = this.intro
    u.uScale.value = this.fit
    u.uMouseOn.value = this.sm.mouseOn
    u.uMouse.value.set(this.sm.wx, this.sm.wy)
    u.uOffset.value.set(this.plantX * move * (1 - calm), heroY * (1 - move), 0)
    u.uAlpha.value = this.portrait ? 1 - 0.45 * move : 1

    // ---- latar ----
    const bu = this.bgMat.uniforms
    bu.uGlow.value = grow
    bu.uCenter.value.set(0.5 + (this.plantX * move * (1 - calm)) / this.vw, 0.5 + (heroY * (1 - move)) / this.vh)

    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Penyesuaian kualitas otomatis: bila frame rata-rata lebih lambat dari ~30 fps
   * selama beberapa detik, turunkan jumlah partikel yang digambar lalu resolusi.
   */
  private adapt(dt: number) {
    if (!this.firstFrame || dt <= 0) return
    this.ema += (dt * 1000 - this.ema) * 0.05
    if (this.ema > 36) this.slow++
    else this.slow = Math.max(0, this.slow - 2)
    if (this.slow > 90) {
      this.slow = 0
      const drawn = this.geometry.drawRange.count
      const current = Number.isFinite(drawn) ? drawn : this.total
      if (current > this.total * 0.45) {
        this.geometry.setDrawRange(0, Math.floor(current * 0.7))
      } else if (this.quality !== 'low') {
        this.quality = 'low'
        this.resize()
      }
      this.ema = 16
    }
  }

  dispose() {
    this.disposed = true
    this.stop()
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.geometry?.dispose()
    this.particleMat?.dispose()
    this.photoMat?.dispose()
    this.bgMat?.dispose()
    this.photo?.geometry.dispose()
    this.textures.forEach((t) => t.dispose())
    this.renderer.dispose()
  }
}
