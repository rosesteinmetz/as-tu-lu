'use client'

import { useState, useMemo } from 'react'
import BookCard from './BookCard'

export default function BookGrid({ books }: { books: any[] }) {
  const [filter, setFilter] = useState<'all' | 'free'>('all')
  const [selectedGenre, setSelectedGenre] = useState('')

  const allGenres = useMemo(() => {
    const genres = new Set(books.map((b) => b.genre).filter(Boolean))
    return Array.from(genres).sort()
  }, [books])

  const filtered = useMemo(() => {
    let result = filter === 'all' ? books : books.filter((b) => b.is_free !== false)
    if (selectedGenre) result = result.filter((b) => b.genre === selectedGenre)
    return result
  }, [books, filter, selectedGenre])

  function groupByGenre(books: any[]) {
    const grouped: Record<string, typeof books> = {}
    for (const book of books) {
      if (!grouped[book.genre]) grouped[book.genre] = []
      grouped[book.genre].push(book)
    }
    return grouped
  }

  const grouped = groupByGenre(filtered)
  const sortedGenres = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length)

  return (
    <>
      <div className="flex flex-wrap gap-4 justify-center mb-8 items-center">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Tous les livres
        </button>
        <button
          onClick={() => setFilter('free')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${filter === 'free' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Livres gratuits
        </button>
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les genres</option>
          {allGenres.map((genre) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {sortedGenres.map((genre) => (
        <div key={genre} className="w-full max-w-4xl mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">{genre}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {grouped[genre].map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-gray-500 text-sm mt-8">
          {filter === 'free' ? 'Aucun livre gratuit disponible pour le moment.' : 'Aucun livre disponible pour le moment.'}
        </p>
      )}
    </>
  )
}