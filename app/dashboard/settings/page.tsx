'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function SettingsPage() {
  const [provider, setProvider] = useState('brevo');
  const [apiKey, setApiKey] = useState('');
  const [listId, setListId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function apiFetch(path: string, options?: RequestInit) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return fetch(path, {
      ...options,
      headers: {
        ...options?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  useEffect(() => {
    apiFetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setProvider(data.provider || 'brevo');
        setApiKey(data.api_key || '');
        setListId(data.list_id || '');
        setWebhookUrl(data.webhook_url || '');
        setNotifyEmail(data.notify_email || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError('');

    const res = await apiFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey, list_id: listId, webhook_url: webhookUrl, notify_email: notifyEmail }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la sauvegarde');
      return;
    }

    setSaved(true);
  };

  if (loading) {
    return <div className="p-8 max-w-2xl mx-auto text-gray-500">Chargement...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Paramètres Newsletter</h1>
      <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700 mb-6">
        <strong>Pas encore de compte newsletter ?</strong>
        <p className="mt-1">Brevo offre <strong>300 emails/jour gratuitement</strong>, sans abonnement. Crée ton compte gratuit sur <a href="https://app.brevo.com" target="_blank" className="underline">Brevo</a>, récupère ta clé API, et colle-la ci-dessous. Les emails de tes lecteurs seront automatiquement ajoutés à ta liste.</p>
      </div>

      {saved && <p className="bg-green-100 text-green-700 p-3 rounded-lg text-sm mb-4">Paramètres sauvegardés !</p>}
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</p>}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service de newsletter</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm bg-white">
            <option value="brevo">Brevo (Sendinblue)</option>
            <option value="mailerlite">MailerLite</option>
            <option value="webhook">Webhook (autre service)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clé API
            <span className="text-gray-400 font-normal ml-1">(obligatoire sauf Webhook)</span>
          </label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" placeholder={provider === 'brevo' ? 'Votre clé API Brevo' : provider === 'mailerlite' ? 'Votre clé API MailerLite' : 'Optionnel'} />
        </div>

        {provider !== 'webhook' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID de liste <span className="text-gray-400 font-normal">(optionnel)</span></label>
            <input type="text" value={listId} onChange={(e) => setListId(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Laisse vide pour utiliser la liste par défaut" />
          </div>
        )}

        {provider === 'webhook' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL du Webhook</label>
            <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" placeholder="https://ton-service.com/webhook" />
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Notification par email</h3>
          <p className="text-xs text-gray-500 mb-3">Reçois un email à chaque nouvel inscrit (Brevo uniquement). L&apos;adresse doit être un expéditeur validé dans Brevo.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ton email de notification</label>
            <input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm" placeholder="ton@email.com" />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700">
          <strong>Comment obtenir ta clé API ?</strong>
          {provider === 'brevo' && (
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>Connecte-toi sur <a href="https://app.brevo.com" target="_blank" className="underline">Brevo</a></li>
              <li>Va dans <strong>Paramètres → Clés API</strong></li>
              <li>Crée une nouvelle clé API v3</li>
            </ul>
          )}
          {provider === 'mailerlite' && (
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>Connecte-toi sur <a href="https://app.mailerlite.com" target="_blank" className="underline">MailerLite</a></li>
              <li>Va dans <strong>Intégrations → Clés API</strong></li>
              <li>Crée une nouvelle clé API</li>
            </ul>
          )}
        </div>

        <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm">
          Sauvegarder
        </button>
      </form>

      <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg text-xs text-red-700">
        <strong className="block mb-1">⚠️ Obligation RGPD — Lien de désabonnement</strong>
        <p>Tous les emails que tu envoies à tes abonnés doivent contenir un <strong>lien de désabonnement</strong> visible et fonctionnel. Brevo et MailerLite ajoutent ce lien automatiquement. Si tu utilises un webhook, assure-toi que ton système inclut ce lien dans chaque envoi.</p>
        <p className="mt-1">Le non-respect de cette obligation peut entraîner des sanctions.</p>
      </div>
    </div>
  );
}
