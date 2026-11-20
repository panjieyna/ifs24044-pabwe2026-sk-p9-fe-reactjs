// Wrapper fetch terpusat: base URL, Bearer token, format respons {status, message, data},
// serta penyimpanan sesi (token & user) di localStorage.

export const DEFAULT_PRODUCTION_API = 'https://ifs24044-pabwe2026-sk-p9-be-golang-gin.s1if.cloud/api'

const TOKEN_KEY = 'delcom-token'
const USER_KEY = 'delcom-user'

let unauthorizedHandler = null

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL
  if (configured) return configured.replace(/\/+$/, '')
  return import.meta.env.DEV ? '/api' : DEFAULT_PRODUCTION_API
}

export function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  let clean = path.replace(/^\/+/, '')
  if (clean.startsWith('api/')) clean = clean.slice(4)
  return `${getBaseUrl()}/${clean}`
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function putAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null
  } catch {
    return null
  }
}

export function putUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export function clearSession() {
  putAccessToken('')
  putUser(null)
}

// Dipanggil saat request terautentikasi ditolak (token kedaluwarsa / tidak valid).
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

export async function fetchData(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? getAccessToken() : ''
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.', 0)
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && token && unauthorizedHandler) unauthorizedHandler()
    throw new ApiError(result.message || `Permintaan gagal (status ${response.status}).`, response.status)
  }
  return result
}
