# Arsitektur

Dokumen untuk pengembang. Untuk menambah konten, lihat [PANDUAN-KONTEN.md](PANDUAN-KONTEN.md).

## Gambaran besar

```
content/ (folder, md, pdf, gambar)
   │  scripts/build-content.mjs   (jalan sebelum vite dev / build)
   ▼
src/generated/content.json  +  public/media/   (keduanya dihasilkan, tidak masuk Git)
   │
   ▼
React (src/ui)  ◄──── store.ts ────►  HeroScene (src/gl)  ──►  <canvas> tetap di belakang halaman
 teks, kartu, modal      status bersama      Three.js + shader
```

Prinsip utamanya **hibrida**: satu kanvas WebGL tetap (`position: fixed`) di belakang, sedangkan semua teks, kartu kaca, dan tombol adalah DOM biasa. Dengan begitu SEO, pemilihan teks, pembaca layar, dan `backdrop-filter` bekerja normal. WebGL tidak dipakai untuk menggambar teks.

## Struktur kode

| Jalur | Peran |
|---|---|
| `scripts/build-content.mjs` | Membaca `content/`, mengompres gambar (sharp), membuat thumbnail, menulis `content.json` |
| `src/lib/content.ts` | Tipe dan akses data hasil build (`itemsOf`, `profile`, `pubGroup`) |
| `src/lib/i18n.tsx` | Teks antarmuka ID/EN (`STRINGS`), pilihan bahasa disimpan di `localStorage` |
| `src/lib/store.ts` | Status bersama yang dibaca scene tiap frame (posisi gulir, kursor, progres muat). Sengaja bukan state React |
| `src/lib/scroll.ts` | Mengubah posisi gulir menjadi "tahap" kontinu lewat atribut `data-stage` pada `<section>` |
| `src/lib/quality.ts` | Deteksi tingkat kualitas, WebGL, dan `prefers-reduced-motion` |
| `src/gl/HeroScene.ts` | Kelas yang memiliki renderer, foto, partikel, latar, dan loop render |
| `src/gl/targets.ts` | Posisi tujuan partikel: awan, tumbuhan, spiral, penyebaran (berbenih acak tetap) |
| `src/gl/shaders.ts` | GLSL untuk partikel, foto, dan latar |
| `src/ui/*` | Komponen halaman. `Research.tsx` menggerakkan kartu yang mengorbit, `Modal.tsx` berisi dialog detail dan lightbox |
| `src/styles/global.css` | Seluruh gaya. Warna dan jarak ada di variabel `:root` |

## Alur gulir dan tahap pertumbuhan

Setiap bagian halaman menandai tahap yang harus dicapai ketika tiba di layar:

| Bagian | `data-stage` | Yang tergambar |
|---|---|---|
| Hero | 0 | awan biji mengelilingi foto |
| Tentang | 1 | biji mulai bergabung menjadi tumbuhan |
| Penelitian | 2 | tumbuhan penuh, kartu kaca mengorbit |
| Perkecambahan | 2.4 | tumbuhan penuh |
| Publikasi | 3 | tumbuhan berubah menjadi spiral filotaksis |
| Pengabdian | 3.25 | spiral |
| Galeri | 3.5 | spiral mulai terurai |
| Kontak | 4 | biji tersebar tenang |

`scroll.ts` mengukur posisi setiap bagian, lalu menginterpolasi tahap secara halus di antaranya. Pengukuran diulang saat ukuran halaman berubah (`ResizeObserver`), jadi **menambah konten yang membuat halaman lebih panjang tidak merusak animasi**. Nilai turunan dihitung di `HeroScene.render`:

- `grow = smooth(tahap / 2)`: seberapa jauh biji telah menjadi tumbuhan
- `spiral = clamp((tahap - 2.5) / 0.5)`
- `calm = clamp((tahap - 3.5) / 0.5)`
- foto terurai menjadi partikel pada tahap 0 sampai 0,6

Label di tepi kanan (`GrowthRail`) membaca `grow`, `spiral`, dan `calm` dari `store`, sehingga selalu cocok dengan yang sedang digambar. Urutan tahap sesuai fisiologi benih: imbibisi, munculnya radikula, pemanjangan tunas, bibit, fase vegetatif.

## Foto semi-3D

- Foto adalah bidang `PlaneGeometry(84 x 78 segmen)` yang titiknya digeser sepanjang sumbu Z oleh **peta kedalaman** (`dewi-depth.webp`) di vertex shader.
- Di fragment shader, koordinat tekstur digeser sesuai posisi kursor dikali kedalaman (paralaks), dan cahaya lembut dihitung dari normal yang diturunkan dari peta kedalaman.
- Bidang berputar mengikuti kursor: sumbu Y maksimal sekitar 15 derajat, sumbu X sekitar 9 derajat. Batas ini disengaja supaya wajah tidak tampak melar.
- Bila kursor tidak bergerak selama 3 detik (atau tidak ada kursor), foto bergerak pelan sendiri dengan gerak sinus.
- Peta kedalaman adalah **perkiraan** (siluet menggembung ditambah tonjolan wajah), dibuat oleh `tools/make-hero-photo.py`. Ini bukan hasil model estimasi kedalaman AI. Cukup untuk paralaks halus, tetapi tidak membuat wajah benar-benar menoleh.

## Partikel

