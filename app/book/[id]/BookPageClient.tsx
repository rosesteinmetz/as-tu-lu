'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Book = {
  id: string
  title: string
  author: string
  genre: string
  description: string
  cover_url: string | null
  epub_url: string | null
  pdf_url: string | null
  user_id: string | null
  download_count: number
  is_free?: boolean
  external_link?: string | null
}

export default function BookPageClient({ book }: { book: Book }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [consentTransmission, setConsentTransmission] = useState(false)
  const [consentNewsletter, setConsentNewsletter] = useState(false)
  const [showKindleHelp, setShowKindleHelp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subError, setSubError] = useState('')

  const isPaid = book.is_free === false
  const allConsented = consentTransmission && consentNewsletter

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allConsented) return
    setSubmitting(true)
    setSubError('')

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        book_id: book.id,
        consent_transmission: consentTransmission,
        consent_newsletter: consentNewsletter,
        terms_version: '1.0',
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setSubError(data.error)
      setSubmitting(false)
      return
    }

    const errs = data.newsletter_errors ? encodeURIComponent(JSON.stringify(data.newsletter_errors)) : ''
    router.push(`/book/${book.id}/confirmation${errs ? `?errors=${errs}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center">
      <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 self-start max-w-2xl w-full">
        &larr; Retour à l'accueil
      </Link>
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-44 aspect-[210/297] object-contain bg-gray-100 rounded-lg shadow-md mb-4" />
          ) : (
            <div className="w-44 aspect-[210/297] bg-blue-900 text-white rounded-lg shadow-md flex items-center justify-center font-bold text-center p-4 mb-4">
              [Couverture]
            </div>
          )}
          <div className="flex gap-2 flex-wrap justify-center">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              {book.genre}
            </span>
            {isPaid ? (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                EN VENTE
              </span>
            ) : (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                GRATUIT
              </span>
            )}
          </div>
          {!isPaid && (
            <p className="text-xs text-gray-400 mt-3">
              {book.download_count || 0} téléchargement{book.download_count !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{book.title}</h1>
            <p className="text-gray-500 italic mb-4">Par {book.user_id ? <Link href={`/auteur/${book.user_id}`} className="text-blue-600 hover:underline">{book.author}</Link> : <span>{book.author}</span>}</p>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{book.description}</p>
          </div>

          {isPaid && book.external_link ? (
            <a
              href={book.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 text-white p-3 rounded-lg font-bold hover:bg-amber-700 transition text-sm text-center block"
            >
              Acheter sur la librairie partenaire
            </a>
          ) : (
            <form onSubmit={handleDownload} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                required
              />
              <label className="flex gap-2 text-xs text-gray-500 items-start">
                <input type="checkbox" checked={consentTransmission} onChange={(e) => setConsentTransmission(e.target.checked)} required className="mt-0.5" />
                J&apos;accepte la transmission de mon adresse email à l&apos;auteur pour recevoir le livre.
              </label>
              <label className="flex gap-2 text-xs text-gray-500 items-start">
                <input type="checkbox" checked={consentNewsletter} onChange={(e) => setConsentNewsletter(e.target.checked)} required className="mt-0.5" />
                J&apos;accepte de recevoir la newsletter et les actualités de l&apos;auteur.
              </label>
              <button type="submit" disabled={!allConsented || submitting} className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm disabled:opacity-50">
                {submitting ? 'Inscription en cours...' : 'Recevoir le livre (ePub, PDF, Kindle)'}
              </button>
              {subError && <p className="text-red-500 text-xs">{subError}</p>}
            </form>
          )}
        </div>
      </div>

      {!isPaid && (
        <div className="max-w-2xl w-full mt-6 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <button
            onClick={() => setShowKindleHelp(!showKindleHelp)}
            className="text-blue-600 font-medium text-sm flex items-center gap-2 hover:underline w-full justify-between"
          >
            <span>Anatomie du téléchargement : Comment envoyer ce livre sur votre Kindle ?</span>
            <span>{showKindleHelp ? '▲' : '▼'}</span>
          </button>

          {showKindleHelp && (
            <div className="mt-4 text-sm text-gray-600 space-y-3 bg-gray-50 p-4 rounded-lg">
              <p><strong>Option 1 (Simple) :</strong> Téléchargez le format <code>.epub</code> sur votre appareil, puis allez sur le site officiel <a href="https://www.amazon.fr/sendtokindle" target="_blank" className="text-blue-500 underline">Amazon Send to Kindle</a> pour glisser le fichier.</p>
              <p><strong>Option 2 (Par Email) :</strong> Envoyez le fichier en pièce jointe à votre adresse email Kindle dédiée (trouvable dans les paramètres de votre liseuse Amazon dans <i>Préférences {'>'} Paramètres de documents personnels</i>).</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}