import { useCallback, useEffect, useRef, useState } from 'react'
import { IconRefresh, IconX } from '@tabler/icons-react'
import { formatDate, initials, linkHandler, setPageMeta, showErrorAlert } from '../../../helpers/toolsHelper'
import { authorName } from '../../blog/postUtils'
import { getAllPosts, getUserPosts, getUsers } from '../api/adminApi'

const TABS = [
  { id: 'users', label: 'Pengguna' },
  { id: 'posts', label: 'Semua artikel' },
]

function PostsTable({ posts, navigate }) {
  if (posts.length === 0) {
    return <p className="mt-6 rounded-2xl border border-dashed border-line-strong p-10 text-center text-ink-2">Belum ada artikel.</p>
  }
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="data-table min-w-[56rem]">
        <caption className="sr-only">Arsip artikel</caption>
        <thead>
          <tr>
            <th scope="col">Judul</th>
            <th scope="col">Penulis</th>
            <th scope="col">Kategori</th>
            <th scope="col">Status</th>
            <th scope="col">Waktu baca</th>
            <th scope="col">Diperbarui</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const href = `/posts/${post.slug}`
            return (
              <tr key={post.id}>
                <td className="max-w-[28rem]">
                  {post.is_published ? (
                    <a href={href} onClick={linkHandler(navigate, href)} className="font-semibold underline-offset-4 hover:underline">
                      {post.title}
                    </a>
                  ) : (
                    <span className="font-semibold">{post.title}</span>
                  )}
                </td>
                <td>{authorName(post)}</td>
                <td>{post.category}</td>
                <td>
                  <span className={`badge ${post.is_published ? 'badge-published' : 'badge-draft'}`}>{post.is_published ? 'Terbit' : 'Draf'}</span>
                </td>
                <td className="tabular-nums">{post.reading_time} mnt</td>
                <td className="meta whitespace-nowrap">{formatDate(post.updated_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Panel admin (/admin): direktori pengguna beserta statistik dan arsip seluruh artikel.
export default function AdminDashboard({ navigate }) {
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('users')
  const [selected, setSelected] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [userPostsLoading, setUserPostsLoading] = useState(false)
  const tabRefs = useRef({})

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [userList, postList] = await Promise.all([getUsers(), getAllPosts()])
      setUsers(userList)
      setPosts(postList)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    setPageMeta('Panel Admin', 'Monitoring pengguna dan artikel Delcom Blog.')
    load()
  }, [load])

  const showUserPosts = async (user) => {
    setSelected(user)
    setTab('posts')
    setUserPostsLoading(true)
    try {
      setUserPosts(await getUserPosts(user.id))
    } catch (err) {
      setUserPosts([])
      showErrorAlert(err.message)
    } finally {
      setUserPostsLoading(false)
    }
  }

  const onTabKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const next = tab === 'users' ? 'posts' : 'users'
    setTab(next)
    tabRefs.current[next].focus()
  }

  const published = posts.filter((p) => p.is_published).length
  const tiles = [
    { label: 'Pengguna', value: users.length, note: `${users.filter((u) => u.role === 'admin').length} admin` },
    { label: 'Penulis aktif', value: users.filter((u) => u.total_posts > 0).length, note: 'Memiliki minimal satu artikel' },
    { label: 'Artikel terbit', value: published, note: `dari ${posts.length} total artikel` },
  ]

  return (
    <div className="page-wide pb-24 pt-10">
      <header className="fade-up">
        <p className="eyebrow">Panel admin</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">Ikhtisar sistem.</h1>
        <p className="mt-2 max-w-xl text-ink-2">Pantau seluruh akun dan arsip tulisan dari semua penulis.</p>
      </header>

      {status === 'loading' && (
        <div role="status" aria-busy="true" className="mt-10 space-y-3">
          <span className="sr-only">Memuat data admin…</span>
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="mt-10 rounded-2xl border border-line p-8 text-center">
          <p className="display text-2xl">Data belum bisa dimuat.</p>
          <p className="mt-1 text-ink-2">{error}</p>
          <button type="button" className="btn btn-ghost mt-5" onClick={load}>
            <IconRefresh size={17} aria-hidden="true" /> Coba lagi
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <section aria-label="Ringkasan sistem" className="mt-10 grid border-y border-line sm:grid-cols-3">
            {tiles.map((tile, i) => (
              <div key={tile.label} className={`py-6 sm:px-8 ${i === 0 ? 'sm:pl-0' : 'border-t border-line sm:border-l sm:border-t-0'}`}>
                <p className="eyebrow">{tile.label}</p>
                <p className="display mt-2 text-6xl tabular-nums">{tile.value}</p>
                <p className="meta mt-1">{tile.note}</p>
              </div>
            ))}
          </section>

          <div role="tablist" aria-label="Data admin" className="mt-12 flex gap-1 border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el
                }}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={onTabKeyDown}
                className="-mb-px border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-muted aria-selected:border-ink aria-selected:text-ink"
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'users' && (
            <div id="panel-users" role="tabpanel" aria-labelledby="tab-users" tabIndex={0} className="mt-6 overflow-x-auto">
              <table className="data-table min-w-[60rem]">
                <caption className="sr-only">Direktori pengguna</caption>
                <thead>
                  <tr>
                    <th scope="col">Pengguna</th>
                    <th scope="col">Email</th>
                    <th scope="col">Peran</th>
                    <th scope="col">Artikel</th>
                    <th scope="col">Terbit</th>
                    <th scope="col">Bergabung</th>
                    <th scope="col">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-raised text-xs font-semibold" aria-hidden="true">
                            {initials(u.name || u.username)}
                          </span>
                          <div>
                            <p className="font-semibold">{u.name || u.username}</p>
                            <p className="meta">
                              @{u.username} · ID {u.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge badge-plain">{u.role === 'admin' ? 'Admin' : 'Penulis'}</span>
                      </td>
                      <td className="tabular-nums">{u.total_posts}</td>
                      <td className="tabular-nums">{u.total_published}</td>
                      <td className="meta whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => showUserPosts(u)}
                          aria-label={`Lihat artikel milik ${u.name || u.username}`}
                        >
                          Lihat artikel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'posts' && (
            <div id="panel-posts" role="tabpanel" aria-labelledby="tab-posts" tabIndex={0}>
              {selected && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-ink-2">
                    Menampilkan artikel milik <strong className="text-ink">{selected.name || selected.username}</strong>
                  </p>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
                    <IconX size={15} aria-hidden="true" /> Tampilkan semua
                  </button>
                </div>
              )}
              {userPostsLoading ? (
                <div role="status" aria-busy="true" className="mt-6">
                  <span className="sr-only">Memuat artikel pengguna…</span>
                  <div className="skeleton h-14 w-full" />
                </div>
              ) : (
                <PostsTable posts={selected ? userPosts : posts} navigate={navigate} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
