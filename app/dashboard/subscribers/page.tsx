'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type Subscriber = {
  id: string;
  email: string;
  book_id: string;
  consent_transmission: boolean;
  consent_newsletter: boolean;
  consent_date: string;
  ip_address: string;
  terms_version: string;
  created_at: string;
  books: { title: string } | null;
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function apiFetch(path: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  useEffect(() => {
    apiFetch('/api/subscribers')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSubscribers(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const exportCSV = () => {
    const headers = ['Email', 'Livre', 'Consentement transmission', 'Consentement newsletter', 'Date consentement', 'IP', 'Version CGU', 'Date inscription'];
    const rows = subscribers.map((s) => [
      s.email,
      s.books?.title || '',
      s.consent_transmission ? 'Oui' : 'Non',
      s.consent_newsletter ? 'Oui' : 'Non',
      s.consent_date ? new Date(s.consent_date).toLocaleString('fr-FR') : '',
      s.ip_address,
      s.terms_version,
      new Date(s.created_at).toLocaleString('fr-FR'),
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abonnes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/dashboard" className="text-blue-600 text-sm hover:underline">&larr; Retour au dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Abonnés</h1>
        </div>
        {subscribers.length > 0 && (
          <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition">
            Exporter en CSV
          </button>
        )}
      </div>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-sm">Chargement...</p>
      ) : subscribers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <p className="text-gray-500 text-sm">Aucun abonné pour le moment.</p>
          <p className="text-gray-400 text-xs mt-2">Les lecteurs qui téléchargent tes livres apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Livre</th>
                <th className="p-3 font-medium">Consentements</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{s.email}</td>
                  <td className="p-3 text-gray-600">{s.books?.title || '—'}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className={s.consent_transmission ? 'text-green-600' : 'text-red-400'}>
                        {s.consent_transmission ? '✓ Email transmis' : '✗ Email transmis'}
                      </span>
                      <span className={s.consent_newsletter ? 'text-green-600' : 'text-red-400'}>
                        {s.consent_newsletter ? '✓ Newsletter' : '✗ Newsletter'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {s.consent_date ? new Date(s.consent_date).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="p-3 text-gray-500 text-xs">{s.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-xs text-gray-400 border-t border-gray-100">
            {subscribers.length} abonné{subscribers.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
