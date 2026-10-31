import { useSyncExternalStore } from 'react'

/**
 * Mode "satu halaman": setiap bagian menempati satu layar dan gulir berpindah per bagian.
 * Hanya aktif di layar lebar dan cukup tinggi, serta bila pengguna tidak meminta gerak dikurangi.
 * Di ponsel dan layar pendek halaman tetap menggulir biasa (konten tidak bisa dipadatkan ke satu layar).
 */
export const PAGE_QUERY = '(min-width: 1024px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(PAGE_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function usePageMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PAGE_QUERY).matches,
    () => false,
  )
}
