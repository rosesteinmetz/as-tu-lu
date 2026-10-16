'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = createClient();

    const setup = async () => {
      // 1) Flux PKCE : le lien contient ?code=...
      const code = new URL(window.location.href).searchParams.get('code');
      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!codeError) {
          window.history.replaceState(null, '', '/auth/update-password');
          setReady(true);
          return;
        }
      }

      // 2) Flux implicite : le lien contient #access_token=...
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (!sessionError) {
            window.history.replaceState(null, '', '/auth/update-password');
            setReady(true);
            return;
          }
        }
      }

      // 3) Session déjà établie (recovery validé par /auth/confirm via cookie)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
        return;
      }

      setError('Lien invalide ou expiré. Demande un nouveau lien de réinitialisation.');
    };

    setup();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const password = form.get('password') as string;

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage('Mot de passe mis à jour ! Redirection...');
        setTimeout(() => router.push('/auth'), 2000);
      }
    } catch (err) {
      setError(`Erreur : ${(err as Error).message}`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Choisis un nouveau mot de passe pour ton compte.</p>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-4 text-center">{message}</p>}

        {!ready && !error && <p className="text-sm text-gray-400 text-center">Vérification du lien...</p>}

        {ready && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              name="password"
              type="password"
              placeholder="Nouveau mot de passe"
              className="border p-3 rounded-lg text-sm"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
