import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "As-tu-lu - Distribution d'ebooks pour auteurs",
  description: "Plateforme francophone de distribution d'ebooks gratuits en échange d'une inscription à la newsletter de l'auteur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} As-tu-lu.fr</p>
            <div className="flex gap-4">
              <a href="/faq" className="hover:text-blue-600 underline">FAQ</a>
              <a href="/mentions-legales" className="hover:text-blue-600 underline">Mentions légales</a>
              <a href="/confidentialite" className="hover:text-blue-600 underline">Confidentialité</a>
              <a href="/cgu-lecteurs" className="hover:text-blue-600 underline">CGU Lecteurs</a>
              <a href="/cgu-auteurs" className="hover:text-blue-600 underline">CGU Auteurs</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
