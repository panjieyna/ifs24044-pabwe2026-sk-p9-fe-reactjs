# Delcom Blog — Frontend (ReactJS SPA)

Studi Kasus PABWE 2026 Praktikum 9. Single Page Application untuk Delcom Blog — platform publikasi artikel multi-tier dengan AI Blog Generator — dibangun dengan React 18, Vite 6, Tailwind CSS 4, Toast UI Editor/Viewer, dan SweetAlert2. Diuji dengan Vitest + Testing Library pada **100% statements, branches, functions, dan lines**.

Backend pasangan: `ifs24044-pabwe2026-sk-p9-be-golang-gin`.

## Desain

Gaya editorial yang tenang: kertas hangat, tinta gelap, satu warna aksen (vermilion, bisa diganti kobalt atau lumut), judul **Instrument Serif** dan teks **Inter** (di-host sendiri di `public/fonts`, OFL). Daftar artikel bernomor ala majalah, garis rambut sebagai pemisah, mode gelap penuh, dan tata letak responsif dari 360 px hingga layar lebar.

## Rute

| Path | Komponen | Akses |
|---|---|---|
| `/`, `/public` | `PublicArticleList` — hero, pencarian real-time, filter kategori (pill), artikel pilihan + daftar bernomor | Publik |
| `/posts/:slug` | `PublicArticleDetail` — full width, panel info, Markdown via Toast UI Viewer, bacaan berikutnya | Publik |
| `/author` | `AuthorDashboard` — 3 kartu statistik, tabel artikel, menu kebab (⋮), toggle terbit/draf, modal editor & AI generator | Penulis |
| `/admin` | `AdminDashboard` — ringkasan sistem, direktori pengguna, arsip semua artikel | Admin |
| `/login`, `/register` | `AuthPage` (`id="login-username"`, `id="login-password"`, `id="login-submit"`) | Publik |

Routing memakai History API (`pushState` + `popstate`), sehingga refresh tetap berada di halaman yang sama. Rute privat dialihkan otomatis (`/author` tanpa login → `/login`, member di `/admin` → `/author`), dan sesi berakhir otomatis bila API membalas 401.

## Konfigurasi

| Variabel | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | URL lengkap API termasuk `/api`, mis. `https://ifs24044-pabwe2026-sk-p9-be-golang-gin.s1if.cloud/api`. **Isi di `.env` platform deploy.** |
| `VITE_PROXY_TARGET` | Target proxy `/api` saat `npm run dev`/`preview` (default `http://localhost:8081`) |
| `VITE_PORT` | Port dev server (default `5174`) |

Bila `VITE_API_BASE_URL` kosong: mode dev memakai `/api` (diproksikan ke backend lokal), sedangkan hasil build memakai `https://ifs24044-pabwe2026-sk-p9-be-golang-gin.s1if.cloud/api`.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5174 (backend lokal di :8081)
```

## Pengujian

```bash
npm test           # vitest run --coverage, ambang 100% untuk keempat metrik
```

Toast UI diganti versi ringan di `src/test/toastMock.js` (JSDOM tidak punya API kanvas/seleksi) dan SweetAlert2 di-mock di `src/setupTests.js`.

## Build

```bash
npm run build      # hasil di dist/ (sajikan sebagai SPA: semua path → index.html)
npm run preview
```

Beranda hanya memuat bundel utama (±57 KB gzip) + CSS (±9 KB gzip) + font yang di-preload; Toast UI, SweetAlert2, dan halaman penulis/admin dimuat saat dibutuhkan. Render pertama menunggu font siap (maks. 1,5 detik) agar judul tidak berpindah baris (CLS 0).

## Deploy (Delcom + Jenkins)

- Website Delcom: `ifs24044-pabwe2026-sk-p9-fe-reactjs.s1if.cloud`, teknologi **bun-reactjs**, database **none**. Nginx Delcom menyajikan hasil build secara statis dengan `try_files $uri $uri/ /index.html`, sehingga semua rute SPA bisa dibuka langsung.
- Tambahkan ke tab `.env` website: `VITE_API_BASE_URL=https://ifs24044-pabwe2026-sk-p9-be-golang-gin.s1if.cloud/api`.
- `Jenkinsfile`: Checkout → `bun install` → `vitest run --coverage` (Node 24) → Trivy (`HIGH,CRITICAL`, exit 1) → zip source → publish → redeploy Delcom. Kredensial `URL_REDEPLOY`, `URL_PROGRESS`, `DEPLOY_TOKEN`, `WEBSITE_ID` diisi lewat *Prepare an environment for the run* di job Jenkins.
- `npm audit` hanya menyisakan 2 temuan *moderate* (DOMPurify bawaan Toast UI Editor); tidak ada HIGH/CRITICAL.

## Audit lokal

Diukur dengan Lighthouse 12 dan axe-core 4 terhadap `vite preview` + backend lokal:

| Halaman | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Beranda (mobile) | 99 | 100 | 100 | 100 |
| Beranda (desktop) | 100 | 100 | 100 | 100 |
| Detail artikel (mobile) | 95 | 100 | 100 | 100 |
| Login (mobile) | 99 | 100 | 100 | 100 |

axe-core (WCAG 2.2 A/AA + best-practice): 0 pelanggaran di semua halaman, kedua tema, menu, dan setiap modal — termasuk editor Toast UI, yang atribut ARIA non-standarnya dikoreksi oleh `patchAccessibility()` di `MarkdownEditor.jsx`. Skor di server produksi juga bergantung pada kompresi gzip/brotli dan cache dari hosting.

## Struktur

```text
src/
├── App.jsx                     # routing SPA, sesi, tema, penjaga akses
├── main.jsx, index.css         # entry + design tokens (light/dark, aksen)
├── components/                 # MarkdownEditor, MarkdownViewer, FullScreenModal, KebabMenu
├── helpers/                    # apiHelper (fetch + token), toolsHelper (tanggal, meta, SweetAlert2)
├── hooks/                      # useInput, useTheme
└── features/
    ├── auth/                   # api/authApi, components/AuthPage + AuthForm, modals/AuthModal
    ├── blog/                   # api/blogApi, components/(StickyNavbar, PublicArticleList,
    │                           #   PublicArticleDetail, AuthorDashboard, PostStats),
    │                           #   modals/(PostModal, AiPostGeneratorModal), postUtils
    └── admin/                  # api/adminApi, components/AdminDashboard
```
