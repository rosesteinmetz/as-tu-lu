'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

async function performRequest(token: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, message: data.error || 'Une erreur est survenue.' }
    }
    return { ok: true, message: 'Tu es bien désabonné(e). Tu ne recevras plus nos emails.' }
  } catch {
    return { ok: false, message: 'Impossible de contacter le serveur. Réessaie plus tard.' }
  }
}

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    token ? 'loading' : 'idle'
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    performRequest(token).then((result) => {
      if (cancelled) return
      setStatus(result.ok ? 'done' : 'error')
      setMessage(result.message)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Désabonnement</h1>

        {status === 'done' ? (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto my-4 text-3xl">✓</div>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
          </>
        ) : status === 'error' ? (
          <p className="text-red-500 text-sm my-4">{message}</p>
        ) : status === 'loading' ? (
          <p className="text-gray-500 text-sm my-4">Traitement…</p>
        ) : (
          <p className="text-gray-500 text-sm my-4">
            Pour te désabonner, ouvre le lien de désabonnement présent en bas de nos emails.
          </p>
        )}

        <Link href="/" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          &larr; Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50" />}>
      <UnsubscribeContent />
    </Suspense>
  )
}
