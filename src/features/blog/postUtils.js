// Helper presentasi artikel yang dipakai lintas komponen blog.

export function authorName(post) {
  const author = post.author || post.user
  if (!author) return 'Penulis Delcom'
  return author.name || author.username
}

export function postDate(post) {
  return post.published_at || post.updated_at || post.created_at
}

// Artikel terkait: kategori sama didahulukan, lalu yang terbaru.
export function relatedPosts(current, posts, limit = 3) {
  return posts
    .filter((p) => p.slug !== current.slug)
    .sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category))
    .slice(0, limit)
}
