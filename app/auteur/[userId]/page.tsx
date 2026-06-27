import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { getAll() { return [] }, setAll() {} } }
);

async function getData(userId: string) {
  const [{ data: profile }, { data: books }] = await Promise.all([
    supabase.from('author_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('books').select('id, title, genre, cover_url, description').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  return { profile, books: books || [] };
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default async function AuteurIndividuelPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const { profile, books } = await getData(userId);

  if (!profile) return notFound();

  const photos: string[] = (profile.photo_urls || []).filter(Boolean);
  const authorName = profile.name || 'Autrice';
  const tagline = profile.tagline || '';
  const avatarUrl = profile.avatar_url || '';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/auteur" className="text-blue-600 text-sm hover:underline mb-6 inline-block">
          &larr; Tous les auteurs
        </Link>

        <div className="bg-white p-8 rounded-2xl shadow-md mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-80 flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={authorName} className="w-full aspect-square object-cover rounded-xl" />
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-6xl">
                  {initials(authorName)}
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-gray-900">{authorName}</h1>
              {tagline && <p className="text-blue-600 font-medium text-sm mt-1">{tagline}</p>}
              {profile.bio && (
                <p className="text-gray-600 mt-4 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Mon Univers en Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {photos.map((url, i) => (
                <img key={i} src={url} alt={`Univers ${i + 1}`} className="aspect-square object-cover rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mb-4 text-gray-800">Ses livres ({books.length})</h2>

        {books.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun livre disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {books.map((book) => (
              <Link key={book.id} href={`/book/${book.id}`} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-lg transition flex gap-4">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-24 bg-blue-900 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">Couv.</div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{book.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{book.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">{book.genre}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Bonus gratuit</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
