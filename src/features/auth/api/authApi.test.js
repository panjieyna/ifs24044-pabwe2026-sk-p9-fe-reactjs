import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchData } from '../../../helpers/apiHelper'
import * as authApi from './authApi'

vi.mock('../../../helpers/apiHelper', () => ({ fetchData: vi.fn() }))

describe('authApi', () => {
  beforeEach(() => {
    fetchData.mockReset()
    fetchData.mockResolvedValue({ data: 'DATA' })
  })

  it('logs in and registers without sending an existing token', async () => {
    await expect(authApi.login({ username: 'budi', password: 'p' })).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/auth/login', { method: 'POST', body: { username: 'budi', password: 'p' }, auth: false })

    await authApi.register({ name: 'B', username: 'b', email: 'b@x.id', password: 'rahasia' })
    expect(fetchData).toHaveBeenLastCalledWith('/auth/register', {
      method: 'POST',
      body: { name: 'B', username: 'b', email: 'b@x.id', password: 'rahasia' },
      auth: false,
    })
  })

  it('reads and updates the profile', async () => {
    await expect(authApi.getProfile()).resolves.toBe('DATA')
    expect(fetchData).toHaveBeenLastCalledWith('/auth/profile')
    await authApi.updateProfile({ name: 'Baru' })
    expect(fetchData).toHaveBeenLastCalledWith('/auth/profile', { method: 'PUT', body: { name: 'Baru' } })
  })

  it('logs out and swallows server errors', async () => {
    await expect(authApi.logout()).resolves.toBeUndefined()
    expect(fetchData).toHaveBeenLastCalledWith('/auth/logout', { method: 'POST' })
    fetchData.mockRejectedValueOnce(new Error('offline'))
    await expect(authApi.logout()).resolves.toBeUndefined()
  })
})
