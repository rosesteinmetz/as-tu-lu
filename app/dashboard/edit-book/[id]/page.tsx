'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { compressImage, IMAGE_MAX_DIMENSION } from '@/lib/compress';
import Link from 'next/link';

export default function EditBookPage() {
  const { id } = useParams();
  const router = useRouter();
  const [titre, setTitre] = useState('');
  const [auteur, setAuteur] = useState('');
  const [genre, setGenre] = useState('Romance');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [externalLink, setExternalLink] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [epubUrl, setEpubUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [epub, setEpub] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitre(data.title || '');
        setAuteur(data.author || '');
        setGenre(data.genre || 'Romance');
        setDescription(data.description || '');
        setIsFree(data.is_free !== false);
        setExternalLink(data.external_link || '');
        setCoverUrl(data.cover_url || '');
        setEpubUrl(data.epub_url || '');
        setPdfUrl(data.pdf_url || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
    if (cover) formData.append('cover', await compressImage(cover, { maxWidthOrHeight: IMAGE_MAX_DIMENSION }));
    if (epub) formData.append('epub', epub);
    if (pdf) formData.append('pdf', pdf);

    const res = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(`Erreur : ${data.error}`);
    } else {
      setMessage('Livre mis à jour !');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce livre définitivement ?')) return;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`/api/books/${id}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(`Erreur : ${data.error}`);
      return;
    }
    router.push('/dashboard');
  };

  if (loading) return <div className="p-8 max-w-3xl mx-auto text-gray-500">Chargement...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 text-sm hover:underline">&larr; Retour au dashboard</Link>
      <h1 className="text-3xl font-bold mt-4 mb-6 text-gray-900">Modifier le livre</h1>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm ${message.startsWith('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
          <input type="text" value={auteur} onChange={(e) => setAuteur(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Couverture</h3>
          {coverUrl && (
            <div className="mb-2">
              <img src={coverUrl} alt="Couverture actuelle" className="w-24 aspect-[210/297] object-contain bg-gray-100 rounded" />
              <p className="text-xs text-gray-400 mt-1">Couverture actuelle</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} className="text-sm w-full" />
        </div>

        {isFree && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Fichiers du livre</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Format ePub</label>
                {epubUrl && <p className="text-xs text-green-600 mb-1">Fichier actuel présent</p>}
                <input type="file" accept=".epub" onChange={(e) => setEpub(e.target.files?.[0] || null)} className="text-xs w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Format PDF</label>
                {pdfUrl && <p className="text-xs text-green-600 mb-1">Fichier actuel présent</p>}
                <input type="file" accept=".pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} className="text-xs w-full" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Kindle (MOBI) n'est plus requis — Amazon accepte l'ePub directement via <a href="https://www.amazon.fr/sendtokindle" target="_blank" className="text-blue-500 underline">Send to Kindle</a>.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button type="button" onClick={handleDelete} className="bg-red-100 text-red-700 p-3 rounded-lg font-bold hover:bg-red-200 transition text-sm ml-auto">
            Supprimer le livre
          </button>
        </div>
      </form>
    </div>
  );
}