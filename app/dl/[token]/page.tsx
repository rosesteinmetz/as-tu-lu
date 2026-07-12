import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getDownloadData(token: string) {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: sub } = await supabase
    .from('subscribers')
    .select('book_id, created_at')
    .eq('download_token', token)
    .maybeSingle()

  if (!sub) return null

  const MAX_AGE = 30 * 24 * 60 * 60 * 1000
  if (Date.now() - new Date(sub.created_at).getTime() > MAX_AGE) return null

  const { data: book } = await supabase
    .from('books')
    .select('id, title, author, cover_url, epub_url, pdf_url')
    .eq('id', sub.book_id)
    .single()

  if (!book) return null

  const toSigned = async (fileUrl: string | null) => {
    if (!fileUrl) return null
    const match = fileUrl.match(/\/object\/public\/([^/]+)\/(.+)/)
    if (!match) return fileUrl
    const bucket = match[1]
    const filePath = match[2]
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600)
    return data?.signedUrl || null
  }

  const [epub_url, pdf_url, cover_url] = await Promise.all([
    toSigned(book.epub_url),
    toSigned(book.pdf_url),
    toSigned(book.cover_url),
  ])

  return { ...book, epub_url, pdf_url, cover_url }
}

function dl(url: string | null | undefined, label: string, ext: string) {
  return url ? (
    <a
      href={url}
      className="flex items-center gap-3 bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md hover:border-blue-300 transition"
    >
      <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">{ext}</span>
      <div>
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-400">Clique pour télécharger</p>
      </div>
    </a>
  ) : null
}

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const book = await getDownloadData(token)

  if (!book) return notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-lg w-full text-center mb-8">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Téléchargement prêt !</h1>
        <p className="text-gray-500 text-sm">
          Merci pour ton inscription, <span className="text-gray-700 font-medium">{book.title}</span> est à toi.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-3 mb-8">
        {dl(book.epub_url, 'Format ePub', 'ePub')}
        {dl(book.pdf_url, 'Format PDF', 'PDF')}
        <p className="text-xs text-gray-400 text-center">Pour Kindle : télécharge l&apos;ePub puis utilise <a href="https://www.amazon.fr/sendtokindle" target="_blank" className="text-blue-500 underline">Send to Kindle</a>.</p>
      </div>

      {book.cover_url && (
        <div className="max-w-lg w-full mb-6">
          <img src={book.cover_url} alt={book.title} className="w-32 mx-auto rounded-lg shadow-md" />
        </div>
      )}

      <div className="max-w-lg w-full bg-white p-6 rounded-xl shadow-md text-center">
        <p className="text-sm text-gray-600">
          Tu recevras bientôt les actualités de l&apos;auteur par email.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Tu peux te désabonner à tout moment via le lien en bas de chaque email.
        </p>
        <Link href="/" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          &larr; Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}