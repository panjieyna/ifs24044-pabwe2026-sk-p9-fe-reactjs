import { fetchData } from '../../../helpers/apiHelper'

export const DEFAULT_CATEGORIES = ['Teknologi', 'Pendidikan', 'Gaya Hidup', 'Bisnis', 'Opini', 'Umum']

function toQuery(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

// ---------- Publik ----------
export async function getCategories() {
  return (await fetchData('/public/categories', { auth: false })).data
}

export async function getPublicPosts({ q = '', category = '' } = {}) {
  return (await fetchData(`/public/posts${toQuery({ q, category })}`, { auth: false })).data
}

export async function getPublicPost(slug) {
  return (await fetchData(`/public/posts/${encodeURIComponent(slug)}`, { auth: false })).data
}

// ---------- Penulis ----------
export async function getMyPosts() {
  return (await fetchData('/posts')).data
}

export async function getPostStats() {
  return (await fetchData('/posts/stats')).data
}

export async function createPost(payload) {
  return (await fetchData('/posts', { method: 'POST', body: payload })).data
}

export async function updatePost(id, payload) {
  return (await fetchData(`/posts/${id}`, { method: 'PUT', body: payload })).data
}

export async function togglePublish(id) {
  return (await fetchData(`/posts/${id}/toggle-publish`, { method: 'PATCH' })).data
}

export async function deletePost(id) {
  await fetchData(`/posts/${id}`, { method: 'DELETE' })
}

export async function generatePost(payload, signal) {
  return (await fetchData('/posts/ai-generate', { method: 'POST', body: payload, signal })).data
}
