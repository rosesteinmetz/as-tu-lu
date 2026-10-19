'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function AccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmation.trim().toUpperCase() === 'SUPPRIMER' && password.length > 0 && acknowledged;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!canDelete) return;
    setError('');
    setDeleting(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('/api/account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ confirmation, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Impossible de supprimer le compte. Réessaie.');
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 text-sm hover:underline">&larr; Retour au dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 mt-4 text-gray-900">Mon compte</h1>

      <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Supprimer mon compte</h2>
        <p className="text-sm text-red-700 mb-4">
          Cette action est <strong>définitive et irréversible</strong>. Toutes tes données seront supprimées
          immédiatement de nos serveurs :
        </p>
        <ul className="list-disc ml-5 text-sm text-red-700 space-y-1 mb-5">
          <li>ton profil public d&apos;auteur et tes photos ;</li>
          <li>tous tes livres ainsi que leurs couvertures et fichiers ePub/PDF ;</li>
          <li>la liste de tes abonnés et leurs consentements ;</li>
          <li>tes paramètres de newsletter (clé API incluse) ;</li>
          <li>ton compte et ton accès à l&apos;Espace Créateur.</li>
        </ul>

        {error && <p className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg text-sm mb-4">{error}</p>}

        <form onSubmit={handleDelete} autoComplete="off" className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">Ton mot de passe</label>
            <input
              type="password"
              name="account-delete-password"
              autoComplete="new-password"
              data-lpignore="true"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-red-200 p-2.5 rounded-lg text-sm bg-white"
              placeholder="Confirme avec ton mot de passe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">
              Saisis <span className="font-mono font-bold">SUPPRIMER</span> pour confirmer
            </label>
            <input
              type="text"
              name="account-delete-confirmation"
              autoComplete="off"
              data-lpignore="true"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full border border-red-200 p-2.5 rounded-lg text-sm bg-white"
              placeholder="SUPPRIMER"
            />
          </div>

          <label className="flex gap-2 text-xs text-red-700 items-start">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5"
            />
            Je comprends que la suppression de mon compte et de toutes mes données est définitive et irréversible.
          </label>

          <button
            type="submit"
            disabled={!canDelete || deleting}
            className="bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700 transition text-sm disabled:opacity-50"
          >
            {deleting ? 'Suppression en cours…' : 'Supprimer définitivement mon compte'}
          </button>
        </form>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 p-4 rounded-lg text-xs text-gray-600">
        Conformément au RGPD, tu peux demander la suppression de ton compte et de tes données à tout moment.
        Pour toute question, consulte notre <Link href="/confidentialite" className="text-blue-600 underline">politique de confidentialité</Link>.
      </div>
    </div>
  );
}
