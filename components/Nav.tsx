'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-blue-600">
          As-tu lu
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/" className={`hover:text-blue-600 ${pathname === '/' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
            Accueil
          </Link>
          <Link href="/dashboard" className={`hover:text-blue-600 ${pathname.startsWith('/dashboard') ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
            Espace Auteur
          </Link>
          <Link href="/auteur" className={`hover:text-blue-600 ${pathname === '/auteur' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
            Liste des Auteurs
          </Link>
        </div>
      </div>
    </nav>
  );
}
