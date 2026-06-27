'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { downloadUrl } from '@/lib/download-url';

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  cover_url: string | null;
  epub_url: string | null;
  pdf_url: string | null;
  mobi_url: string | null;
};

export default function ConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  let newsletterErrors: string[] = [];
  try {
    const e = searchParams.get('errors');
    if (e) newsletterErrors = JSON.parse(decodeURIComponent(e));
  } catch {};

  useEffect(() => {
    if (!id) return;
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.error) {
          router.push('/');
          return;
        }
        setBook(data);
        setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!book) return null;

  const dl = (url: string | null, label: string, ext: string) =>
    url && (
      <a
        href={downloadUrl(url, book.title, book.author) || url}
        className="flex items-center gap-3 bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md hover:border-blue-300 transition"
      >
        <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">{ext}</span>
        <div>
          <p className="font-medium text-gray-900 text-sm">{label}</p>
          <p className="text-xs text-gray-400">Clique pour télécharger</p>
        </div>
      </a>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-lg w-full text-center mb-8">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Téléchargement prêt !</h1>
        <p className="text-gray-500 text-sm">
          Merci pour ton inscription <span className="text-gray-700 font-medium">{book.title}</span> est à toi.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-3 mb-8">
        {dl(book.epub_url, 'Format ePub', 'ePub')}
        {dl(book.pdf_url, 'Format PDF', 'PDF')}
        {dl(book.mobi_url, 'Format Kindle (mobi)', 'MOBI')}
      </div>

      {newsletterErrors.length > 0 && (
        <div className="max-w-lg w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <p className="font-medium mb-1">Erreur newsletter :</p>
          {newsletterErrors.map((e, i) => <p key={i}>{e}</p>)}
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
  );
}
