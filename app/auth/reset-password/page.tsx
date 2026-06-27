'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const email = form.get('email') as string;

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur inconnue')
      } else {
        setSent(true);
        setMessage('Email envoyé ! Vérifie ta boîte de réception.');
      }
    } catch (err) {
      setError(`Exception : ${(err as Error).message}`);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h1 className="text-xl font-bold mb-2">Email envoyé</h1>
          <p className="text-sm text-gray-600">{message}</p>
          <Link href="/auth" className="inline-block mt-6 text-sm text-blue-600 hover:underline">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Reçois un lien pour réinitialiser ton mot de passe.</p>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="email" type="email" placeholder="Ton adresse email" className="border p-3 rounded-lg text-sm" required />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm disabled:opacity-50">
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          <Link href="/auth" className="text-blue-600 hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
