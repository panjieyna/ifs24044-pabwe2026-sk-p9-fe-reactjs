import { describe, expect, it, vi } from 'vitest'
import { fetchData } from '../../../helpers/apiHelper'
import { getAllPosts, getUserPosts, getUsers } from './adminApi'

vi.mock('../../../helpers/apiHelper', () => ({ fetchData: vi.fn(() => Promise.resolve({ data: 'DATA' })) }))

describe('adminApi', () => {
  it('calls the admin monitoring endpoints', async () => {
    await expect(getUsers()).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/admin/users')
    await expect(getAllPosts()).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/admin/posts')
    await expect(getUserPosts(7)).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/admin/users/7/posts')
  })
})
