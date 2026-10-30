// Status bersama yang dibaca setiap frame oleh scene WebGL.
// Sengaja bukan state React: nilainya berubah puluhan kali per detik.

export const store = {
  /** Posisi gulir terhalus (px). */
  scrollY: 0,
  /** Tahap gulir kontinu, 0 (hero) sampai 4 (kontak). Diatur oleh lib/scroll.ts. */
  stage: 0,
  /** Nilai turunan yang dihitung scene, dibaca oleh GrowthRail. */
  grow: 0,
  spiral: 0,
  calm: 0,
  mouse: { x: 0, y: 0, active: false, last: 0 },
}

type Listener = (progress: number) => void

/** Penghitung progres pemuatan aset yang nyata (bukan hitungan palsu). */
class Loader {
  total = 4 // cutout, depth map, frame pertama, font
  done = 0
  private subs = new Set<Listener>()
  tick() {
    this.done = Math.min(this.total, this.done + 1)
    this.subs.forEach((f) => f(this.done / this.total))
  }
  get progress() {
    return this.done / this.total
  }
  subscribe(f: Listener) {
    this.subs.add(f)
    return () => {
      this.subs.delete(f)
    }
  }
}

export const loader = new Loader()
