'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login, signup } from './actions';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState(searchParams.get('error') || '');
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: 'login' | 'signup') {
    setMode(next);
    setMessage('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const action = mode === 'login' ? login : signup;
    const result = await action(form) as { error?: string; success?: boolean | string };

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else if (mode === 'login') {
      router.push('/dashboard');
    } else {
      setMessage(typeof result?.success === 'string' ? result.success : 'Compte créé !');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h1>

        {message && <p className="text-green-600 text-sm mb-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="email" type="email" placeholder="Email" className="border p-3 rounded-lg text-sm text-gray-900 placeholder:text-gray-500" required />
          <input name="password" type="password" placeholder="Mot de passe" className="border p-3 rounded-lg text-sm text-gray-900 placeholder:text-gray-500" required minLength={6} />
          {mode === 'signup' && (
            <label className="flex gap-2 text-xs text-gray-600 items-start">
              <input name="consent" type="checkbox" required className="mt-0.5" />
              <span>
                J&apos;accepte de recevoir les informations d&apos;As-tu-lu par email (nouveautés et actualités de la
                plateforme). Je peux me désinscrire à tout moment.
              </span>
            </label>
          )}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm disabled:opacity-50">
            {submitting ? (mode === 'login' ? 'Connexion...' : 'Création...') : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
          {mode === 'login' && (
            <Link href="/auth/reset-password" className="text-xs text-blue-600 hover:underline text-center">
              Mot de passe oublié ?
            </Link>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {mode === 'login' ? (
            <>Pas encore de compte ?{' '}
              <button onClick={() => switchMode('signup')} className="text-blue-600 underline">S&apos;inscrire</button>
            </>
          ) : (
            <>Déjà un compte ?{' '}
              <button onClick={() => switchMode('login')} className="text-blue-600 underline">Se connecter</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-gray-500">Chargement...</div>}>
      <AuthForm />
    </Suspense>
  );
}
