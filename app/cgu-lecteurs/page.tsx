import Link from 'next/link';

export default function CGULecteurs() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 inline-block">&larr; Retour à l'accueil</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Conditions Générales d'Utilisation des Lecteurs – As-tu-lu.fr</h1>
        <p className="text-gray-500 text-sm mb-6">Dernière mise à jour : 17 juin 2026</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Objet</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les présentes Conditions Générales d'Utilisation définissent les modalités d'utilisation de la plateforme As-tu-lu.fr. La plateforme permet aux lecteurs d'accéder gratuitement à des livres numériques, extraits, nouvelles, bonus et contenus proposés par des auteurs francophones.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Acceptation des conditions</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Toute utilisation du site implique l'acceptation pleine et entière des présentes CGU.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Accès au service</h2>
        <p className="text-gray-600 text-sm leading-relaxed">L'accès à As-tu-lu.fr est gratuit. Certaines fonctionnalités nécessitent la communication d'une adresse électronique valide. L'utilisateur s'engage à fournir des informations exactes et à jour.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">4. Téléchargement des contenus</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les livres numériques proposés sur la plateforme sont fournis gratuitement par leurs auteurs. Le téléchargement peut être soumis à la communication de l'adresse électronique du lecteur. Lorsque le lecteur accepte de recevoir les communications d'un auteur, son adresse électronique est transmise à celui-ci.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">5. Communications des auteurs</h2>
        <p className="text-gray-600 text-sm leading-relaxed">En cochant la case de consentement prévue lors du téléchargement, le lecteur accepte que l'auteur concerné puisse lui envoyer : des informations relatives à ses ouvrages, des actualités littéraires, des offres promotionnelles, des invitations ou contenus exclusifs. Chaque communication devra permettre au lecteur de se désinscrire facilement.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">6. Propriété intellectuelle</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les œuvres disponibles sur As-tu-lu.fr sont protégées par le droit d'auteur. Le lecteur obtient uniquement un droit personnel de lecture. Sauf autorisation expresse de l'auteur, il est interdit de : reproduire les œuvres, redistribuer les fichiers, mettre les fichiers à disposition de tiers, vendre ou exploiter commercialement les contenus.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">7. Comportement des utilisateurs</h2>
        <p className="text-gray-600 text-sm leading-relaxed">L'utilisateur s'engage à ne pas : utiliser le service de manière frauduleuse, contourner les mesures de sécurité, perturber le fonctionnement du site, porter atteinte aux droits d'autrui.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">8. Disponibilité du service</h2>
        <p className="text-gray-600 text-sm leading-relaxed">As-tu-lu.fr s'efforce d'assurer l'accès au service de manière continue. Toutefois, le service peut être interrompu temporairement pour maintenance, mise à jour ou en raison de circonstances indépendantes de la volonté de l'exploitant.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">9. Responsabilité</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les contenus proposés sont publiés sous la responsabilité exclusive de leurs auteurs. As-tu-lu.fr agit comme plateforme d'hébergement et de diffusion. As-tu-lu.fr ne garantit pas : l'exactitude des contenus publiés, leur disponibilité permanente, l'absence totale d'erreurs techniques.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">10. Suppression de compte</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Le lecteur peut demander à tout moment la suppression de son compte et des données associées, sous réserve des obligations légales de conservation.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">11. Signalement de contenu</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Toute personne estimant qu'un contenu porte atteinte à ses droits peut adresser une demande à : <a href="mailto:copyright@as-tu-lu.fr" className="text-blue-600 underline">copyright@as-tu-lu.fr</a>. As-tu-lu.fr examinera chaque demande dans les meilleurs délais.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">12. Modification des CGU</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs sont invités à consulter régulièrement la version la plus récente.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">13. Droit applicable</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les présentes CGU sont soumises au droit suisse. Tout litige relatif à leur interprétation ou à leur exécution relèvera des juridictions compétentes du domicile de l'exploitant du site, sauf disposition légale impérative contraire.</p>
      </div>
    </div>
  );
}
