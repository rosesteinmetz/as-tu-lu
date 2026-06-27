'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-200 mb-4">Erreur</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Une erreur est survenue</h2>
        <p className="text-gray-500 text-sm mb-6">Quelque chose s'est mal passé. Réessaie ou reviens plus tard.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            Réessayer
          </button>
          <Link href="/" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
