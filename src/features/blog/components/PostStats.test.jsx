import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PostStats from './PostStats'

describe('PostStats', () => {
  it('shows the three statistic cards with the publish ratio', () => {
    render(<PostStats stats={{ total: 4, published: 3, draft: 1 }} loading={false} />)
    expect(screen.getByRole('region', { name: 'Ringkasan statistik tulisan' })).toBeInTheDocument()
    expect(screen.getByTestId('stat-total')).toHaveTextContent('4')
    expect(screen.getByTestId('stat-published')).toHaveTextContent('3')
    expect(screen.getByTestId('stat-draft')).toHaveTextContent('1')
    expect(screen.getByText('75% dari total tulisan')).toBeInTheDocument()
    expect(screen.getByText('Belum diterbitkan')).toBeInTheDocument()
  })

  it('handles zero totals and the loading state', () => {
    const { rerender } = render(<PostStats stats={{ total: 0, published: 0, draft: 0 }} loading={false} />)
    expect(screen.getByText('0% dari total tulisan')).toBeInTheDocument()

    rerender(<PostStats stats={{ total: 0, published: 0, draft: 0 }} loading />)
    expect(screen.getByTestId('stat-total')).toHaveTextContent('—')
    expect(screen.getByText('Tayang di beranda publik')).toBeInTheDocument()
  })
})
