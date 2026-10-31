import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Lang, L10n } from './content'

const STRINGS = {
  id: {
    skip: 'Langsung ke konten',
    'nav.top': 'Awal',
    'nav.about': 'Tentang',
    'nav.research': 'Penelitian',
    'nav.growth': 'Perkecambahan',
    'nav.publications': 'Publikasi',
    'nav.outreach': 'Pengabdian',
    'nav.gallery': 'Galeri',
    'nav.contact': 'Kontak',
    'nav.menu': 'Menu',
    'nav.lang': 'Bahasa',
    'preload.label': 'Menyiapkan halaman',
    'hero.scroll': 'Gulir untuk melihat biji tumbuh',
    'hero.position': 'Jabatan fungsional',
    'about.title': 'Tentang',
    'about.education': 'Pendidikan',
    'about.facts': 'Status',
    'about.employment': 'Dosen tetap, aktif',
    'about.source': 'Data akademik bersumber dari PDDikti.',
    'research.title': 'Penelitian',
    'research.intro': 'Enam bidang yang berulang di karyanya. Pilih kartu untuk melihat karya terkait.',
    'research.related': 'karya terkait',
    'research.recorded': 'Penelitian tercatat',
    'research.none': 'Belum ada hasil penelitian yang diunggah.',
    'growth.title': 'Dari biji menjadi bibit',
    'growth.intro':
      'Perkecambahan berlangsung dalam beberapa tahap. Tumbuhan di latar halaman ini mengikuti urutan yang sama saat Anda menggulir.',
    'growth.priming':
      'Priming dan biopriming benih, yang dibahas di beberapa publikasinya, memberi perlakuan sebelum tanam yang bertujuan membuat tahap awal ini lebih cepat dan seragam.',
    'growth.s1.t': 'Imbibisi',
    'growth.s1.d': 'Biji menyerap air. Kulit biji melunak dan jaringan embrio mulai terhidrasi.',
    'growth.s2.t': 'Aktivasi metabolisme',
    'growth.s2.d': 'Enzim aktif dan cadangan makanan di dalam biji mulai diurai untuk embrio.',
    'growth.s3.t': 'Munculnya radikula',
    'growth.s3.d': 'Akar embrionik menembus kulit biji. Ini penanda perkecambahan telah berlangsung.',
    'growth.s4.t': 'Pemanjangan tunas',
    'growth.s4.d': 'Tunas tumbuh ke atas dan kotiledon terbuka, tergantung jenisnya di atas atau di bawah tanah.',
    'growth.s5.t': 'Bibit',
    'growth.s5.d': 'Daun sejati terbentuk dan bibit mulai berfotosintesis, tidak lagi bergantung pada cadangan biji.',
    'growth.note': 'Ilustrasi umum perkecambahan, bukan data penelitian tertentu.',
    'pub.title': 'Publikasi dan hasil',
    'pub.count': 'karya tercatat',
    'pub.all': 'Semua',
    'pub.jurnal': 'Jurnal',
    'pub.prosiding': 'Prosiding',
    'pub.buku': 'Buku',
    'pub.hki': 'Hak cipta',
    'pub.lain': 'Lainnya',
    'pub.source': 'Daftar ini diambil dari PDDikti. Tautan dan berkas ditambahkan lewat folder konten.',
    'pub.prev': 'Sebelumnya',
    'pub.next': 'Berikutnya',
    'pub.page': 'Halaman',
    'out.title': 'Pengabdian kepada masyarakat',
    'out.none': 'Belum ada kegiatan pengabdian yang ditampilkan.',
    'gal.title': 'Galeri dokumentasi',
    'gal.empty': 'Dokumentasi kegiatan akan ditambahkan di sini.',
    'gal.howto': 'Tambahkan folder ke content/dokumentasi/ berisi foto, lalu jalankan ulang.',
    'gal.photos': 'foto',
    'contact.title': 'Kontak',
    'contact.intro': 'Untuk kolaborasi riset, pengabdian, atau pertanyaan tentang teknologi benih.',
    'contact.email': 'Kirim email',
    'contact.cv': 'Unduh CV',
    'contact.profiles': 'Profil akademik',
    'contact.address': 'Alamat institusi',
    'contact.soon': 'Informasi kontak langsung akan ditambahkan. Sementara itu, hubungi melalui institusi.',
    'form.name': 'Nama',
    'form.email': 'Email Anda',
    'form.message': 'Pesan',
    'form.send': 'Kirim pesan',
    'form.sending': 'Mengirim…',
    'form.ok': 'Pesan terkirim. Terima kasih.',
    'form.fail': 'Pesan belum terkirim. Periksa koneksi lalu coba lagi.',
    'modal.close': 'Tutup',
    'modal.openPdf': 'Buka PDF',
    'modal.link': 'Buka tautan',
    'modal.files': 'Berkas',
    'modal.photos': 'Foto',
    'modal.source': 'Sumber',
    'modal.details': 'Detail',
    'modal.prev': 'Sebelumnya',
    'modal.next': 'Berikutnya',
    'modal.back': 'Kembali ke daftar',
    'footer.data': 'Data akademik: PDDikti, Kemdiktisaintek.',
    'footer.built': 'Dibangun dengan React dan Three.js.',
    'rail.seed': 'Biji',
    'rail.imbibition': 'Imbibisi',
    'rail.radicle': 'Radikula',
    'rail.shoot': 'Tunas',
    'rail.seedling': 'Bibit',
    'rail.vegetative': 'Fase vegetatif',
    'rail.phyllotaxis': 'Filotaksis',
    'rail.dispersal': 'Penyebaran biji',
  },
  en: {
    skip: 'Skip to content',
    'nav.top': 'Top',
    'nav.about': 'About',
    'nav.research': 'Research',
    'nav.growth': 'Germination',
    'nav.publications': 'Publications',
    'nav.outreach': 'Outreach',
    'nav.gallery': 'Gallery',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',
    'nav.lang': 'Language',
    'preload.label': 'Preparing the page',
    'hero.scroll': 'Scroll to watch the seed grow',
    'hero.position': 'Functional rank',
    'about.title': 'About',
    'about.education': 'Education',
    'about.facts': 'Status',
    'about.employment': 'Permanent lecturer, active',
    'about.source': 'Academic data comes from PDDikti.',
    'research.title': 'Research',
    'research.intro': 'Six areas that recur across her work. Select a card to see related works.',
    'research.related': 'related works',
    'research.recorded': 'Recorded research',
    'research.none': 'No research outputs uploaded yet.',
    'growth.title': 'From seed to seedling',
    'growth.intro':
      'Germination happens in stages. The plant in the background of this page follows the same order as you scroll.',
    'growth.priming':
      'Seed priming and biopriming, covered in several of her publications, are pre-sowing treatments meant to make these early stages faster and more uniform.',
    'growth.s1.t': 'Imbibition',
    'growth.s1.d': 'The seed takes up water. The seed coat softens and embryonic tissue rehydrates.',
    'growth.s2.t': 'Metabolic activation',
    'growth.s2.d': 'Enzymes become active and stored reserves inside the seed start to be broken down for the embryo.',
    'growth.s3.t': 'Radicle emergence',
    'growth.s3.d': 'The embryonic root breaks through the seed coat. This marks that germination has taken place.',
    'growth.s4.t': 'Shoot elongation',
    'growth.s4.d': 'The shoot grows upward and the cotyledons open, above or below ground depending on the species.',
    'growth.s5.t': 'Seedling',
    'growth.s5.d': 'True leaves form and the seedling begins photosynthesis, no longer relying on seed reserves.',
    'growth.note': 'A general illustration of germination, not data from a specific study.',
    'pub.title': 'Publications and outputs',
    'pub.count': 'works recorded',
    'pub.all': 'All',
    'pub.jurnal': 'Journals',
    'pub.prosiding': 'Proceedings',
    'pub.buku': 'Books',
    'pub.hki': 'Copyrights',
    'pub.lain': 'Other',
    'pub.source': 'This list comes from PDDikti. Links and files are added through the content folders.',
    'pub.prev': 'Previous',
    'pub.next': 'Next',
    'pub.page': 'Page',
    'out.title': 'Community service',
    'out.none': 'No outreach activities to show yet.',
    'gal.title': 'Documentation gallery',
    'gal.empty': 'Activity documentation will be added here.',
    'gal.howto': 'Add a folder with photos to content/dokumentasi/, then rebuild.',
    'gal.photos': 'photos',
    'contact.title': 'Contact',
    'contact.intro': 'For research collaboration, community service, or questions about seed technology.',
    'contact.email': 'Send an email',
    'contact.cv': 'Download CV',
    'contact.profiles': 'Academic profiles',
    'contact.address': 'Institution address',
    'contact.soon': 'Direct contact details will be added. For now, please reach out through the institution.',
    'form.name': 'Name',
    'form.email': 'Your email',
    'form.message': 'Message',
    'form.send': 'Send message',
    'form.sending': 'Sending…',
    'form.ok': 'Message sent. Thank you.',
    'form.fail': 'The message was not sent. Check your connection and try again.',
    'modal.close': 'Close',
    'modal.openPdf': 'Open PDF',
    'modal.link': 'Open link',
    'modal.files': 'Files',
    'modal.photos': 'Photos',
    'modal.source': 'Source',
    'modal.details': 'Details',
    'modal.prev': 'Previous',
    'modal.next': 'Next',
    'modal.back': 'Back to list',
    'footer.data': 'Academic data: PDDikti, Kemdiktisaintek.',
    'footer.built': 'Built with React and Three.js.',
    'rail.seed': 'Seed',
    'rail.imbibition': 'Imbibition',
    'rail.radicle': 'Radicle',
    'rail.shoot': 'Shoot',
    'rail.seedling': 'Seedling',
    'rail.vegetative': 'Vegetative stage',
    'rail.phyllotaxis': 'Phyllotaxis',
    'rail.dispersal': 'Seed dispersal',
  },
} as const

export type StringKey = keyof (typeof STRINGS)['id']

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: StringKey) => string
  pick: (l: L10n | undefined) => string
}

const I18nContext = createContext<Ctx | null>(null)

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'id' || saved === 'en') return saved
  } catch {
    /* penyimpanan bisa diblokir; abaikan */
  }
  return 'id'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l)
        try {
          localStorage.setItem('lang', l)
        } catch {
          /* abaikan */
        }
      },
      t: (k) => STRINGS[lang][k] ?? STRINGS.id[k],
      pick: (l) => (l ? (lang === 'en' && l.en ? l.en : l.id) : ''),
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const c = useContext(I18nContext)
  if (!c) throw new Error('useI18n harus dipakai di dalam I18nProvider')
  return c
}
