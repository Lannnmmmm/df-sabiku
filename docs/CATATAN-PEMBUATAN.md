# Catatan pembuatan

Catatan keputusan, asal data, dan status pengujian. Ditulis pada 30 Oktober 2026.

## Keputusan yang diambil

| Hal | Keputusan | Alasan |
|---|---|---|
| Tema | Hijau gelap dalam (`#0A1F13` ke `#0F2A1A`) dengan aksen cerah (`#2ECC71`, `#A8E6CF`) | pilihan pemilik situs |
| Komposisi hero | Foto di tengah, partikel mengelilingi, nama dan afiliasi di bagian bawah | pilihan pemilik situs. Nama diletakkan di bawah supaya tidak menutupi wajah |
| Arsitektur | Kanvas WebGL tetap di belakang, semua teks dan kartu di DOM | SEO, pembaca layar, seleksi teks, dan `backdrop-filter` tetap bekerja |
| Foto | Cutout dan peta kedalaman, rotasi dibatasi sekitar 15 derajat | batas ini menjaga wajah tidak melar. Foto 2D tidak bisa benar-benar menoleh |
| Animasi UI | CSS dan `requestAnimationFrame`, tanpa Framer Motion atau GSAP | menghindari dua sistem animasi yang bentrok dengan loop WebGL |
| Bahasa | Indonesia (bawaan) dan English | disetujui pemilik situs. Pembaca akademik banyak yang internasional |
| Kontak | Tanpa formulir bawaan. Email, tautan profil, dan formulir muncul hanya bila diisi | tidak ada data kontak yang boleh dikarang |
| Hosting | GitHub Pages lewat GitHub Actions | diminta pemilik situs |
| Konten | Folder per item di `content/`, dibaca saat build | agar menambah konten cukup dengan mengunggah folder |
| Dependensi | React, Three.js, Vite saja | seminimal mungkin agar mudah dirawat |

## Asal data

Seluruh data akademik di situs berasal dari satu sumber: halaman dosen PDDikti (Kemdiktisaintek), **disalin sendiri oleh pemilik situs** ke percakapan pada 30 Oktober 2026. Situs PDDikti memblokir akses otomatis, sehingga tidak bisa dibaca langsung.

Yang diambil: nama, perguruan tinggi, program studi, jabatan fungsional (Asisten Ahli), status (dosen tetap, aktif), riwayat pendidikan (S2 IPB 2019, S1 Universitas Negeri Gorontalo 2015), satu penelitian, dua kegiatan pengabdian, sepuluh karya, dan dua hak cipta.

Yang **tidak** dipakai: nomor induk mahasiswa dan data sejenis dari halaman riwayat studi.

Penyesuaian yang dilakukan pada data:

- PDDikti mencatat artikel "Seed Vigor Improvement of Red Chili/Chilli Seeds ... Spirulina platensis" dua kali (beda ejaan "Chili" dan "Chilli"). Digabung menjadi satu entri. Dengan itu 10 karya di PDDikti menjadi 9 entri, ditambah 2 hak cipta, totalnya 11 item di bagian Publikasi.
- Judul yang di PDDikti ditulis huruf kapital semua diubah menjadi huruf kalimat biasa. Isinya tidak diubah.
- Bagian Biografi dan "Bidang penelitian" disusun dari judul-judul karya di atas. Tiap kartu bidang hanya merujuk karya yang memang ada. Ini ringkasan, bukan klaim baru. Pemilik situs sebaiknya membaca dan menyesuaikan kalimatnya.
- Alamat institusi (Jl. Mastrip PO Box 164, Jember 68101) berasal dari dokumen resmi Politeknik Negeri Jember di hasil pencarian web.

Yang sengaja **dikosongkan** karena tidak ada sumber yang sahih: email, Google Scholar, SINTA, Scopus, ORCID, ResearchGate, CV, galeri foto, dan terjemahan Inggris untuk judul karya. Pencarian web atas nama beliau tidak menemukan profil yang bisa dipastikan milik beliau (hasilnya orang lain dengan nama mirip, yang tidak dipakai).

## Foto

