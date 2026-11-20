// Data uji bersama.
let nextId = 1

export function makeUser(overrides = {}) {
  return {
    id: 1,
    name: 'Budi Santoso',
    username: 'budi',
    email: 'budi@example.com',
    role: 'member',
    created_at: '2026-11-01T08:00:00Z',
    updated_at: '2026-11-01T08:00:00Z',
    ...overrides,
  }
}

export function makePost(overrides = {}) {
  const id = nextId++
  return {
    id,
    user_id: 1,
    title: `Artikel ${id}`,
    slug: `artikel-${id}`,
    category: 'Teknologi',
    excerpt: `Ringkasan artikel ${id}`,
    content: `## Isi\n\nKonten artikel ${id}`,
    cover_image_path: '',
    is_published: true,
    status: 'published',
    published_at: '2026-11-10T08:00:00Z',
    reading_time: 3,
    created_at: '2026-11-09T08:00:00Z',
    updated_at: '2026-11-11T08:00:00Z',
    author: { id: 1, name: 'Budi Santoso', username: 'budi' },
    user: { id: 1, name: 'Budi Santoso', username: 'budi' },
    ...overrides,
  }
}

// Promise yang dapat diselesaikan manual dari tes.
export function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

export const theme = (overrides = {}) => ({
  mode: 'light',
  toggleMode: () => {},
  accent: 'vermilion',
  setAccent: () => {},
  accents: [
    { id: 'vermilion', name: 'Vermilion', swatch: '#B8361C' },
    { id: 'cobalt', name: 'Kobalt', swatch: '#2343C8' },
  ],
  ...overrides,
})
