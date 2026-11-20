import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  DEFAULT_PRODUCTION_API,
  buildUrl,
  clearSession,
  fetchData,
  getAccessToken,
  getBaseUrl,
  getUser,
  onUnauthorized,
  putAccessToken,
  putUser,
} from './apiHelper'

const respond = (body, { ok = true, status = 200 } = {}) => ({ ok, status, json: () => Promise.resolve(body) })

describe('apiHelper', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    onUnauthorized(null)
  })

  it('resolves the base URL from env, dev proxy, or production default', () => {
    expect(getBaseUrl()).toBe('/api')
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api//')
    expect(getBaseUrl()).toBe('https://api.example.test/api')
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('DEV', false)
    expect(getBaseUrl()).toBe(DEFAULT_PRODUCTION_API)
  })

  it('builds URLs relative to the base and keeps absolute URLs', () => {
    expect(buildUrl('https://other.test/x')).toBe('https://other.test/x')
    expect(buildUrl('/api/posts')).toBe('/api/posts')
    expect(buildUrl('//posts/1')).toBe('/api/posts/1')
  })

  it('stores and clears the session', () => {
    expect(getAccessToken()).toBe('')
    expect(getUser()).toBeNull()
    putAccessToken('tok')
    putUser({ id: 1 })
    expect(getAccessToken()).toBe('tok')
    expect(getUser()).toEqual({ id: 1 })
    clearSession()
    expect(getAccessToken()).toBe('')
    expect(getUser()).toBeNull()
    localStorage.setItem('delcom-user', '{broken')
    expect(getUser()).toBeNull()
  })

  it('sends GET requests without auth header when no token is stored', async () => {
    fetchMock.mockResolvedValue(respond({ status: 'success', data: [1] }))
    await expect(fetchData('/public/posts')).resolves.toEqual({ status: 'success', data: [1] })
    expect(fetchMock).toHaveBeenCalledWith('/api/public/posts', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
      signal: undefined,
    })
  })

  it('sends JSON bodies with the bearer token and respects auth: false', async () => {
    putAccessToken('secret')
    fetchMock.mockResolvedValue(respond({ data: {} }))
    await fetchData('/posts', { method: 'POST', body: { a: 1 } })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer secret' })
    expect(init.body).toBe('{"a":1}')

    await fetchData('/public/posts', { auth: false })
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined()
  })

  it('maps network failures to ApiError and rethrows aborts', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const err = await fetchData('/x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(0)

    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    fetchMock.mockRejectedValueOnce(abort)
    await expect(fetchData('/x')).rejects.toBe(abort)
  })

  it('throws ApiError with the server message or a status fallback', async () => {
    fetchMock.mockResolvedValueOnce(respond({ message: 'post not found' }, { ok: false, status: 404 }))
    await expect(fetchData('/posts/9')).rejects.toMatchObject({ message: 'post not found', status: 404 })

    fetchMock.mockResolvedValueOnce({ ok: false, status: 502, json: () => Promise.reject(new Error('not json')) })
    await expect(fetchData('/x')).rejects.toMatchObject({ message: 'Permintaan gagal (status 502).', status: 502 })
  })

  it('notifies the unauthorized handler only for rejected authenticated requests', async () => {
    const handler = vi.fn()
    fetchMock.mockResolvedValue(respond({ message: 'Unauthorized' }, { ok: false, status: 401 }))

    onUnauthorized(handler)
    await fetchData('/posts').catch(() => {})
    expect(handler).not.toHaveBeenCalled()

    putAccessToken('expired')
    await fetchData('/posts').catch(() => {})
    expect(handler).toHaveBeenCalledTimes(1)

    onUnauthorized(null)
    await fetchData('/posts').catch(() => {})
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
