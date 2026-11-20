import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import useInput from './useInput'

describe('useInput', () => {
  it('binds value, onChange, and setter', () => {
    const { result } = renderHook(() => useInput())
    expect(result.current[0]).toBe('')

    act(() => result.current[1]({ target: { value: 'halo' } }))
    expect(result.current[0]).toBe('halo')

    act(() => result.current[2]('reset'))
    expect(result.current[0]).toBe('reset')
  })

  it('accepts an initial value', () => {
    const { result } = renderHook(() => useInput('awal'))
    expect(result.current[0]).toBe('awal')
  })
})
