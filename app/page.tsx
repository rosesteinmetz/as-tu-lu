import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import BookCard from './BookCard';

async function getBooks() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const { data } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

function groupByGenre(books: any[]) {
  const grouped: Record<string, typeof books> = {};
  for (const book of books) {
    if (!grouped[book.genre]) grouped[book.genre] = [];
    grouped[book.genre].push(book);
  }
  return grouped;
}

export default async function Home() {
  const books = await getBooks();
  const grouped = groupByGenre(books);
  const sortedGenres = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);

  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          As-tu-lu ?
        </h1>
        <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl">
          Le point de rencontre entre lecteurs passionnés et auteurs francophones. L&apos;alternative française à BookFunnel.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Espace Auteur
          </Link>
          {books.length > 0 && (
            <Link href={`/book/${books[0].id}`} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
              Voir comment ça marche
            </Link>
          )}
        </div>
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

      {books.length === 0 && (
        <p className="text-gray-500 text-sm mt-8">Aucun livre disponible pour le moment.</p>
      )}
    </main>
  );
}
