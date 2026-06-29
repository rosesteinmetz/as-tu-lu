'use client'

import { useState, useMemo } from 'react'
import BookCard from './BookCard'

const FICTION = [
  'Romance', 'Romance contemporaine', 'Romance historique', 'Romance paranormale',
  'Science-Fiction', 'Science-Fiction post-apocalyptique', 'Science-Fiction space opera',
  'Thriller', 'Thriller psychologique',
  'Fantasy', 'Fantasy urbaine', 'Fantasy épique',
  'Policier', 'Policier noir', 'Cosy Mystery',
  'Dystopie', 'Horreur', 'Humour',
  'Littérature générale', 'Littérature blanche', 'Historical fiction',
  'Nouvelle', 'Poésie', 'Jeunesse', 'Young Adult', 'New Adult',
]

const NON_FICTION = ['Développement personnel', 'Biographie', 'Essai']

export default function BookGrid({ books }: { books: any[] }) {
  const [filter, setFilter] = useState<'all' | 'free'>('all')
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set())

  const allGenres = useMemo(() => {
    const genres = new Set(books.map((b) => b.genre).filter(Boolean))
    return Array.from(genres).sort()
  }, [books])

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev)
      if (next.has(genre)) next.delete(genre)
      else next.add(genre)
      return next
    })
  }

  const filtered = useMemo(() => {
    let result = filter === 'all' ? books : books.filter((b) => b.is_free !== false)
    if (selectedGenres.size > 0) {
      result = result.filter((b) => selectedGenres.has(b.genre))
    }
    return result
  }, [books, filter, selectedGenres])

  const fictionBooks = useMemo(
    () => filtered.filter((b) => FICTION.includes(b.genre)),
    [filtered]
  )

  const nonFictionBooks = useMemo(
    () => filtered.filter((b) => NON_FICTION.includes(b.genre)),
    [filtered]
  )

  return (
    <>
      <div className="flex flex-wrap gap-4 justify-center mb-6 items-center">
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
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-2xl mx-auto">
        {allGenres.map((genre) => {
          const checked = selectedGenres.has(genre)
          return (
            <label
              key={genre}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition border ${checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleGenre(genre)}
                className="sr-only"
              />
              {genre}
            </label>
          )
        })}
        {selectedGenres.size > 0 && (
          <button
            onClick={() => setSelectedGenres(new Set())}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition"
          >
            Effacer filtres
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm mt-8">
          {filter === 'free' ? 'Aucun livre gratuit trouvé.' : 'Aucun livre trouvé.'}
        </p>
      ) : (
        <div className="w-full max-w-4xl">
          {fictionBooks.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Fiction</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {fictionBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}

          {nonFictionBooks.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Non-fiction</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nonFictionBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}