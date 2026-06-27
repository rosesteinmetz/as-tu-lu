'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function EditBookPage() {
  const { id } = useParams();
  const router = useRouter();
  const [titre, setTitre] = useState('');
  const [auteur, setAuteur] = useState('');
  const [genre, setGenre] = useState('Romance');
  const [description, setDescription] = useState('');
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
