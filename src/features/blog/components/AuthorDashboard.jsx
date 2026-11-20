import { useCallback, useEffect, useState } from 'react'
import { IconEye, IconPencil, IconPlus, IconRefresh, IconSearch, IconSparkles, IconTrash } from '@tabler/icons-react'
import KebabMenu from '../../../components/KebabMenu'
import useInput from '../../../hooks/useInput'
import { formatDate, setPageMeta, showConfirmDialog, showErrorAlert, showSuccessAlert } from '../../../helpers/toolsHelper'
import { createPost, deletePost, getMyPosts, getPostStats, togglePublish, updatePost } from '../api/blogApi'
import AiPostGeneratorModal from '../modals/AiPostGeneratorModal'
import PostModal from '../modals/PostModal'
import PostStats from './PostStats'

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'published', label: 'Terbit' },
  { id: 'draft', label: 'Draf' },
]
const EMPTY_STATS = { total: 0, published: 0, draft: 0 }

function matchesFilter(post, filter) {
  if (filter === 'all') return true
  return (filter === 'published') === post.is_published
}

// Ruang kerja penulis (/author): statistik, tabel artikel dengan menu kebab, toggle terbit,
// serta akses ke modal editor dan AI generator.
export default function AuthorDashboard({ user, navigate }) {
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState(EMPTY_STATS)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, onQuery] = useInput('')
  const [editor, setEditor] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [pendingId, setPendingId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [list, summary] = await Promise.all([getMyPosts(), getPostStats()])
      setPosts(list)
      setStats(summary)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    setPageMeta('Ruang Kerja', 'Kelola artikel, draf, dan AI generator di ruang kerja penulis Delcom Blog.')
    load()
  }, [load])

  const term = query.trim().toLowerCase()
  const visible = posts.filter((p) => matchesFilter(p, filter) && p.title.toLowerCase().includes(term))
  const counts = {
    all: posts.length,
    published: posts.filter((p) => p.is_published).length,
    draft: posts.filter((p) => !p.is_published).length,
  }

  const handleSave = async (payload, id) => {
    if (id) await updatePost(id, payload)
    else await createPost(payload)
    setEditor(null)
    showSuccessAlert(id ? 'Perubahan artikel disimpan' : payload.is_published ? 'Artikel diterbitkan' : 'Draf tersimpan')
    await load()
  }

  const handleToggle = async (post) => {
    setPendingId(post.id)
    try {
      const updated = await togglePublish(post.id)
      setPosts((list) => list.map((p) => (p.id === updated.id ? updated : p)))
      getPostStats()
        .then(setStats)
        .catch(() => {})
      showSuccessAlert(updated.is_published ? 'Artikel diterbitkan' : 'Artikel dikembalikan ke draf')
    } catch (err) {
      showErrorAlert(err.message)
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async (post) => {
    const confirmed = await showConfirmDialog({
      title: 'Hapus artikel?',
      text: `“${post.title}” akan dihapus permanen dan tidak bisa dikembalikan.`,
      confirmText: 'Hapus',
      danger: true,
    })
    if (!confirmed) return
    try {
      await deletePost(post.id)
      showSuccessAlert('Artikel dihapus')
      await load()
    } catch (err) {
      showErrorAlert(err.message)
    }
  }

  const applyDraft = (draft) => {
    setAiOpen(false)
    setEditor({
      initial: { title: draft.title, category: draft.category, excerpt: draft.excerpt, content: draft.content, is_published: false },
    })
  }

  const menuItems = (post) =>
    [
      post.is_published && {
        label: 'Lihat di blog',
        icon: <IconEye size={17} aria-hidden="true" />,
        onSelect: () => navigate(`/posts/${post.slug}`),
      },
      { label: 'Ubah', icon: <IconPencil size={17} aria-hidden="true" />, onSelect: () => setEditor({ initial: post }) },
      { label: 'Hapus', icon: <IconTrash size={17} aria-hidden="true" />, danger: true, onSelect: () => handleDelete(post) },
    ].filter(Boolean)

  const firstName = (user.name || user.username).split(' ')[0]

  return (
    <div className="page-wide pb-24 pt-10">
      <header className="fade-up flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Ruang kerja</p>
          <h1 className="display mt-3 text-5xl sm:text-6xl">Halo, {firstName}.</h1>
          <p className="mt-2 max-w-xl text-ink-2">Kelola draf, terbitkan tulisan, atau minta asisten AI menyusun kerangka berbasis sumber web.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setAiOpen(true)}>
            <IconSparkles size={17} aria-hidden="true" /> AI Generator
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditor({ initial: null })}>
            <IconPlus size={17} aria-hidden="true" /> Tulis artikel
          </button>
        </div>
      </header>

      <div className="mt-10">
        <PostStats stats={stats} loading={status === 'loading'} />
      </div>

      <section aria-labelledby="my-posts-title" className="mt-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 id="my-posts-title" className="display text-3xl">
            Tulisan saya
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div role="group" aria-label="Saring berdasarkan status" className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" className="pill" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                  <span className="ml-2 tabular-nums">{counts[f.id]}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <label htmlFor="my-post-search" className="sr-only">
                Cari tulisan
              </label>
              <IconSearch size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="my-post-search"
                type="search"
                className="field !h-10 !rounded-full pl-10"
                placeholder="Cari judul…"
                value={query}
                onChange={onQuery}
              />
            </div>
          </div>
        </div>

        {status === 'loading' && (
          <div role="status" aria-busy="true" className="mt-6 space-y-3">
            <span className="sr-only">Memuat tulisan…</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div role="alert" className="mt-6 rounded-2xl border border-line p-8 text-center">
            <p className="display text-2xl">Tulisan belum bisa dimuat.</p>
            <p className="mt-1 text-ink-2">{error}</p>
            <button type="button" className="btn btn-ghost mt-5" onClick={load}>
              <IconRefresh size={17} aria-hidden="true" /> Coba lagi
            </button>
          </div>
        )}

        {status === 'ready' && visible.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-line-strong p-12 text-center">
            <p className="display text-3xl">{posts.length === 0 ? 'Belum ada tulisan.' : 'Tidak ada tulisan yang cocok.'}</p>
            <p className="mt-2 text-ink-2">
              {posts.length === 0 ? 'Mulai dari halaman kosong atau biarkan AI menyiapkan kerangka.' : 'Ubah filter atau kata kunci pencarian.'}
            </p>
            {posts.length === 0 && (
              <button type="button" className="btn btn-primary mt-6" onClick={() => setEditor({ initial: null })}>
                <IconPlus size={17} aria-hidden="true" /> Tulis artikel pertama
              </button>
            )}
          </div>
        )}

        {status === 'ready' && visible.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="data-table min-w-[54rem]">
              <caption className="sr-only">Daftar tulisan saya</caption>
              <thead>
                <tr>
                  <th scope="col">Judul</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Status</th>
                  <th scope="col">Waktu baca</th>
                  <th scope="col">Diperbarui</th>
                  <th scope="col">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((post) => (
                  <tr key={post.id}>
                    <td className="max-w-[30rem]">
                      <p className="truncate font-semibold text-ink">{post.title}</p>
                      <p className="meta truncate">/posts/{post.slug}</p>
                    </td>
                    <td>{post.category}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          className="switch"
                          aria-checked={post.is_published}
                          aria-label={`Terbitkan “${post.title}”`}
                          disabled={pendingId === post.id}
                          onClick={() => handleToggle(post)}
                        />
                        <span className={`badge ${post.is_published ? 'badge-published' : 'badge-draft'}`}>
                          {post.is_published ? 'Terbit' : 'Draf'}
                        </span>
                      </div>
                    </td>
                    <td className="tabular-nums">{post.reading_time} mnt</td>
                    <td className="meta whitespace-nowrap">{formatDate(post.updated_at)}</td>
                    <td className="text-right">
                      <KebabMenu label={`Aksi untuk “${post.title}”`} items={menuItems(post)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PostModal open={editor !== null} initial={editor?.initial} onClose={() => setEditor(null)} onSubmit={handleSave} />
      <AiPostGeneratorModal open={aiOpen} onClose={() => setAiOpen(false)} onUseDraft={applyDraft} />
    </div>
  )
}
