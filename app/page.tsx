import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import BookGrid from './BookGrid';

export const dynamic = 'force-dynamic';

async function getBooks() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  const { data } = await supabase
    .from('books')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return data || [];
}

export default async function Home() {
  const books = await getBooks();

  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          As-tu lu ?
        </h1>
        <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl">
          Le point de rencontre entre lecteurs passionnés et auteurs francophones.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow-md">
            Connexion Auteur
          </Link>
        </div>
      </div>

      <BookGrid books={books} />
    </main>
  );
}