import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

async function getData() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  );

  const [{ data: profiles }, { data: books }] = await Promise.all([
    supabase.from('author_profiles').select('*').order('name'),
    supabase.from('books').select('user_id').not('user_id', 'is', null),
  ]);

  const countByUser: Record<string, number> = {};
  for (const b of books || []) {
    countByUser[b.user_id] = (countByUser[b.user_id] || 0) + 1;
  }

  return { profiles: profiles || [], countByUser };
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default async function AuteurListPage() {
  const { profiles, countByUser } = await getData();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 inline-block">
          &larr; Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Nos auteurs</h1>

        {profiles.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun auteur inscrit pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Link key={profile.id} href={`/auteur/${profile.slug || profile.user_id}`} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 text-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                    {initials(profile.name)}
                  </div>
                )}
                <h2 className="font-bold text-gray-900">{profile.name}</h2>
                {profile.tagline && <p className="text-xs text-blue-600 mt-1">{profile.tagline}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {countByUser[profile.user_id] || 0} livre{(countByUser[profile.user_id] || 0) !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}