Satu `THREE.Points` dengan seluruh logika gerak di vertex shader. Setiap partikel punya empat posisi tujuan (`position` = awan, `aPlant`, `aSpiral`, `aCalm`) dan nilai acak. Shader mencampurnya sesuai `uGrow`, `uSpiral`, `uCalm`. Reaksi terhadap kursor dihitung di shader dari posisi kursor di bidang dunia (`uMouse`). Karena posisi tujuan dibuat dari generator berbenih tetap, bentuk tumbuhan selalu sama.

## Kualitas dan performa

| Tingkat | Partikel | Batas DPR | Dipilih bila |
|---|---|---|---|
| high | 32.000 | 2 | perangkat kuat |
| medium | 16.000 | 1,5 | layar sentuh, memori 4 GB atau kurang, 4 inti atau kurang |
| low | 7.000 | 1 | layar kecil (di bawah 600 px), memori 2 GB atau kurang, 2 inti atau kurang |

- Penyesuaian otomatis (`HeroScene.adapt`): bila rata-rata frame lebih lambat dari sekitar 30 fps selama beberapa detik, jumlah partikel yang digambar dikurangi 30 persen berulang kali, lalu resolusi diturunkan ke tingkat `low`.
- Fallback statis (`StaticBackdrop`, pola filotaksis SVG dan foto biasa) dipakai bila: WebGL tidak ada, `prefers-reduced-motion: reduce`, konteks WebGL hilang, atau gagal memuat tekstur.
- Render berhenti saat tab tidak terlihat (`visibilitychange`).
- Parameter URL: `?quality=low|medium|high` dan `?static`.

## Preloader

Hitungan 0 sampai 100 persen mengikuti **progres sebenarnya**: empat langkah (cutout, peta kedalaman, frame pertama, font). Waktu tampil minimum 1,1 detik, maksimum 9 detik. Selama pemuatan biji melayang di belakang overlay (transparan), dan setelah 100 persen partikel berkumpul dan foto muncul. Teks hero disembunyikan selama pemuatan (`html.is-loading`).

## Kartu yang mengorbit

`Research.tsx` menempatkan kartu kaca di DOM, lalu memposisikannya tiap frame dengan `transform` mengikuti elips di sekitar tumbuhan (sekitar 70 persen lebar layar). Kartu yang berada "di belakang" lebih kecil, lebih transparan, dan sedikit kabur. Orbit berhenti saat kursor atau fokus berada di sebuah kartu. Di layar sempit (di bawah 1024 px) dan pada mode statis, kartu ditampilkan sebagai grid biasa.

## Tempat menyetel

| Ingin mengubah | Lokasi |
|---|---|
| Jumlah partikel per tingkat | `PARTICLES` di `src/lib/quality.ts` |
| Batas resolusi | `DPR_CAP` di `src/lib/quality.ts` |
| Kekuatan menoleh foto | `this.photo.rotation.set(...)` di `HeroScene.render` |
| Kedalaman foto | `uDepthAmt` di `buildPhoto` |
| Ukuran foto | `PHOTO_W` di `HeroScene.ts` |
| Bentuk tumbuhan, spiral, warna | `src/gl/targets.ts` |
| Posisi tumbuhan di layar | `plantX` di `HeroScene.resize` (dan `0.7` di `Research.tsx` untuk orbit) |
| Warna dan font | variabel di awal `src/styles/global.css` dan tag `<link>` font di `index.html` |
| Teks antarmuka | `STRINGS` di `src/lib/i18n.tsx` (tambahkan kunci yang sama di `id` dan `en`) |
| Urutan tahap per bagian | atribut `data-stage` di komponen bagian |

Bila foto diganti, ukuran gambar baru perlu disesuaikan di `HeroScene.ts` (`840 x 780` pada `PHOTO_H`, `uTexel`) dan `Hero.tsx`.

## Aksesibilitas

- Kanvas bersifat `aria-hidden`. Seluruh isi ada di teks DOM.
- Tautan "Lewati ke konten", urutan judul yang benar, `aria-pressed` pada tombol bahasa dan filter, dialog asli (`<dialog>`) untuk jendela detail, dan indikator fokus yang jelas.
- Kontras di atas latar gelap (`--bg-0`): teks utama 16,2:1, `--sage` 9,9:1, `--sage-dim` 8,6:1, aksen 12,2:1 (semuanya di atas batas AA 4,5:1). Di area terang tepat di belakang tumbuhan (sekitar `#1c5a38`) kontras `--sage` turun ke 4,7:1 dan `--sage-dim` ke sekitar 4,1:1. Karena itu teks panjang diletakkan di sisi kiri dengan lapisan gelap (`.section::before`) atau di dalam lembar/kartu berlatar gelap, bukan langsung di atas tumbuhan. Bila menambah teks kecil di sisi kanan, periksa kontrasnya.
- `prefers-reduced-motion` mematikan WebGL, animasi, dan transisi.

## Mengapa tidak ada library animasi UI

Brief menyebut Framer Motion atau GSAP bersama smooth scroll. Dua library animasi sekaligus berisiko bentrok dengan loop render WebGL dan menambah ukuran halaman. Karena kebutuhan animasinya terbatas (fade, orbit kartu, hitungan preloader), semuanya ditulis dengan CSS dan `requestAnimationFrame`. Gulir memakai `scroll-behavior: smooth` bawaan browser. Bila nanti butuh kendali gulir yang lebih halus, Lenis bisa ditambahkan tanpa mengubah `store.scrollY`.
