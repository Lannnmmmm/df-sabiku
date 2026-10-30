/**
 * Menghasilkan posisi tujuan untuk setiap partikel:
 *   cloud  - awan biji yang melingkari foto (hero)
 *   plant  - tumbuhan: biji, akar, batang, daun, kuncup
 *   spiral - pola filotaksis (spiral emas) seperti kepala bunga matahari
 *   calm   - biji tersebar, untuk penutup
 * Semua berbasis angka acak berbenih tetap, jadi bentuknya selalu sama.
 */

export interface Targets {
  cloud: Float32Array
  plant: Float32Array
  spiral: Float32Array
  calm: Float32Array
  /** Urutan tumbuh 0..1: partikel dengan nilai kecil bergabung ke tumbuhan lebih dulu. */
  t: Float32Array
  rand: Float32Array
  color: Float32Array
  size: Float32Array
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
]

const C = {
  leaf: hex('#2ECC71'),
  leafDeep: hex('#27AE60'),
  leafSoft: hex('#7DCEA0'),
  mint: hex('#A8E6CF'),
  stem: hex('#4FC283'),
  root: hex('#BFD9B0'),
  seed: hex('#E8E0C8'),
  blush: hex('#F2C6C2'),
}

const mix = (a: number[], b: number[], k: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
]

const BASE_Y = -3.0
const TOP_Y = 2.9

function stemPoint(u: number): [number, number, number] {
  return [
    0.28 * Math.sin(u * 3.4) + 0.05 * u,
    BASE_Y + (TOP_Y - BASE_Y) * u,
    0.15 * Math.sin(u * 2.1 + 1),
  ]
}

interface Leaf {
  u: number
  phi: number
  L: number
  w: number
  e: number
  droop: number
  weight: number
}

function makeLeaves(): Leaf[] {
  const K = 14
  const leaves: Leaf[] = []
  for (let k = 0; k < K; k++) {
    const u = 0.13 + 0.8 * Math.pow(k / (K - 1), 0.9)
    const cotyledon = k < 2
    const L = cotyledon ? 0.95 : 0.55 + 2.1 * Math.pow(1 - u, 0.7)
    leaves.push({
      u,
      phi: k === 0 ? 0 : k === 1 ? Math.PI : k * 2.399963,
      L,
      w: L * 0.4,
      e: cotyledon ? 0.55 : 0.3 + 0.85 * u,
      droop: cotyledon ? 0.15 : 0.5 * (1 - u),
      weight: L * L * 0.4,
    })
  }
  return leaves
}

function leafPoint(l: Leaf, uu: number, vv: number): [number, number, number] {
  const [sx, sy, sz] = stemPoint(l.u)
  const dx = Math.cos(l.phi) * Math.cos(l.e)
  const dy = Math.sin(l.e)
  const dz = Math.sin(l.phi) * Math.cos(l.e)
  let nx = -dz
  let nz = dx
  const nl = Math.hypot(nx, nz) || 1
  nx /= nl
  nz /= nl
  const prof = Math.pow(Math.sin(Math.PI * Math.pow(uu, 0.75)), 0.9)
  const half = l.w * prof * vv
  const droop = l.droop * l.L * uu * uu
  const fold = Math.abs(vv) * 0.18 * l.w * prof
  return [sx + dx * l.L * uu + nx * half, sy + dy * l.L * uu - droop + fold, sz + dz * l.L * uu + nz * half]
}

