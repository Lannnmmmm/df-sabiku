# Deploy ke GitHub Pages

Situs dibangun dan dipublikasikan otomatis oleh GitHub Actions (`.github/workflows/deploy.yml`) setiap kali ada perubahan di cabang `main`. Anda tidak perlu menjalankan apa pun di komputer sendiri.

## Aktivasi pertama kali (sekali saja)

1. Buka repo di github.com, lalu **Settings**.
2. Di menu kiri pilih **Pages**.
3. Pada **Build and deployment**, ubah **Source** menjadi **GitHub Actions**.
4. Buka tab **Actions**. Bila belum ada proses berjalan, pilih workflow **Deploy ke GitHub Pages** lalu **Run workflow**.
5. Tunggu sampai centang hijau (sekitar 2 sampai 4 menit untuk pertama kali). Alamat situs muncul di langkah **deploy**, dan juga di Settings, Pages:

   `https://lannnmmmm.github.io/df-sabiku/`

Catatan: GitHub Pages untuk repo **privat** hanya tersedia pada paket berbayar GitHub. Untuk paket gratis, ubah repo menjadi **publik** (Settings, bagian paling bawah, Change visibility). Isi repo ini memang dimaksudkan untuk publik karena situsnya publik.

## Pembaruan berikutnya

Setiap commit ke `main` (termasuk unggahan folder konten dari github.com) memicu build baru. Build memakan 1 sampai 3 menit. Hasilnya bisa dipantau di tab **Actions**.

## Memakai domain sendiri

1. Beli atau siapkan domain, misalnya `dewisabiku.id`.
2. Di Settings, Pages, isi **Custom domain**, lalu ikuti petunjuk DNS dari GitHub (biasanya satu rekaman CNAME ke `lannnmmmm.github.io`).
3. Ubah `.env.production` di repo:

   ```
   VITE_SITE_URL=https://dewisabiku.id/
   ```

   Nilai ini dipakai untuk pratinjau tautan (WhatsApp, LinkedIn, dan lainnya) dan data terstruktur untuk mesin pencari. Pastikan diakhiri garis miring.
4. Situs memakai alamat relatif (`base: './'`), jadi tidak ada pengaturan lain yang perlu diubah.

## Bila ada masalah

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| Alamat situs menampilkan 404 | Source Pages belum diatur ke GitHub Actions | ulangi langkah aktivasi di atas |
| Workflow gagal (silang merah) | galat saat build | buka proses yang gagal, buka langkah berwarna merah, baca pesan terakhirnya. Galat dari `[content]` berarti masalah pada folder konten atau `profil.json` (lihat panduan konten) |
| Langkah "Typecheck" berwarna kuning | peringatan tipe TypeScript | tidak menghentikan deploy. Sampaikan ke pengembang untuk dirapikan |
| Situs tidak berubah setelah commit | cache browser, atau build belum selesai | cek tab Actions, lalu Ctrl + F5 |
| Pratinjau tautan masih kosong atau lama | WhatsApp dan sejenisnya menyimpan cache | gunakan alat debug masing-masing platform untuk menyegarkan |
| Font tampil seperti Times | Google Fonts terblokir di jaringan tertentu | situs tetap terbaca. Font akan muncul normal di jaringan yang mengizinkan |

## Catatan teknis

- Workflow memakai `npm install` (belum ada `package-lock.json`). Disarankan menjalankan `npm install` sekali di komputer lalu meng-commit `package-lock.json` agar versi paket terkunci dan build selalu identik.
- Node 22 dipakai di CI.
- Folder `dist/`, `node_modules/`, `src/generated/`, dan `public/media/` sengaja tidak masuk Git (dihasilkan saat build).
