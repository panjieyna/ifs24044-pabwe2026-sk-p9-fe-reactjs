import { describe, expect, it } from 'vitest'
import { makePost } from '../../test/fixtures'
import { authorName, postDate, relatedPosts } from './postUtils'

describe('postUtils', () => {
  it('resolves the author display name', () => {
    expect(authorName({ author: { name: 'Siti', username: 'siti' } })).toBe('Siti')
    expect(authorName({ user: { name: '', username: 'andi' } })).toBe('andi')
    expect(authorName({})).toBe('Penulis Delcom')
  })

  it('prefers the publish date, then updated, then created', () => {
    expect(postDate({ published_at: 'p', updated_at: 'u', created_at: 'c' })).toBe('p')
    expect(postDate({ published_at: null, updated_at: 'u', created_at: 'c' })).toBe('u')
    expect(postDate({ created_at: 'c' })).toBe('c')
  })

  it('picks related posts from the same category first, excluding the current one', () => {
    const current = makePost({ slug: 'now', category: 'Opini' })
    const others = [makePost({ category: 'Bisnis' }), makePost({ category: 'Opini' }), current, makePost({ category: 'Umum' }), makePost({ category: 'Opini' })]
    const related = relatedPosts(current, others)
    expect(related).toHaveLength(3)
    expect(related.map((p) => p.category)).toEqual(['Opini', 'Opini', 'Bisnis'])
    expect(related).not.toContain(current)
  })
})
