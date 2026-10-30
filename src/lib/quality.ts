export type Quality = 'high' | 'medium' | 'low'

export const PARTICLES: Record<Quality, number> = { high: 32000, medium: 16000, low: 7000 }
export const DPR_CAP: Record<Quality, number> = { high: 2, medium: 1.5, low: 1 }

/** Pilih tingkat kualitas dari kemampuan perangkat. Bisa dipaksa dengan ?quality=low|medium|high. */
export function detectQuality(): Quality {
  const forced = new URLSearchParams(location.search).get('quality')
  if (forced === 'low' || forced === 'medium' || forced === 'high') return forced
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency || 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(screen.width, screen.height) < 600
  if (small || mem <= 2 || cores <= 2) return 'low'
  if (coarse || mem <= 4 || cores <= 4) return 'medium'
  return 'high'
}

export function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
