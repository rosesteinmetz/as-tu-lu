'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Book = {
  id: string
  title: string
  author: string
  genre: string
  cover_url?: string | null
  user_id?: string | null
  download_count?: number
}

export default function BookCard({ book }: { book: Book }) {
  const router = useRouter()

  // Quick tap on the whole card navigates to the book page.
  // Clicking the author name navigates to the author page instead.
  const goToAuthor = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    router.push(`/auteur/${book.user_id}`)
  }

  return (
    <Link
      href={`/book/${book.id}`}
      className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 block"
    >
      {book.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-full h-48 object-cover rounded-lg mb-3" />
      ) : (
        <div className="w-full h-48 bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold mb-3">
          [Couverture]
        </div>
      )}
      <h3 className="font-bold text-gray-900">{book.title}</h3>
      <p className="text-sm text-gray-500">
        {book.user_id ? (
          <span
            role="link"
            tabIndex={0}
            className="hover:text-blue-600 cursor-pointer"
            onClick={goToAuthor}
            onKeyDown={(e) => { if (e.key === 'Enter') goToAuthor(e as any) }}
          >
            {book.author}
          </span>
        ) : (
          book.author
        )}
      </p>
      <div className="flex gap-2 mt-2 flex-wrap">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">{book.genre}</span>
        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Bonus gratuit</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {book.download_count || 0} téléchargement{book.download_count !== 1 ? 's' : ''}
      </p>
    </Link>
  )
}
