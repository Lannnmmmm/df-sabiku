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
| `src/lib/pages.ts` | Menentukan apakah mode satu halaman aktif (`PAGE_QUERY`) |
| `src/lib/pager.ts` | Pengendali roda: satu gerakan roda berpindah tepat satu halaman |
| `src/lib/quality.ts` | Deteksi tingkat kualitas, WebGL, dan `prefers-reduced-motion` |
| `src/gl/HeroScene.ts` | Kelas yang memiliki renderer, foto, partikel, latar, dan loop render |
| `src/gl/targets.ts` | Posisi tujuan partikel: awan, tumbuhan, spiral, penyebaran (berbenih acak tetap) |
| `src/gl/shaders.ts` | GLSL untuk partikel, foto, dan latar |
| `src/ui/PageDots.tsx` | Titik penanda halaman di kanan, dan penanda bagian aktif (`is-active`) untuk animasi masuk |
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

## Mode satu halaman

Di layar lebar dan cukup tinggi (`PAGE_QUERY` di `src/lib/pages.ts`: lebar minimal 1024 px, tinggi minimal 620 px, dan pengguna tidak meminta gerak dikurangi), setiap bagian menempati tepat satu layar dan gulir berpindah per bagian. Di ponsel, layar pendek, dan mode gerak dikurangi, halaman menggulir biasa.

Cara kerjanya:

- `App.tsx` memasang atribut `data-pages="on"` pada `<html>`. Semua aturan satu halaman di `global.css` memakai awalan `html[data-pages='on']`, jadi di luar mode ini CSS tidak berubah.
- CSS `scroll-snap-type: y mandatory` dengan `scroll-snap-stop: always` menangani **keyboard** (panah, PageDown, Spasi), **sentuhan**, tombol navigasi, dan titik halaman.
- **Roda mouse dan trackpad ditangani `pager.ts`**, bukan snap CSS. Alasannya: pada uji, satu "tik" roda kecil dengan snap `mandatory` saja bisa berakhir kembali di halaman yang sama. `pager.ts` membatalkan gulir bawaan dan menggulir ke halaman berikutnya atau sebelumnya (`scrollTo` halus), dengan jeda sekitar 0,75 detik dan penyaring inersia trackpad. Roda dibiarkan bekerja bawaan di dalam `<dialog>`, di elemen yang punya gulir sendiri, atau saat zoom cubit.
- Bagian yang lebih tinggi dari layar (misalnya galeri dengan banyak foto) digulir normal sampai tepinya terlihat, baru pindah halaman.
- `setPageMode` di `scroll.ts` membuat tahap pertumbuhan tercapai tepat di puncak tiap bagian (bukan 0,3 tinggi layar lebih awal), karena gulir selalu berhenti di sana.
- Agar tiap bagian muat dalam satu layar, daftar Publikasi dipecah per 4 karya (`PER_PAGE` di `Publications.tsx`), kartu Penelitian mengorbit di seluruh area, dan lima tahap Perkecambahan disusun dua kolom. Aturannya ada di akhir `global.css` ("pemadatan per bagian").

## Warna

Palet ada di variabel awal `global.css`: dasar teal gelap (`--bg-0`, `--bg-1`), aksen madu (`--gold`, aksen utama), mawar (`--rose`, dari warna jilbab pada foto), mint, dan biru langit. Warna yang sama dipakai di WebGL:

- Latar: `BG_FRAG` di `shaders.ts`. Rona cahayanya berganti per tahap lewat tabel `TINTS` di `HeroScene.ts` (hangat di hero, teal di Tentang, biru di Penelitian, tembaga di Perkecambahan, mawar di Publikasi, biru langit di Kontak). Ubah angka di tabel itu untuk menyetel suasananya.
- Tumbuhan dan kilau: `C` di `targets.ts`. Spiral berwarna madu ke mawar, dan penyebaran biji berwarna biru langit, di `PARTICLE_VERT`.
- Bila mengganti `--bg-0`, ubah juga `top`/`bottom` di `BG_FRAG`, `setClearColor` di `HeroScene.ts`, dan `theme-color` di `index.html`.

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
| Warna dan font | variabel di awal `src/styles/global.css`, `TINTS` di `HeroScene.ts`, `C` di `targets.ts`, dan tag `<link>` font di `index.html` |
| Kapan mode satu halaman aktif | `PAGE_QUERY` di `src/lib/pages.ts` |
| Jumlah publikasi per halaman | `PER_PAGE` di `src/ui/Publications.tsx` |
| Teks antarmuka | `STRINGS` di `src/lib/i18n.tsx` (tambahkan kunci yang sama di `id` dan `en`) |
| Urutan tahap per bagian | atribut `data-stage` di komponen bagian |

Bila foto diganti, ukuran gambar baru perlu disesuaikan di `HeroScene.ts` (`840 x 780` pada `PHOTO_H`, `uTexel`) dan `Hero.tsx`.

## Aksesibilitas

- Kanvas bersifat `aria-hidden`. Seluruh isi ada di teks DOM.
- Tautan "Lewati ke konten", urutan judul yang benar, `aria-pressed` pada tombol bahasa dan filter, dialog asli (`<dialog>`) untuk jendela detail, dan indikator fokus yang jelas.
- Kontras di atas latar gelap (`--bg-0`, `#0b2528`): teks utama 15,2:1, `--sage` 10,9:1, `--sage-dim` 9,0:1, `--gold` 10,3:1, `--rose` 9,4:1 (semuanya di atas batas AA 4,5:1). Pada titik paling terang yang diukur dari tangkapan layar (cahaya rona di dekat tumbuhan atau spiral), kontras `--sage` tetap sekitar 6:1 dan `--sage-dim` sekitar 5:1. Teks panjang tetap diletakkan di sisi kiri dengan lapisan gelap (`.section::before`) atau di dalam lembar/kartu berlatar gelap. Bila menambah teks kecil di sisi kanan, periksa kontrasnya, terutama setelah mengubah `TINTS`.
- `prefers-reduced-motion` mematikan WebGL, animasi, transisi, dan mode satu halaman.
- Titik halaman (`PageDots`) berupa tombol dengan label dan `aria-current`. Keyboard memakai snap CSS bawaan.

## Mengapa tidak ada library animasi UI

Brief menyebut Framer Motion atau GSAP bersama smooth scroll. Dua library animasi sekaligus berisiko bentrok dengan loop render WebGL dan menambah ukuran halaman. Karena kebutuhan animasinya terbatas (fade, orbit kartu, hitungan preloader), semuanya ditulis dengan CSS dan `requestAnimationFrame`. Gulir memakai `scroll-behavior: smooth` bawaan browser, ditambah pengendali roda kecil (`pager.ts`) untuk mode satu halaman. Bila nanti butuh kendali gulir yang lebih halus, Lenis bisa ditambahkan tanpa mengubah `store.scrollY`, tetapi `pager.ts` perlu disesuaikan agar tidak berebut kendali.
