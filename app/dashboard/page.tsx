'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { compressImage, IMAGE_MAX_DIMENSION } from '@/lib/compress';

type Book = { id: string; title: string; author: string; genre: string; cover_url: string | null; sort_order: number };

export default function DashboardAuteur() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [titre, setTitre] = useState('');
  const [auteur, setAuteur] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Romance');
  const [isFree, setIsFree] = useState(true);
  const [externalLink, setExternalLink] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [epub, setEpub] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id;
      fetch(`/api/books${userId ? `?user_id=${userId}` : ''}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setBooks(data); setLoadingBooks(false); })
        .catch(() => setLoadingBooks(false));
    });
  }, []);
  const [message, setMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleReorder = async (bookId: string, direction: 'up' | 'down') => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`/api/books/${bookId}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ direction }),
    });

    if (res.ok) {
      const userId = session?.user?.id;
      const data = await fetch(`/api/books${userId ? `?user_id=${userId}` : ''}`).then(r => r.json());
      if (Array.isArray(data)) setBooks(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const formData = new FormData();
    formData.append('title', titre);
    formData.append('author', auteur);
    formData.append('genre', genre);
    formData.append('description', description);
    formData.append('is_free', String(isFree));
    if (externalLink) formData.append('external_link', externalLink);
    if (cover) {
      formData.append('cover', await compressImage(cover, { maxWidthOrHeight: IMAGE_MAX_DIMENSION }));
    }
    if (epub) formData.append('epub', epub);
    if (pdf) formData.append('pdf', pdf);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage(`Livre "${titre}" publié avec succès !`);
      setTitre('');
      setAuteur('');
      setDescription('');
      setGenre('Romance');
      setIsFree(true);
      setExternalLink('');
      setCover(null);
      setEpub(null);
      setPdf(null);
      setAcceptedTerms(false);
      router.refresh();
      setFormKey((k) => k + 1);
    } catch (err) {
      setMessage(`Erreur : ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Espace Créateur</h1>
        <div className="flex gap-3 items-center flex-wrap">
          <Link href="/dashboard/edit-profile" className="text-sm text-gray-500 hover:text-blue-600 underline">Profil</Link>
          <Link href="/dashboard/subscribers" className="text-sm text-gray-500 hover:text-blue-600 underline">Abonnés</Link>
          <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-blue-600 underline">Newsletter</Link>
          <form action="/auth/logout" method="post">
            <button type="submit" className="text-sm text-gray-500 hover:text-red-600 underline">Déconnexion</button>
          </form>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm ${message.startsWith('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Mes livres</h2>
        {loadingBooks ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : books.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun livre pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {books.map((book, idx) => (
              <div key={book.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleReorder(book.id, 'up')}
                      disabled={idx === 0}
                      className="text-xs leading-none text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Monter"
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => handleReorder(book.id, 'down')}
                      disabled={idx === books.length - 1}
                      className="text-xs leading-none text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Descendre"
                    >▼</button>
                  </div>
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-blue-900 text-white rounded flex items-center justify-center text-xs font-bold">C</div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.genre}</p>
                  </div>
                </div>
                <Link href={`/dashboard/edit-book/${book.id}`} className="text-sm text-blue-600 hover:underline">
                  Modifier
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Ajouter un nouvel Ebook</h2>

        <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du livre</label>
            <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'auteur</label>
            <input type="text" value={auteur} onChange={(e) => setAuteur(e.target.value)} placeholder="Nom d'auteur" className="w-full border p-2.5 rounded-lg text-sm" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre littéraire</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white">
              <option value="Romance">Romance</option>
              <option value="Romance contemporaine">Romance contemporaine</option>
              <option value="Romance historique">Romance historique</option>
              <option value="Romance paranormale">Romance paranormale</option>
              <option value="Science-Fiction">Science-Fiction</option>
              <option value="Science-Fiction post-apocalyptique">Science-Fiction post-apocalyptique</option>
              <option value="Science-Fiction space opera">Science-Fiction space opera</option>
              <option value="Thriller">Thriller</option>
              <option value="Thriller psychologique">Thriller psychologique</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Fantasy urbaine">Fantasy urbaine</option>
              <option value="Fantasy épique">Fantasy épique</option>
              <option value="Policier">Policier</option>
              <option value="Policier noir">Policier noir</option>
              <option value="Cosy Mystery">Cosy Mystery</option>
              <option value="Développement personnel">Développement personnel</option>
              <option value="Dystopie">Dystopie</option>
              <option value="Horreur">Horreur</option>
              <option value="Humour">Humour</option>
              <option value="Littérature générale">Littérature générale</option>
              <option value="Littérature blanche">Littérature blanche</option>
              <option value="Historical fiction">Historical fiction</option>
              <option value="Nouvelle">Nouvelle</option>
              <option value="Poésie">Poésie</option>
              <option value="Jeunesse">Jeunesse</option>
              <option value="Young Adult">Young Adult</option>
              <option value="New Adult">New Adult</option>
              <option value="Biographie">Biographie</option>
              <option value="Essai">Essai</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Résumé</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border p-2.5 rounded-lg text-sm" required />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Type de livre</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="book_type" checked={isFree} onChange={() => setIsFree(true)} className="accent-blue-600" />
                <span className="text-gray-700">Livre gratuit (téléchargement sur le site)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="book_type" checked={!isFree} onChange={() => setIsFree(false)} className="accent-blue-600" />
                <span className="text-gray-700">Livre payant (lien externe)</span>
              </label>
            </div>

            {!isFree && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien d'achat (Amazon, Fnac, etc.)</label>
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://www.amazon.fr/dp/..."
                  className="w-full border p-2.5 rounded-lg text-sm"
                  required={!isFree}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couverture du livre (image)</label>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} className="text-sm w-full" />
          </div>

          {isFree && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Fichiers du livre</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Format ePub</label>
                <input type="file" accept=".epub" onChange={(e) => setEpub(e.target.files?.[0] || null)} className="text-xs w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Format PDF</label>
                <input type="file" accept=".pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} className="text-xs w-full" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Le format Kindle (MOBI) n'est plus requis — Amazon accepte l'ePub directement via <a href="https://www.amazon.fr/sendtokindle" target="_blank" className="text-blue-500 underline">Send to Kindle</a>.</p>
          </div>
          )}

          <label className="flex gap-2 text-xs text-gray-500 items-start border-t pt-4">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} required className="mt-0.5" />
            Je certifie détenir les droits d'auteur du contenu que je publie et j&apos;accepte les <Link href="/cgu-auteurs" target="_blank" className="text-blue-600 underline">conditions d'utilisation des auteurs</Link>.
          </label>

          <button type="submit" disabled={loading || !acceptedTerms} className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm mt-4 disabled:opacity-50">
            {loading ? 'Publication en cours...' : 'Publier le livre sur mon profil'}
          </button>
        </form>
        <div className="mt-4 bg-amber-50 p-3 rounded-lg text-xs text-amber-700">
          Après publication, pense à configurer ta newsletter dans <Link href="/dashboard/settings" className="text-blue-600 underline">Paramètres → Newsletter</Link> pour récupérer les emails de tes lecteurs.
        </div>
      </div>
    </div>
  );
}
