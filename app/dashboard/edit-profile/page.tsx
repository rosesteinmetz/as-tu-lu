'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { compressImage, IMAGE_MAX_DIMENSION } from '@/lib/compress';
import Link from 'next/link';

export default function EditProfilePage() {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<(string | File)[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function apiFetch(path: string, options?: RequestInit) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return fetch(path, {
      ...options,
      headers: { ...options?.headers, ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    });
  }

  useEffect(() => {
    apiFetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setName(data.name || '');
        setTagline(data.tagline || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setPhotos(data.photo_urls || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const existingUrls = photos.filter((p): p is string => typeof p === 'string');
    const slotsLeft = 5 - existingUrls.length;
    const compressed = await Promise.all(files.slice(0, slotsLeft).map((f) => compressImage(f, { maxWidthOrHeight: IMAGE_MAX_DIMENSION })));
    setPhotos([...existingUrls, ...compressed]);
  };

  const removePhoto = (index: number) => {
    const existingUrls = photos.filter((p): p is string => typeof p === 'string');
    existingUrls.splice(index, 1);
    setPhotos(existingUrls);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('tagline', tagline);
    formData.append('bio', bio);
    formData.append('keep_avatar', avatarUrl);
    if (avatarFile) formData.append('avatar', await compressImage(avatarFile, { maxWidthOrHeight: 400 }));

    const existingUrls = photos.filter((p): p is string => typeof p === 'string');
    formData.append('keep_photos', JSON.stringify(existingUrls));

    const newFiles = photos.filter((p): p is File => p instanceof File);
    newFiles.forEach((f) => formData.append('photos', f));

    const res = await apiFetch('/api/profile', { method: 'POST', body: formData });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Erreur');
      return;
    }
    const d = await res.json();
    setPhotos(d.photo_urls || []);
    setSaved(true);
  };

  if (loading) return <div className="p-8 max-w-2xl mx-auto text-gray-500">Chargement...</div>;

  const existingUrls = photos.filter((p): p is string => typeof p === 'string');

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 text-sm hover:underline">&larr; Retour au dashboard</Link>
      <h1 className="text-3xl font-bold mt-4 mb-6 text-gray-900">Modifier mon profil</h1>

      {saved && <p className="bg-green-100 text-green-700 p-3 rounded-lg text-sm mb-4">Profil mis à jour !</p>}
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</p>}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'auteur</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom d'auteur" className="w-full border p-2.5 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre / tagline</label>
          <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Écrivaine de Science-Fiction & Thriller" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo de profil</label>
          {avatarUrl && (
            <div className="mb-2">
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="text-sm w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Parle de toi, de ton univers littéraire..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos de l'univers ({existingUrls.length}/5)</label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {existingUrls.map((url, i) => (
              <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition">&times;</button>
              </div>
            ))}
            {Array.from({ length: 5 - existingUrls.length }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">Vide</div>
            ))}
          </div>
          {existingUrls.length < 5 && (
            <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="text-sm" />
          )}
        </div>

        <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm">
          Sauvegarder le profil
        </button>
      </form>
    </div>
  );
}
