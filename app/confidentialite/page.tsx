import Link from 'next/link';

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 inline-block">&larr; Retour à l'accueil</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Politique de confidentialité – As-tu-lu.fr</h1>
        <p className="text-gray-500 text-sm mb-6">Dernière mise à jour : 17 juin 2026</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Introduction</h2>
        <p className="text-gray-600 text-sm leading-relaxed">La présente politique de confidentialité explique comment As-tu-lu.fr collecte, utilise, conserve et protège les données personnelles de ses utilisateurs. As-tu-lu.fr attache une importance particulière à la protection de la vie privée de ses utilisateurs et s'engage à respecter les dispositions applicables en matière de protection des données personnelles, notamment le Règlement Général sur la Protection des Données (RGPD) pour les utilisateurs situés dans l'Union européenne.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Responsable du traitement</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Le responsable du traitement des données collectées sur As-tu-lu.fr est : Céline Achanta-Bainier, autrice indépendante domiciliée en Suisse. Adresse e-mail : <a href="mailto:contact@as-tu-lu.fr" className="text-blue-600 underline">contact@as-tu-lu.fr</a>.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Données collectées</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Selon l'utilisation du site, les données suivantes peuvent être collectées :</p>
        <p className="text-gray-600 text-sm font-medium mt-2">Données fournies directement</p>
        <ul className="list-disc pl-6 text-gray-600 text-sm leading-relaxed space-y-1">
          <li>Adresse e-mail</li>
          <li>Nom ou prénom (si renseigné)</li>
          <li>Informations de compte auteur</li>
          <li>Messages envoyés via les formulaires de contact</li>
        </ul>
        <p className="text-gray-600 text-sm font-medium mt-2">Données collectées automatiquement</p>
        <ul className="list-disc pl-6 text-gray-600 text-sm leading-relaxed space-y-1">
          <li>Adresse IP</li>
          <li>Date et heure de connexion</li>
          <li>Données techniques du navigateur</li>
          <li>Journaux de téléchargement</li>
          <li>Informations nécessaires à la sécurité du site</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">4. Finalités du traitement</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les données sont collectées afin de :</p>
        <ul className="list-disc pl-6 text-gray-600 text-sm leading-relaxed mt-1 space-y-1">
          <li>permettre l'accès aux livres numériques proposés sur la plateforme ;</li>
          <li>gérer les comptes lecteurs et auteurs ;</li>
          <li>transmettre l'adresse e-mail du lecteur à l'auteur concerné lorsque le lecteur accepte de recevoir ses communications ;</li>
          <li>assurer le bon fonctionnement et la sécurité du site ;</li>
          <li>répondre aux demandes de support ;</li>
          <li>respecter les obligations légales.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">5. Transmission des données aux auteurs</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Lorsqu'un lecteur télécharge un livre ou un contenu gratuit proposé par un auteur, son adresse électronique est transmise à cet auteur. Cette transmission intervient uniquement lorsque le lecteur donne son consentement explicite via la case prévue à cet effet. À compter de cette transmission, l'auteur devient responsable du traitement des données qu'il reçoit dans le cadre de ses activités de communication et de marketing. As-tu-lu.fr ne contrôle pas l'utilisation ultérieure des données par les auteurs.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">6. Base légale des traitements</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les traitements réalisés reposent sur : le consentement de l'utilisateur, l'exécution du service demandé, l'intérêt légitime d'As-tu-lu.fr pour assurer la sécurité et l'amélioration de la plateforme, et le respect des obligations légales.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">7. Durée de conservation</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les données sont conservées pendant une durée adaptée à leur finalité : comptes utilisateurs : jusqu'à suppression du compte ou demande de suppression ; données techniques : selon les besoins de sécurité et les obligations légales ; échanges avec le support : jusqu'à trois ans après le dernier contact.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">8. Destinataires des données</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les données peuvent être communiquées : aux auteurs concernés par un téléchargement, aux prestataires techniques nécessaires au fonctionnement du service, et aux autorités compétentes lorsque la loi l'exige. Les données ne sont jamais revendues à des tiers.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">9. Hébergement</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Les données sont hébergées auprès de : Gandi SAS, 63-65 boulevard Masséna, 75013 Paris, France.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">10. Cookies</h2>
        <p className="text-gray-600 text-sm leading-relaxed">As-tu-lu.fr utilise uniquement les cookies strictement nécessaires au fonctionnement du site. Si des outils de mesure d'audience ou des cookies marketing sont mis en place ultérieurement, une information spécifique et un mécanisme de consentement seront proposés aux utilisateurs.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">11. Droits des utilisateurs</h2>
        <p className="text-gray-600 text-sm leading-relaxed">Conformément à la réglementation applicable, chaque utilisateur dispose des droits suivants : droit d'accès, droit de rectification, droit d'effacement, droit de limitation, droit d'opposition, droit à la portabilité des données, droit de retirer son consentement à tout moment. Les demandes peuvent être adressées à : <a href="mailto:contact@as-tu-lu.fr" className="text-blue-600 underline">contact@as-tu-lu.fr</a>.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">12. Sécurité</h2>
        <p className="text-gray-600 text-sm leading-relaxed">As-tu-lu.fr met en œuvre des mesures techniques et organisationnelles raisonnables afin de protéger les données contre toute perte, accès non autorisé, altération ou divulgation.</p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">13. Modification de la politique</h2>
        <p className="text-gray-600 text-sm leading-relaxed">La présente politique peut être modifiée à tout moment afin de tenir compte des évolutions légales ou techniques. La version en vigueur est celle publiée sur le site.</p>
      </div>
    </div>
  );
}
