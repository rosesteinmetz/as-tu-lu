import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin'
import { listAuthors } from '@/lib/author-directory'

export const dynamic = 'force-dynamic'

export default async function AdminAuthorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const authors = await listAuthors()
  const consented = authors.filter((a) => a.consent)
  const confirmed = authors.filter((a) => a.email_confirmed)

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 text-sm hover:underline">&larr; Retour au dashboard</Link>

      <div className="flex flex-wrap justify-between items-center gap-3 mt-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Auteurs inscrits</h1>
        <a href="/api/admin/authors" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          Télécharger la liste (CSV)
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Auteurs inscrits" value={authors.length} />
        <Stat label="Emails confirmés" value={confirmed.length} />
        <Stat label="Ont accepté" value={consented.length} />
        <Stat label="Sans consentement" value={authors.length - consented.length} />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700 mb-6">
        « Ont accepté » = auteurs ayant coché, à l&apos;inscription, la case les autorisant à recevoir les
        informations d&apos;As-tu-lu. Utilise de préférence ces adresses pour ta communication (le CSV contient tout le monde).
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Nom</th>
              <th className="px-4 py-3 font-semibold">Profil</th>
              <th className="px-4 py-3 font-semibold">Inscription</th>
              <th className="px-4 py-3 font-semibold">Confirmé</th>
              <th className="px-4 py-3 font-semibold">Consentement</th>
              <th className="px-4 py-3 font-semibold">Livres</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {authors.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{a.email}</td>
                <td className="px-4 py-3 text-gray-700">{a.name || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-3">
                  {a.slug ? (
                    <Link href={`/auteur/${a.slug}`} className="text-blue-600 hover:underline">voir</Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{fmt(a.created_at)}</td>
                <td className="px-4 py-3">{a.email_confirmed ? '✅' : <span className="text-gray-400">non</span>}</td>
                <td className="px-4 py-3">
                  {a.consent ? (
                    <span className="text-green-700" title={a.consent_at ? fmt(a.consent_at) : ''}>oui</span>
                  ) : (
                    <span className="text-gray-400">non</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{a.books}</td>
              </tr>
            ))}
            {authors.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Aucun auteur.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