- Cutout dibuat dengan GrabCut (OpenCV) dari foto asli, lalu dirapikan dan dibuat memudar di bagian bawah supaya menyatu dengan partikel. Skrip ada di `tools/make-hero-photo.py`.
- Peta kedalaman **perkiraan** (siluet menggembung dan tonjolan wajah), bukan hasil model AI. Model estimasi kedalaman tidak dapat diunduh di lingkungan pembuatan.
- Tepi hijab dan kacamata sudah bersih pada pemeriksaan visual, tetapi cutout otomatis bisa menyisakan halo tipis pada latar tertentu. Bila ingin hasil yang lebih sempurna, cutout dapat diganti dengan hasil layanan penghapus latar atau Photoshop, lalu disimpan sebagai `public/images/dewi-cutout.webp` dengan ukuran sama.

## Pengujian

Dilakukan di lingkungan pembuatan, tanpa akses ke registri npm:

| Hal | Cara | Hasil |
|---|---|---|
| Seluruh kode bisa di-bundle | esbuild dengan React dan Three.js r170 | berhasil, tanpa peringatan |
| Scene WebGL berjalan | Chromium headless (WebGL perangkat lunak), desktop 1440x900 dan ponsel 390x844 | tanpa galat konsol. Foto, partikel, tumbuhan, spiral, dan penyebaran tampil di tahap yang benar |
| Semua bagian halaman | tangkapan layar tiap bagian, ID dan EN | tampil sesuai desain |
| Kartu orbit, jendela detail, lightbox, filter publikasi, menu ponsel, tombol bahasa | diuji lewat Playwright | berfungsi, tutup dengan Esc berfungsi |
| Mode statis (`?static`) | tangkapan layar | berfungsi |
| Sistem folder konten | folder uji berisi dua gambar dan satu PDF tanpa `index.md`, lalu dihapus | muncul otomatis di Galeri. Gambar 1,9 MB dikompres menjadi 0,5 MB, thumbnail dibuat, PDF tersalin, sampul dipilih otomatis |
| Kecocokan data | dibandingkan dengan data PDDikti yang disalin pemilik | cocok (lihat penyesuaian di atas) |
| Kontras warna | dihitung dengan rumus WCAG | di atas 4,5:1 pada latar gelap. Lihat catatan di ARSITEKTUR.md |

**Belum teruji:**

- **Build Vite yang sebenarnya.** Vite tidak bisa dipasang di lingkungan pembuatan, jadi build produksi pertama terjadi di GitHub Actions. Bila gagal, log di tab Actions menunjukkan penyebabnya.
- **Pemeriksaan tipe TypeScript penuh** (`npm run typecheck`). Dijalankan sebagai langkah peringatan di CI dan tidak menghentikan deploy.
- **Perangkat sungguhan.** WebGL diuji dengan renderer perangkat lunak. Kinerja pada ponsel tertentu belum diukur. Penyesuaian kualitas otomatis ada, tetapi sebaiknya dicoba di beberapa ponsel.
- **Font Geist dan Newsreader.** Di lingkungan pembuatan Google Fonts diblokir, sehingga pengujian memakai font cadangan (mirip Times). Tampilan akhir memakai font asli dan sedikit berbeda dalam lebar teks.
- **Pratinjau tautan** (WhatsApp, LinkedIn) belum diuji, karena butuh alamat publik.

## Keterbatasan yang diketahui

- Judul tab browser tidak berganti bahasa saat tombol EN ditekan (atribut `lang` pada halaman berganti).
- Jenis karya dari PDDikti ("Jurnal nasional terakreditasi", dan sebagainya) tetap berbahasa Indonesia di versi English.
- Tidak ada `package-lock.json`. Disarankan membuatnya sekali (`npm install` di komputer) lalu menyimpannya di repo.

## Yang perlu dilengkapi pemilik situs

1. Email yang boleh ditampilkan, dan tautan Google Scholar, SINTA, Scopus, ORCID (`content/profil.json`).
2. File CV PDF (`content/cv/`).
3. Foto dan dokumen kegiatan: folder di `content/dokumentasi/`, `content/pengabdian/`, dan `content/penelitian/`.
4. Membaca dan menyesuaikan bio dan deskripsi bidang penelitian di `content/profil.json`.
5. Bila ada: tautan jurnal atau DOI untuk tiap publikasi (isian `doi:` atau `link:` di `index.md`).
6. Terjemahan Inggris judul karya (berkas `index.en.md`), bila diinginkan.
