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
  is_free?: boolean
  external_link?: string | null
}

export default function BookCard({ book }: { book: Book }) {
  const router = useRouter()

  const goToAuthor = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    router.push(`/auteur/${book.user_id}`)
  }

  const CardContent = () => (
    <>
      {book.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-full aspect-[210/297] object-contain bg-gray-100 rounded-lg mb-3" />
      ) : (
        <div className="w-full aspect-[210/297] bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold mb-3">
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
        {book.is_free !== false ? (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">GRATUIT</span>
        ) : (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">EN VENTE</span>
        )}
      </div>
      {book.is_free !== false && (
        <p className="text-xs text-gray-400 mt-1">
          {book.download_count || 0} téléchargement{book.download_count !== 1 ? 's' : ''}
        </p>
      )}
    </>
  )

  if (book.is_free === false && book.external_link) {
    return (
      <a
        href={book.external_link}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 block"
      >
        <CardContent />
      </a>
    )
  }

  return (
    <Link
      href={`/book/${book.id}`}
      className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 block"
    >
      <CardContent />
    </Link>
  )
}