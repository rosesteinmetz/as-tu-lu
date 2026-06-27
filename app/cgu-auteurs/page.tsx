import Link from 'next/link';

export default function CGUAuteurs() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 inline-block">&larr; Retour à l'accueil</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Conditions d'utilisation des auteurs – As-tu-lu.fr</h1>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Objet</h2>
        <p className="text-gray-600 text-sm leading-relaxed">As-tu-lu.fr permet aux auteurs francophones de diffuser gratuitement des livres numériques, bonus de lecture, nouvelles, extraits ou autres contenus numériques à destination des lecteurs.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Éligibilité</h2>
        <p className="text-gray-600 text-sm leading-relaxed">L'auteur garantit être âgé d'au moins 18 ans ou disposer des autorisations nécessaires pour utiliser la plateforme.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Garanties relatives aux contenus</h2>
        <p className="text-gray-600 text-sm leading-relaxed">L'auteur déclare et garantit :</p>
        <ul className="list-disc pl-6 text-gray-600 text-sm leading-relaxed mt-1 space-y-1">
          <li>être titulaire des droits de propriété intellectuelle sur les contenus déposés ;</li>
          <li>disposer de toutes les autorisations nécessaires à leur diffusion ;</li>
          <li>que les contenus ne violent aucun droit de tiers ;</li>
          <li>que les contenus ne sont ni illicites, ni diffamatoires, ni contraires aux lois applicables.</li>
        </ul>
        <p className="text-gray-600 text-sm leading-relaxed mt-1">L'auteur demeure seul responsable des contenus qu'il met en ligne.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">4. Licence accordée à As-tu-lu.fr</h2>
        <p className="text-gray-600 text-sm leading-relaxed">L'auteur conserve l'intégralité de ses droits sur ses œuvres.</p>
        <p className="text-gray-600 text-sm leading-relaxed mt-1">L'auteur accorde à As-tu-lu.fr une licence non exclusive, gratuite et révocable permettant :</p>
        <ul className="list-disc pl-6 text-gray-600 text-sm leading-relaxed mt-1 space-y-1">
          <li>l'hébergement des fichiers ;</li>
          <li>leur mise à disposition auprès des lecteurs inscrits ;</li>
          <li>l'affichage des couvertures, résumés, titres et métadonnées ;</li>
          <li>la transmission des fichiers aux lecteurs.</li>
        </ul>
        <p className="text-gray-600 text-sm leading-relaxed mt-1">Cette licence prend fin dès la suppression du contenu par l'auteur ou par As-tu-lu.fr.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">5. Collecte des adresses électroniques</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Lorsqu'un lecteur télécharge une œuvre, son adresse électronique est transmise à l'auteur concerné.</p>
        <p className="text-gray-600 text-sm leading-relaxed mt-1">L'auteur devient responsable du traitement des données qu'il reçoit.</p>
        <p className="text-gray-600 text-sm leading-relaxed mt-1">L'auteur s'engage à :</p>
        <ul className="list-disc pl-6 text-gray-600 text-sm leading-relaxed mt-1 space-y-1">
          <li>respecter les réglementations applicables en matière de protection des données ;</li>
          <li>utiliser les adresses collectées uniquement dans le cadre de son activité d'auteur ;</li>
          <li>permettre à tout abonné de se désinscrire facilement ;</li>
          <li>supprimer les données lorsqu'elles ne sont plus nécessaires.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">6. Services tiers</h2>
        <p className="text-gray-600 text-sm leading-relaxed">L'auteur peut transférer les adresses collectées vers son service d'emailing (Brevo, MailerLite, ConvertKit ou autre). Il lui appartient de s'assurer du respect des obligations légales applicables.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">7. Retrait de contenu</h2>
        <p className="text-gray-600 text-sm leading-relaxed">As-tu-lu.fr peut suspendre ou supprimer tout contenu :</p>
        <ul className="list-disc pl-6 text-gray-600 text-sm leading-relaxed mt-1 space-y-1">
          <li>faisant l'objet d'une réclamation légitime ;</li>
          <li>susceptible de porter atteinte aux droits d'un tiers ;</li>
          <li>contraire aux présentes conditions.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">8. Limitation de responsabilité</h2>
        <p className="text-gray-600 text-sm leading-relaxed">As-tu-lu.fr agit comme intermédiaire technique et hébergeur des contenus publiés par les auteurs. As-tu-lu.fr ne garantit ni le succès commercial d'une œuvre ni le nombre de téléchargements obtenus.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">9. Résiliation</h2>
        <p className="text-gray-600 text-sm leading-relaxed">L'auteur peut demander à tout moment la suppression de son compte et de ses contenus. As-tu-lu.fr peut suspendre ou supprimer un compte en cas de violation des présentes conditions.</p>
      </div>
    </div>
  );
}
