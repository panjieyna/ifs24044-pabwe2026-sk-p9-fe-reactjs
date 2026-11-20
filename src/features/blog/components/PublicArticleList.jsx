import { useEffect, useState } from 'react'
import { IconArrowUpRight, IconPencil, IconRefresh, IconSearch } from '@tabler/icons-react'
import useInput from '../../../hooks/useInput'
import { formatDate, linkHandler, setPageMeta } from '../../../helpers/toolsHelper'
import { DEFAULT_CATEGORIES, getCategories, getPublicPosts } from '../api/blogApi'
import { authorName, postDate } from '../postUtils'

function PostMetaLine({ post }) {
  return (
    <div className="meta leading-relaxed">
      <p className="font-medium text-ink-2">{authorName(post)}</p>
      <p className="whitespace-nowrap">
        <time dateTime={postDate(post)}>{formatDate(postDate(post))}</time>
        <span aria-hidden="true"> · </span>
        {post.reading_time} menit baca
      </p>
    </div>
  )
}

function FeaturedPost({ post, navigate }) {
  const href = `/posts/${post.slug}`
  return (
    <article className="fade-up grid gap-8 border-t-2 border-ink pt-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-8">
        <p className="eyebrow">
          <span className="text-accent">Pilihan editor</span> · {post.category}
        </p>
        <h2 className="display mt-4 text-[2.6rem] sm:text-6xl lg:text-[4.5rem]">
          <a href={href} onClick={linkHandler(navigate, href)} className="link-sweep">
            {post.title}
          </a>
        </h2>
      </div>
      <div className="flex flex-col justify-between gap-6 lg:col-span-4 lg:pt-12">
        <p className="text-lg leading-relaxed text-ink-2">{post.excerpt}</p>
        <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
          <PostMetaLine post={post} />
          <IconArrowUpRight size={22} className="shrink-0 text-muted" aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}

function ArticleRow({ post, index, navigate }) {
  const href = `/posts/${post.slug}`
  return (
    <li className="group grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-t border-line py-7 md:grid-cols-[4.5rem_minmax(0,1fr)_14rem] md:gap-x-8">
      <span className="display pt-1 text-2xl tabular-nums text-muted" aria-hidden="true">
        {String(index).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <p className="eyebrow mb-2 text-accent">{post.category}</p>
        <h3 className="display text-[1.75rem] leading-tight md:text-[2.1rem]">
          <a href={href} onClick={linkHandler(navigate, href)} className="link-sweep">
            {post.title}
          </a>
        </h3>
        <p className="mt-2 line-clamp-2 max-w-[62ch] text-ink-2">{post.excerpt}</p>
      </div>
      <div className="col-start-2 mt-3 md:col-start-3 md:mt-1.5">
        <PostMetaLine post={post} />
      </div>
    </li>
  )
}

function ListSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Memuat artikel…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-t border-line py-7 md:grid-cols-[4.5rem_minmax(0,1fr)_14rem] md:gap-x-8">
          <div className="skeleton h-7 w-9" />
          <div className="space-y-3">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-4/5" />
            <div className="skeleton h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Beranda publik: hero, pencarian real-time, filter kategori (pill), dan galeri artikel terbit.
export default function PublicArticleList({ navigate, user, onStartWriting }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [category, setCategory] = useState('')
  const [query, onQueryChange, setQuery] = useInput('')
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setPageMeta()
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let active = true
    setStatus('loading')
    getPublicPosts({ q: search, category })
      .then((data) => {
        if (!active) return
        setPosts(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [search, category, reloadKey])

  const isFiltered = Boolean(search || category)
  const featured = !isFiltered && posts.length > 0 ? posts[0] : null
  const rest = featured ? posts.slice(1) : posts

  const resetFilters = () => {
    setQuery('')
    setSearch('')
    setCategory('')
  }

  return (
    <div className="page pb-24">
      <section aria-labelledby="hero-title" className="grid gap-10 pb-12 pt-14 md:pt-20 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="eyebrow">Edisi {formatDate(new Date(), 'long')}</p>
          <h1 id="hero-title" className="display mt-5 text-[3.1rem] sm:text-7xl lg:text-[6.25rem]">
            Tulisan yang layak dibaca <em className="text-accent">pelan-pelan</em>.
          </h1>
        </div>
        <div className="flex flex-col justify-end gap-6 lg:col-span-4">
          <p className="text-lg leading-relaxed text-ink-2">
            Catatan teknologi, pendidikan, bisnis, dan gagasan dari para penulis Delcom — disusun rapi, tanpa kebisingan.
          </p>
          <div>
            <button type="button" className="btn btn-primary" onClick={user ? () => navigate('/author') : onStartWriting}>
              <IconPencil size={17} aria-hidden="true" /> {user ? 'Buka ruang kerja' : 'Mulai menulis'}
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Cari dan saring artikel" className="sticky top-16 z-30 -mx-1 bg-bg px-1 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative lg:w-96">
            <label htmlFor="article-search" className="sr-only">
              Cari artikel
            </label>
            <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="article-search"
              type="search"
              value={query}
              onChange={onQueryChange}
              placeholder="Cari judul, topik, atau kata kunci…"
              className="field !h-11 !rounded-full pl-10"
              autoComplete="off"
            />
          </div>
          <div role="group" aria-label="Filter kategori" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
            {['', ...categories].map((cat) => (
              <button key={cat || 'semua'} type="button" className="pill shrink-0" aria-pressed={category === cat} onClick={() => setCategory(cat)}>
                {cat || 'Semua'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <p className="sr-only" aria-live="polite">
        {status === 'ready' ? `${posts.length} artikel ditampilkan` : ''}
      </p>

      {status === 'loading' && <ListSkeleton />}

      {status === 'error' && (
        <div role="alert" className="border-t border-line py-16 text-center">
          <p className="display text-3xl">Artikel belum bisa dimuat.</p>
          <p className="mt-2 text-ink-2">{error}</p>
          <button type="button" className="btn btn-ghost mt-6" onClick={() => setReloadKey((k) => k + 1)}>
            <IconRefresh size={17} aria-hidden="true" /> Coba lagi
          </button>
        </div>
      )}

      {status === 'ready' && posts.length === 0 && (
        <div className="border-t border-line py-16 text-center">
          <p className="display text-3xl">Belum ada artikel yang cocok.</p>
          <p className="mt-2 text-ink-2">Coba kata kunci lain atau lihat semua kategori.</p>
          {isFiltered && (
            <button type="button" className="btn btn-ghost mt-6" onClick={resetFilters}>
              Tampilkan semua artikel
            </button>
          )}
        </div>
      )}

      {status === 'ready' && posts.length > 0 && (
        <>
          {featured && <FeaturedPost post={featured} navigate={navigate} />}
          {rest.length > 0 && (
            <section aria-labelledby="latest-title" className={featured ? 'mt-20' : ''}>
              <div className="flex items-baseline justify-between border-t-2 border-ink pt-4">
                <h2 id="latest-title" className="display text-3xl">
                  {isFiltered ? 'Hasil penelusuran' : 'Terbaru'}
                </h2>
                <p className="meta">{posts.length} artikel</p>
              </div>
              <ol className="mt-2">
                {rest.map((post, i) => (
                  <ArticleRow key={post.id} post={post} index={i + (featured ? 2 : 1)} navigate={navigate} />
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  )
}