export function buildTargets(n: number): Targets {
  const R = rng(20261030)
  const cloud = new Float32Array(n * 3)
  const plant = new Float32Array(n * 3)
  const spiral = new Float32Array(n * 3)
  const calm = new Float32Array(n * 3)
  const t = new Float32Array(n)
  const rand = new Float32Array(n * 4)
  const color = new Float32Array(n * 3)
  const size = new Float32Array(n)

  const leaves = makeLeaves()
  const leafTotal = leaves.reduce((s, l) => s + l.weight, 0)

  // pembagian jumlah partikel per bagian tumbuhan
  const nSeed = Math.floor(n * 0.03)
  const nRoot = Math.floor(n * 0.09)
  const nStem = Math.floor(n * 0.15)
  const nCrown = Math.floor(n * 0.04)
  const nLeaf = n - nSeed - nRoot - nStem - nCrown

  const leafCounts = leaves.map((l) => Math.floor((l.weight / leafTotal) * nLeaf))
  leafCounts[leafCounts.length - 1] += nLeaf - leafCounts.reduce((a, b) => a + b, 0)

  let i = 0
  const put = (
    p: [number, number, number],
    tt: number,
    col: [number, number, number],
    sz: number,
  ) => {
    plant[i * 3] = p[0]
    plant[i * 3 + 1] = p[1]
    plant[i * 3 + 2] = p[2]
    t[i] = tt
    color[i * 3] = col[0]
    color[i * 3 + 1] = col[1]
    color[i * 3 + 2] = col[2]
    size[i] = sz
    i++
  }

  // 1. cangkang biji
  for (let k = 0; k < nSeed; k++) {
    const th = R() * Math.PI * 2
    const ph = Math.acos(2 * R() - 1)
    const rr = 0.9 + 0.1 * R()
    put(
      [0.34 * rr * Math.sin(ph) * Math.cos(th), BASE_Y + 0.2 * rr * Math.sin(ph) * Math.sin(th) * 0.8, 0.2 * rr * Math.cos(ph)],
      0.04 * R(),
      mix(C.seed, C.blush, R() * 0.25),
      0.05 + 0.03 * R(),
    )
  }

  // 2. akar: radikula utama dan akar lateral
  for (let k = 0; k < nRoot; k++) {
    const s = R()
    let p: [number, number, number]
    if (R() < 0.45) {
      p = [0.1 * s * s + (R() - 0.5) * 0.05, BASE_Y - 0.12 - 0.85 * s, (R() - 0.5) * 0.05]
    } else {
      const m = Math.floor(R() * 5)
      const s0 = 0.25 + 0.12 * m
      const sx = 0.1 * s0 * s0
      const sy = BASE_Y - 0.12 - 0.85 * s0
      const side = m % 2 ? 1 : -1
      const ang = side * (0.7 + 0.25 * R())
      const len = (0.6 - 0.07 * m) * R()
      p = [
        sx + Math.sin(ang) * len + (R() - 0.5) * 0.04,
        sy - Math.cos(ang) * len * 0.7,
        (R() - 0.5) * 0.25 * len,
      ]
    }
    const depth = Math.min(1, Math.max(0, (BASE_Y - p[1]) / 1.0))
    put(p, 0.03 + 0.12 * depth, mix(C.root, C.mint, R() * 0.3), 0.03 + 0.025 * R())
  }

  // 3. batang
  for (let k = 0; k < nStem; k++) {
    const u = R()
    const [sx, sy, sz] = stemPoint(u)
    const a = R() * Math.PI * 2
    const r = (0.075 * (1 - u) + 0.03) * Math.sqrt(R())
    put([sx + Math.cos(a) * r, sy, sz + Math.sin(a) * r], 0.08 + 0.4 * u, mix(C.stem, C.leafSoft, R() * 0.4), 0.032 + 0.025 * R())
  }

  // 4. daun, dengan tulang tengah dan tulang lateral supaya bentuknya terbaca
  leaves.forEach((l, li) => {
    for (let k = 0; k < leafCounts[li]; k++) {
      const roll = R()
      let uu: number
      let vv: number
      let vein = false
      if (roll < 0.2) {
        uu = R()
        vv = (R() - 0.5) * 0.06
        vein = true
      } else if (roll < 0.38) {
        const m = 1 + Math.floor(R() * 5)
        const u0 = m / 7
        uu = u0 + R() * (1 - u0)
        vv = (R() < 0.5 ? -1 : 1) * Math.min(0.95, (uu - u0) * 1.3)
        vein = true
      } else {
        uu = R()
        vv = (R() * 2 - 1) * 0.98
      }
      const p = leafPoint(l, uu, vv)
      const col = vein ? mix(C.mint, C.leafSoft, R() * 0.5) : mix(C.leafDeep, C.leaf, R())
      put(p, 0.16 + 0.55 * l.u + 0.12 * uu, vein ? mix(col, C.mint, 0.25) : col, (vein ? 0.04 : 0.032) + 0.03 * R())
    }
  })

  // 5. kuncup di ujung
  const crown = stemPoint(1)
  for (let k = 0; k < nCrown; k++) {
    const th = R() * Math.PI * 2
    const ph = Math.acos(2 * R() - 1)
    const rr = 0.24 * Math.cbrt(R())
    put(
      [crown[0] + rr * Math.sin(ph) * Math.cos(th), crown[1] + 0.14 + rr * Math.cos(ph), crown[2] + rr * Math.sin(ph) * Math.sin(th)],
      0.9 + 0.1 * R(),
      mix(C.blush, C.seed, R() * 0.5),
      0.04 + 0.03 * R(),
    )
  }

  // kilau: sebagian kecil partikel berwarna krem atau merah muda lembut dan lebih besar
  for (let k = 0; k < n; k++) {
    if (R() < 0.06) {
      const c = R() < 0.35 ? C.blush : C.seed
      color[k * 3] = c[0]
      color[k * 3 + 1] = c[1]
      color[k * 3 + 2] = c[2]
      size[k] *= 1.6
    }
  }

  // awan hero: cincin elips di sekeliling foto. Di depan foto (z > -0.3) area wajah dikosongkan.
  for (let k = 0; k < n; k++) {
    const th = R() * Math.PI * 2
    const s = 1 + Math.pow(R(), 1.5) * 1.9
    const x = Math.cos(th) * 2.9 * s
    const y = Math.sin(th) * 2.6 * s + 0.1
    let z = (R() - 0.5) * 6
    if (Math.abs(x) < 2.6 && y > -2.2 && y < 2.7 && z > -0.3) z = -0.3 - R() * 2.6
    cloud[k * 3] = x
    cloud[k * 3 + 1] = y
    cloud[k * 3 + 2] = z
  }

  // spiral emas (filotaksis)
  const GOLD = 2.399963229728653
  const RS = 3.7
  const cos = Math.cos(-0.35)
  const sin = Math.sin(-0.35)
  for (let k = 0; k < n; k++) {
    const r = RS * Math.sqrt((k + 0.5) / n)
    const th = k * GOLD
    const x0 = r * Math.cos(th)
    const y0 = r * Math.sin(th) * 0.62
    spiral[k * 3] = x0 * cos - y0 * sin
    spiral[k * 3 + 1] = x0 * sin + y0 * cos
    spiral[k * 3 + 2] = -Math.pow(r / RS, 2) * 0.9 + Math.sin(r * 2.4) * 0.06
  }

  // penyebaran biji
  for (let k = 0; k < n; k++) {
    calm[k * 3] = (R() + R() + R() - 1.5) * 9
    calm[k * 3 + 1] = (R() + R() - 1) * 4.6
    calm[k * 3 + 2] = -5 + R() * 7
  }

  for (let k = 0; k < n * 4; k++) rand[k] = R()

  return { cloud, plant, spiral, calm, t, rand, color, size }
}
