import Link from 'next/link';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 inline-block">&larr; Retour à l'accueil</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mentions légales – As-tu-lu.fr</h1>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Éditeur du site</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Le site As-tu-lu.fr est édité par :<br />
          Céline Achanta-Bainier<br />
          Autrice indépendante exerçant sous le nom commercial : Céline Achanta-Bainier Édition<br />
          Domiciliée en Suisse<br />
          Adresse e-mail de contact : <a href="mailto:contact@as-tu-lu.fr" className="text-blue-600 underline">contact@as-tu-lu.fr</a>
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Hébergement</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Le site est hébergé par :<br />
          Gandi SAS<br />
          63-65 boulevard Masséna<br />
          75013 Paris<br />
          France<br />
          Site web : <a href="https://www.gandi.net" target="_blank" className="text-blue-600 underline">https://www.gandi.net</a>
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Objet du site</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          As-tu-lu.fr est une plateforme permettant aux auteurs francophones de proposer gratuitement des livres numériques, extraits, bonus ou contenus exclusifs aux lecteurs.<br />
          Les lecteurs peuvent accéder à ces contenus en renseignant leur adresse électronique et en acceptant, le cas échéant, de recevoir les communications de l'auteur concerné.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Propriété intellectuelle</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          L'ensemble des éléments composant le site As-tu-lu.fr (textes, logos, graphismes, fonctionnalités, structure, bases de données) est protégé par les lois relatives à la propriété intellectuelle.<br />
          Toute reproduction, représentation ou exploitation non autorisée est interdite.<br />
          Les œuvres mises en ligne demeurent la propriété exclusive de leurs auteurs respectifs.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Contact</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Pour toute question concernant le site : <a href="mailto:contact@as-tu-lu.fr" className="text-blue-600 underline">contact@as-tu-lu.fr</a><br />
          Pour toute demande relative aux droits d'auteur : <a href="mailto:copyright@as-tu-lu.fr" className="text-blue-600 underline">copyright@as-tu-lu.fr</a>
        </p>
      </div>
    </div>
  );
}
