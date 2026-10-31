# Panduan menambah konten

Panduan ini untuk pemilik situs. Tidak perlu bisa coding. Semua dilakukan lewat browser di github.com.

## Prinsip dasarnya

Setiap penelitian, publikasi, kegiatan pengabdian, atau album dokumentasi adalah **satu folder**. Isi folder itu:

- gambar (`.jpg`, `.png`, `.webp`, `.avif`, `.gif`) menjadi foto
- berkas PDF menjadi tombol "Buka PDF"
- berkas `index.md` (boleh tidak ada) berisi judul, tahun, jenis, dan keterangan

Situs membaca folder-folder itu setiap kali ada perubahan di GitHub, lalu menyusun daftar, kartu, dan galerinya sendiri. Satu folder baru berarti satu item baru.

| Folder | Tampil di bagian | Bentuk tampilan |
|---|---|---|
| `content/penelitian/` | Penelitian | daftar baris, dengan tombol Detail dan PDF |
| `content/publikasi/` | Publikasi dan hasil | daftar baris dengan filter (jurnal, prosiding, buku, hak cipta). Di layar lebar daftar dibagi per 4 karya dengan tombol Berikutnya |
| `content/pengabdian/` | Pengabdian kepada masyarakat | kartu kaca dengan foto sampul |
| `content/dokumentasi/` | Galeri dokumentasi | ubin foto, klik untuk melihat semua foto |

## Cara menambah satu item

### Langkah 1: beri nama folder

Pakai pola **`TAHUN-judul-singkat`**, huruf kecil, kata dipisah tanda hubung, tanpa spasi.

```
2026-biopriming-padi
2026-pelatihan-hidroponik-desa-sukorambi
```

Tahun di depan nama folder otomatis menjadi tahun item, dan urutan di situs mengikuti tahun (terbaru di atas). Judul diambil dari nama folder bila tidak ada `index.md`.

### Langkah 2: unggah lewat github.com

1. Buka repo, masuk ke folder kategori, misalnya `content` lalu `dokumentasi`.
2. Klik **Add file** lalu **Upload files**.
3. **Seret seluruh folder** dari komputer ke kotak unggah. Browser modern (Chrome, Edge, Firefox) ikut membawa isinya.
4. Tulis catatan singkat di kolom di bawah, lalu klik **Commit changes**.

Bila menyeret folder tidak berhasil, cara lain: klik **Add file** lalu **Create new file**, ketik `content/dokumentasi/2026-nama-kegiatan/index.md` di kolom nama (garis miring otomatis membuat folder), isi seperlunya, lalu commit. Setelah folder ada, buka folder itu dan gunakan **Add file** lalu **Upload files** untuk foto dan PDF.

### Langkah 3: tunggu

Situs diperbarui otomatis dalam sekitar 1 sampai 3 menit. Kemajuannya bisa dilihat di tab **Actions** (lingkaran kuning berarti berjalan, centang hijau berarti selesai). Setelah itu muat ulang situs. Bila tampilan lama masih muncul, tekan Ctrl + F5.

## Berkas `index.md` (opsional)

Tanpa `index.md`, item tetap tampil dengan judul dari nama folder. Dengan `index.md` Anda bisa mengatur judul yang rapi, jenis, dan keterangan:

```markdown
---
title: Pengaruh biopriming Trichoderma terhadap vigor benih padi
year: 2026
type: Jurnal nasional terakreditasi
source: Jurnal Contoh Pertanian, Vol. 5 No. 2
doi: 10.1234/contoh.2026.001
summary: Ringkasan satu kalimat yang muncul di daftar.
---

Isi keterangan lengkap ditulis di sini, setelah garis `---` kedua.
Boleh beberapa paragraf, **tebal**, *miring*, daftar, dan [tautan](https://contoh.ac.id).
```

Semua baris di antara dua garis `---` bersifat opsional:

| Isian | Fungsi |
|---|---|
| `title` | judul yang ditampilkan |
| `year` | tahun (menimpa tahun dari nama folder) |
| `type` | jenis, misalnya `Jurnal internasional`, `Prosiding seminar nasional`, `Buku referensi`, `Hak cipta nasional` |
| `source` | nama jurnal, penerbit, atau sumber data |
| `summary` | ringkasan pendek di daftar dan kartu |
| `doi` | nomor DOI, membuat tombol "Buka tautan" ke doi.org |
| `link` | tautan lain untuk tombol "Buka tautan". Bila `link` dan `doi` sama-sama diisi, `link` yang dipakai |
| `cover` | nama berkas gambar untuk sampul, misalnya `foto-3.jpg` (bawaan: gambar pertama) |
| `order` | angka untuk mengatur urutan di antara item bertahun sama (kecil lebih dulu) |
| `hidden` | tulis `true` untuk menyembunyikan item tanpa menghapusnya |

Pengelompokan filter di Publikasi dibaca dari kata dalam `type`: mengandung "jurnal" masuk **Jurnal**, "prosiding" masuk **Prosiding**, "buku" masuk **Buku**, "hak cipta" atau "paten" masuk **Hak cipta**. Selain itu masuk **Lainnya**.

