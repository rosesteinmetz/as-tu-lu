'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type SyncResult = {
  total: number
  added: number
  already: number
  failed: number
  error?: string
}

export default function SyncBrevoButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  async function run() {
    setLoading(true)
    setResult(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/sync-authors', {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult({ total: 0, added: 0, already: 0, failed: 0, error: body.error || `Erreur ${res.status}` })
        return
      }
      setResult(body as SyncResult)
    } catch {
      setResult({ total: 0, added: 0, already: 0, failed: 0, error: 'Réseau indisponible.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50"
      >
        {loading ? 'Synchronisation en cours…' : 'Synchroniser avec Brevo'}
      </button>
      {result && (
        <p className={`text-xs ${result.error ? 'text-red-600' : 'text-gray-500'}`}>
          {result.error
            ? result.error
            : `${result.added} ajouté${result.added > 1 ? 's' : ''}, ${result.already} déjà présent${result.already > 1 ? 's' : ''}, ${result.failed} en erreur (sur ${result.total}).`}
        </p>
      )}
    </div>
  )
}
