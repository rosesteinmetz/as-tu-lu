'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '../actions';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    const result = await updatePassword(form) as { error?: string };
    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Choisis un nouveau mot de passe pour ton compte.</p>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="password" type="password" placeholder="Nouveau mot de passe" className="border p-3 rounded-lg text-sm" required minLength={6} />
          <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm">
            Mettre à jour
          </button>
        </form>
      </div>
    </div>
  );
}
