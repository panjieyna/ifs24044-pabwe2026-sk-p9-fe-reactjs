import { lazy, Suspense, useEffect, useState } from 'react'
import { IconArrowLeft, IconLink } from '@tabler/icons-react'
import { countWords, formatDate, initials, linkHandler, setPageMeta, showErrorAlert, showSuccessAlert } from '../../../helpers/toolsHelper'
import { getPublicPost, getPublicPosts } from '../api/blogApi'
import { authorName, postDate, relatedPosts } from '../postUtils'

const MarkdownViewer = lazy(() => import('../../../components/MarkdownViewer'))

function ContentSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Memuat isi artikel…</span>
      {['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-3/4'].map((w, i) => (
        <div key={i} className={`skeleton h-4 ${w}`} />
      ))}
    </div>
  )
}

function RelatedPosts({ posts, navigate }) {
  return (
    <section aria-labelledby="related-title" className="page-wide mt-24">
      <div className="border-t-2 border-ink pt-4">
        <h2 id="related-title" className="display text-3xl">
          Bacaan berikutnya
        </h2>
      </div>
      <ul className="mt-6 grid gap-8 md:grid-cols-3">
        {posts.map((post) => {
          const href = `/posts/${post.slug}`
          return (
            <li key={post.id} className="border-t border-line pt-5">
              <p className="eyebrow text-accent">{post.category}</p>
              <h3 className="display mt-2 text-2xl leading-tight">
                <a href={href} onClick={linkHandler(navigate, href)} className="link-sweep">
                  {post.title}
                </a>
              </h3>
              <p className="meta mt-3">
                {authorName(post)} · {post.reading_time} menit baca
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Halaman baca artikel publik (/posts/:slug) dengan tata letak full width.
export default function PublicArticleDetail({ slug, navigate }) {
  const [post, setPost] = useState(null)
  const [status, setStatus] = useState('loading')
  const [related, setRelated] = useState([])

  useEffect(() => {
    let active = true
    setStatus('loading')
    setRelated([])
    getPublicPost(slug)
      .then((data) => {
        if (!active) return
        setPost(data)
        setStatus('ready')
        setPageMeta(data.title, data.excerpt)
        getPublicPosts()
          .then((list) => {
            if (active) setRelated(relatedPosts(data, list))
          })
          .catch(() => {})
      })
      .catch((err) => {
        if (!active) return
        if (err.status === 404) {
          setStatus('notfound')
          setPageMeta('Artikel tidak ditemukan')
        } else {
          setStatus('error')
        }
      })
    return () => {
      active = false
    }
  }, [slug])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showSuccessAlert('Tautan artikel disalin')
    } catch {
      showErrorAlert('Salin tautan secara manual dari bilah alamat peramban.', 'Tautan belum tersalin')
    }
  }

  const back = (
    <a href="/" onClick={linkHandler(navigate, '/')} className="meta inline-flex items-center gap-2 hover:text-ink">
      <IconArrowLeft size={16} aria-hidden="true" /> Semua artikel
    </a>
  )

  if (status === 'loading') {
    return (
      <div className="page-wide min-h-screen pb-24 pt-8">
        {back}
        <div role="status" aria-busy="true" className="mt-12 space-y-5">
          <span className="sr-only">Memuat artikel…</span>
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-16 w-4/5" />
          <div className="skeleton h-16 w-3/5" />
        </div>
      </div>
    )
  }

  if (status === 'notfound' || status === 'error') {
    const notFound = status === 'notfound'
    return (
      <div className="page-wide pb-24 pt-8">
        {back}
        <div className="py-24 text-center">
          <p className="display text-[7rem] leading-none text-muted" aria-hidden="true">
            {notFound ? '404' : '—'}
          </p>
          <h1 className="display mt-4 text-4xl">{notFound ? 'Artikel tidak ditemukan.' : 'Artikel belum bisa dimuat.'}</h1>
          <p className="mt-3 text-ink-2">
            {notFound ? 'Mungkin sudah dihapus atau belum diterbitkan.' : 'Periksa koneksi Anda lalu muat ulang halaman.'}
          </p>
        </div>
      </div>
    )
  }

  const words = countWords(post.content)

  return (
    <>
      <article>
        <div className="page-wide pt-8">
          {back}
          <header className="mt-10 lg:mt-14">
            <p className="eyebrow text-accent">{post.category}</p>
            <h1 className="display mt-4 max-w-[18ch] text-[2.9rem] sm:text-7xl lg:text-[5.75rem]">{post.title}</h1>
            {post.excerpt && <p className="mt-6 max-w-3xl text-xl leading-relaxed text-ink-2">{post.excerpt}</p>}
          </header>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-semibold text-bg" aria-hidden="true">
                {initials(authorName(post))}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{authorName(post)}</p>
                <p className="meta">
                  <time dateTime={postDate(post)}>{formatDate(postDate(post), 'long')}</time>
                </p>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={copyLink}>
              <IconLink size={16} aria-hidden="true" /> Salin tautan
            </button>
          </div>

          {post.cover_image_path && (
            <figure className="mt-10">
              <img
                src={post.cover_image_path}
                alt=""
                width="1600"
                height="686"
                className="aspect-[21/9] w-full rounded-2xl object-cover"
                decoding="async"
              />
            </figure>
          )}

          <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
            <aside aria-label="Informasi artikel" className="lg:col-span-3">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:sticky lg:top-24 lg:grid-cols-1">
                <div>
                  <dt className="eyebrow">Kategori</dt>
                  <dd className="mt-1 text-sm font-medium">{post.category}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Waktu baca</dt>
                  <dd className="mt-1 text-sm font-medium">{post.reading_time} menit</dd>
                </div>
                <div>
                  <dt className="eyebrow">Panjang</dt>
                  <dd className="mt-1 text-sm font-medium">{words.toLocaleString('id-ID')} kata</dd>
                </div>
                <div>
                  <dt className="eyebrow">Diperbarui</dt>
                  <dd className="mt-1 text-sm font-medium">{formatDate(post.updated_at)}</dd>
                </div>
              </dl>
            </aside>
            <div className="min-w-0 max-w-[72ch] lg:col-span-8 lg:col-start-5">
              <Suspense fallback={<ContentSkeleton />}>
                <MarkdownViewer content={post.content} />
              </Suspense>
            </div>
          </div>
        </div>
      </article>
      {related.length > 0 && <RelatedPosts posts={related} navigate={navigate} />}
    </>
  )
}
