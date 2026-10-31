# Portfolio Dewi Fatmawaty Sabiku

Situs portfolio akademik untuk **Dewi Fatmawaty Sabiku, S.P., M.Si.**, dosen Program Studi Teknik Produksi Benih, Politeknik Negeri Jember.

Konsepnya: partikel biji yang tumbuh menjadi tumbuhan seiring halaman digulir. Foto di hero bersifat semi-3D dan menoleh mengikuti kursor. Semua teks tetap berupa HTML biasa, jadi bisa dibaca mesin pencari dan pembaca layar.

- Di layar lebar, halaman berpindah per bagian (satu gerakan roda atau satu tekan PageDown berpindah satu halaman). Di ponsel dan layar pendek halaman menggulir biasa.
- Alamat setelah deploy: https://lannnmmmm.github.io/df-sabiku/
- Bahasa: Indonesia dan English (tombol ID / EN di pojok kanan atas)

## Menambah konten (tanpa coding)

Hasil riset, publikasi, kegiatan pengabdian, dan dokumentasi berasal dari folder di `content/`. Cukup unggah folder berisi PDF dan gambar lewat github.com, dan item baru muncul di situs setelah 1 sampai 3 menit.

Panduan langkah demi langkah: **[docs/PANDUAN-KONTEN.md](docs/PANDUAN-KONTEN.md)**

```
content/
  profil.json        data diri, bio, tautan akademik, kontak
  penelitian/        satu folder per penelitian
  publikasi/         jurnal, prosiding, buku, hak cipta
  pengabdian/        kegiatan pengabdian kepada masyarakat
  dokumentasi/       galeri foto kegiatan
  cv/                taruh satu berkas PDF di sini untuk tombol "Unduh CV"
```

## Dokumentasi

| Berkas | Untuk siapa | Isi |
|---|---|---|
| [docs/PANDUAN-KONTEN.md](docs/PANDUAN-KONTEN.md) | Pemilik situs | Cara menambah dan mengubah konten |
| [docs/DEPLOY-GITHUB-PAGES.md](docs/DEPLOY-GITHUB-PAGES.md) | Pemilik situs / pengelola repo | Mengaktifkan GitHub Pages, domain sendiri, mengatasi masalah |
| [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md) | Pengembang | Struktur kode, scene WebGL, cara menyetel |
| [docs/CATATAN-PEMBUATAN.md](docs/CATATAN-PEMBUATAN.md) | Siapa saja | Keputusan desain, asal data, yang sudah dan belum diuji |

## Menjalankan di komputer sendiri

Perlu Node.js 20 atau lebih baru.

```bash
npm install
npm run dev        # server pengembangan, http://localhost:5173
npm run build      # hasil produksi di folder dist/
npm run preview    # mencoba hasil build
npm run typecheck  # pemeriksaan tipe TypeScript
```

Parameter URL yang berguna saat menguji:

- `?quality=low` / `medium` / `high` memaksa tingkat kualitas partikel
- `?static` menampilkan versi tanpa WebGL (seperti pada perangkat yang meminta gerak dikurangi)

## Teknologi

React 19, TypeScript, Vite, Three.js (shader kustom, tanpa library tambahan untuk animasi). Font Geist dan Newsreader dari Google Fonts.

## Sumber data

Data akademik berasal dari PDDikti (Kemdiktisaintek) dan disalin pemilik situs pada 30 Oktober 2026. Tautan profil lain (Google Scholar, SINTA, ORCID, email) sengaja dikosongkan sampai pemiliknya mengisi sendiri. Tidak ada data yang dikarang.
