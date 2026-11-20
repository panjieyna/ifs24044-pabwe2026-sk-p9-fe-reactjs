import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchData } from '../../../helpers/apiHelper'
import * as blogApi from './blogApi'

vi.mock('../../../helpers/apiHelper', () => ({ fetchData: vi.fn() }))

describe('blogApi', () => {
  beforeEach(() => {
    fetchData.mockReset()
    fetchData.mockResolvedValue({ status: 'success', data: 'DATA' })
  })

  it('calls the public endpoints without auth', async () => {
    await expect(blogApi.getCategories()).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/public/categories', { auth: false })

    await blogApi.getPublicPosts()
    expect(fetchData).toHaveBeenLastCalledWith('/public/posts', { auth: false })
    await blogApi.getPublicPosts({ q: 'go lang', category: 'Gaya Hidup' })
    expect(fetchData).toHaveBeenLastCalledWith('/public/posts?q=go+lang&category=Gaya+Hidup', { auth: false })

    await blogApi.getPublicPost('judul/aneh')
    expect(fetchData).toHaveBeenLastCalledWith('/public/posts/judul%2Faneh', { auth: false })
  })

  it('calls the author endpoints with the right methods', async () => {
    await expect(blogApi.getMyPosts()).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/posts')
    await blogApi.getPostStats()
    expect(fetchData).toHaveBeenLastCalledWith('/posts/stats')
    await blogApi.createPost({ title: 'A' })
    expect(fetchData).toHaveBeenLastCalledWith('/posts', { method: 'POST', body: { title: 'A' } })
    await blogApi.updatePost(3, { title: 'B' })
    expect(fetchData).toHaveBeenLastCalledWith('/posts/3', { method: 'PUT', body: { title: 'B' } })
    await blogApi.togglePublish(3)
    expect(fetchData).toHaveBeenLastCalledWith('/posts/3/toggle-publish', { method: 'PATCH' })
    await expect(blogApi.deletePost(3)).resolves.toBeUndefined()
    expect(fetchData).toHaveBeenLastCalledWith('/posts/3', { method: 'DELETE' })

    const signal = new AbortController().signal
    await expect(blogApi.generatePost({ topic: 'x' }, signal)).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/posts/ai-generate', { method: 'POST', body: { topic: 'x' }, signal })
  })

  it('exposes the default category list', () => {
    expect(blogApi.DEFAULT_CATEGORIES).toEqual(['Teknologi', 'Pendidikan', 'Gaya Hidup', 'Bisnis', 'Opini', 'Umum'])
  })
})
