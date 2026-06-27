export default function FAQPage() {
  const faqs = [
    {
      q: "Qu'est-ce qu'As-tu-lu ?",
      a: "As-tu-lu est une plateforme qui permet aux auteurs francophones de distribuer gratuitement leurs ebooks (ePub, PDF, Kindle) en échange de l'inscription du lecteur à leur newsletter. C'est une alternative française à BookFunnel.",
    },
    {
      q: "Comment créer un compte auteur ?",
      a: "Clique sur 'Espace Auteur' en haut à droite, puis 'Créer un compte'. Remplis ton email et ton mot de passe. Une fois connectée, tu peux créer ton profil auteur et ajouter tes livres.",
    },
    {
      q: "Comment réinitialiser mon mot de passe ?",
      a: "Actuellement, la réinitialisation n'est pas encore disponible. Contacte-nous si tu as besoin d'aide. (Bientôt : un lien 'Mot de passe oublié' sera ajouté à la connexion.)",
    },
    {
      q: "Comment ajouter un livre ?",
      a: "Dans l'Espace Auteur, remplis le formulaire 'Ajouter un livre' : titre, auteur, genre, description, puis télécharge la couverture et les fichiers de l'ebook (ePub, PDF, MOBI/Kindle). Coche la case 'CGU Auteurs' pour valider. Le livre apparaîtra immédiatement sur la page d'accueil et sur ta page auteur.",
    },
    {
      q: "Quels formats d'ebook sont acceptés ?",
      a: "Tu peux proposer tes livres aux formats ePub, PDF et MOBI (Kindle). Chaque fichier est limité à 50 Mo. Les images de couverture sont limitées à 5 Mo.",
    },
    {
      q: "Comment les lecteurs téléchargent-ils mes livres ?",
      a: "Les lecteurs arrivent sur la page de ton livre, remplissent leur email, cochent les cases RGPD (transmission de l'email + inscription newsletter), puis cliquent sur 'Télécharger'. Ils sont redirigés vers une page de confirmation où ils peuvent télécharger le fichier. L'email est automatiquement envoyé à Brevo si la newsletter est activée.",
    },
    {
      q: "Comment configurer l'envoi vers ma newsletter (Brevo) ?",
      a: "Va dans Espace Auteur → Newsletter. Remplis ta clé API Brevo (trouvable dans Brevo → SMTP & API → Clés API), l'ID de ta liste (dans Brevo → Contacts → Listes → ID), et ton email de notification (pour être prévenu des nouveaux inscrits). Teste avec un lecteur pour vérifier.",
    },
    {
      q: "Mes abonnés apparaissent-ils automatiquement dans Brevo ?",
      a: "Oui, dès qu'un lecteur coche la case 'J'accepte de recevoir la newsletter' et télécharge un livre, son email est ajouté à ta liste Brevo automatiquement.",
    },
    {
      q: "Comment voir mes abonnés ?",
      a: "Dans Espace Auteur → Abonnés, tu vois la liste des lecteurs qui ont téléchargé tes livres (uniquement les tiens, pas ceux des autres auteurs). Tu peux exporter la liste en CSV.",
    },
    {
      q: "Le compteur de téléchargement ne s'incrémente pas ?",
      a: "Vérifie que la fonction SQL 'increment_download_count' est bien créée dans Supabase (voir le fichier schema.sql pour le script). Sans elle, le compteur n'augmente pas à cause des règles RLS.",
    },
    {
      q: "Puis-je modifier ou supprimer un livre ?",
      a: "Oui, dans Espace Auteur, clique sur 'Modifier' à côté d'un livre pour changer son titre, auteur, genre ou description. Tu peux aussi le supprimer définitivement.",
    },
    {
      q: "Comment modifier mon profil auteur ?",
      a: "Dans Espace Auteur → Profil, tu peux changer ton nom, tagline, bio, photo d'avatar et photos de galerie. La photo d'avatar doit être au format carré de préférence.",
    },
    {
      q: "Puis-je avoir plusieurs livres ?",
      a: "Oui, autant que tu veux. Ils seront tous visibles sur ta page auteur et sur la page d'accueil, groupés par genre.",
    },
    {
      q: "Qu'est-ce que le badge 'Bonus gratuit' ?",
      a: "Un badge vert 'Bonus gratuit' apparaît sur tous les livres pour indiquer aux lecteurs que l'ebook est offert en échange de leur inscription à la newsletter.",
    },
    {
      q: "Mes données sont-elles protégées ?",
      a: "Oui. Les emails des lecteurs sont stockés de manière sécurisée dans Supabase (PostgreSQL). Les mots de passe sont hashés. Chaque auteur ne voit que ses propres données. Le site est conforme RGPD avec cases à cocher explicites, mention de la durée de conservation, et lien de désabonnement.",
    },
    {
      q: "Quelles sont les obligations RGPD ?",
      a: "En tant qu'auteur, tu dois : 1) Informer les lecteurs que leur email est transmis à Brevo, 2) Obtenir leur consentement explicite (cases à cocher), 3) Leur permettre de se désabonner à tout moment (lien en bas de chaque email Brevo), 4) Ne pas partager leurs données avec d'autres services. Les CGU et la politique de confidentialité sont disponibles dans le footer.",
    },
    {
      q: "Puis-je personnaliser les emails Brevo ?",
      a: "Oui, connecte-toi à ton compte Brevo et personnalise les templates de tes campagnes. L'email de confirmation d'inscription est géré par Brevo, pas par As-tu-lu.",
    },
    {
      q: "Y a-t-il une limite de téléchargements ?",
      a: "Non, chaque livre peut être téléchargé un nombre illimité de fois. Le compteur de téléchargements t'indique le nombre total.",
    },
    {
      q: "Le site est-il gratuit ?",
      a: "Oui, la plateforme est gratuite pour les auteurs et les lecteurs. Seul Brevo peut facturer selon ton volume d'emails (leur offre gratuite permet 300 emails/jour).",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ</h1>
        <p className="text-gray-500 text-sm mb-8">Questions fréquentes sur As-tu-lu</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm group open:shadow-md transition">
              <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-sm">▼</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-xl p-6 text-center">
          <h2 className="font-bold text-gray-900 mb-2">Besoin d&apos;aide ?</h2>
          <p className="text-sm text-gray-600">
            Contacte-nous à <a href="mailto:contact@as-tu-lu.fr" className="text-blue-600 underline">contact@as-tu-lu.fr</a>
          </p>
        </div>
      </div>
    </div>
  )
}