### Versi bahasa Inggris

Tambahkan berkas **`index.en.md`** di folder yang sama dengan isian `title`, `summary`, dan isi dalam bahasa Inggris. Pengunjung yang memilih EN akan melihat versi itu. Tanpa berkas ini, versi Indonesia tetap dipakai.

## Foto dan PDF

- Foto dikecilkan otomatis (sisi terpanjang 1800 px) dan dibuatkan gambar kecil, jadi boleh mengunggah foto langsung dari kamera. Foto yang miring karena arah kamera diputar otomatis.
- Beri nama berkas yang berurutan (`foto-01.jpg`, `foto-02.jpg`) karena tampil sesuai urutan nama.
- PDF **tidak** dikecilkan. Usahakan di bawah 25 MB. Unggahan lewat browser dibatasi **25 MB per berkas** oleh GitHub (lewat Git bisa sampai 100 MB).
- Nama berkas yang mengandung spasi atau tanda baca aneh tetap bekerja, tetapi nama sederhana lebih aman.

## CV dan profil

- **CV:** taruh satu berkas PDF di `content/cv/`. Tombol "Unduh CV" muncul otomatis di bagian Kontak. Bila ada beberapa PDF, yang pertama menurut abjad yang dipakai.
- **Profil dan tautan:** buka `content/profil.json`, klik ikon pensil, lalu isi. Aturan penting: **kolom yang dikosongkan (`""`) tidak ditampilkan.** Contoh mengisi tautan akademik dan email:

  ```json
  "links": {
    "email": "nama@polije.ac.id",
    "scholar": "https://scholar.google.com/citations?user=XXXX",
    "sinta": "https://sinta.kemdiktisaintek.go.id/authors/profile/XXXX",
    "scopus": "",
    "orcid": "https://orcid.org/0000-0000-0000-0000",
    "researchgate": "",
    "pddikti": "https://pddikti.kemdiktisaintek.go.id/...",
    "institution": "https://www.polije.ac.id"
  }
  ```

  Pastikan tanda kutip dan koma tetap utuh. Bila situs gagal dibangun setelah mengedit berkas ini, hampir selalu penyebabnya koma atau kutip yang hilang. Tab **Actions** akan menunjukkan pesan "profil.json bukan JSON yang valid".
- **Formulir kontak:** bila ingin ada formulir, daftar di layanan seperti Formspree, lalu tempel alamat formulirnya di `contactFormEndpoint`. Kosong berarti formulir tidak ditampilkan.
- **Kartu bidang penelitian:** bagian `researchFocus` mengatur kartu kaca yang mengorbit di bagian Penelitian. Setiap kartu punya `refs`, yaitu daftar item terkait dengan format `kategori/nama-folder` (misalnya `publikasi/2026-biopriming-trichoderma-edamame`). Bila nama folder diubah, perbarui `refs`-nya. Pesan peringatan akan muncul saat build bila ada rujukan yang salah.

## Mengubah atau menghapus

- **Mengubah:** buka berkasnya di GitHub, klik pensil, ubah, lalu Commit.
- **Menyembunyikan sementara:** tambahkan `hidden: true` di `index.md`.
- **Menghapus:** buka folder, klik tiga titik di kanan atas, pilih **Delete directory**, lalu Commit.

## Kesalahan yang sering terjadi

| Gejala | Penyebab | Perbaikan |
|---|---|---|
| Item tidak muncul | folder di luar empat kategori, atau namanya diawali titik | pindahkan ke `penelitian`, `publikasi`, `pengabdian`, atau `dokumentasi` |
| Item muncul di urutan bawah | tidak ada tahun | awali nama folder dengan tahun, atau isi `year:` |
| Foto tidak muncul | ekstensi tidak dikenal (misalnya `.heic` dari iPhone) | ubah ke JPG atau PNG sebelum diunggah |
| Judul aneh seperti "Uji panen bibit cabai" | tidak ada `index.md`, judul dibentuk dari nama folder | tambahkan `index.md` dengan `title:` |
| Perubahan tidak tampil | build belum selesai atau cache browser | cek tab Actions, lalu Ctrl + F5 |
| Build gagal (silang merah di Actions) | `profil.json` tidak valid, atau berkas terlalu besar | buka log, pesannya menunjuk berkas yang bermasalah |

## Catatan tentang data dari PDDikti

Judul, tahun, dan jenis karya di situs ini disalin dari halaman dosen di PDDikti. PDDikti bergantung pada pelaporan perguruan tinggi, sehingga ada kemungkinan sedikit tidak sinkron dengan kondisi sebenarnya. Contohnya satu artikel tentang vigor benih cabai tercatat dua kali di PDDikti dengan ejaan berbeda ("Chili" dan "Chilli"). Di situs ini keduanya digabung menjadi satu. Bila ada data yang perlu dikoreksi di sumbernya, gunakan tautan "perubahan data" di bagian bawah halaman PDDikti.
