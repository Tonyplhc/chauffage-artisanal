import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de protection des données personnelles de Chauffage Artisanal Luxembourg — conforme RGPD.",
  robots: { index: true, follow: true },
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      number="L2"
      eyebrow="Politique de confidentialité"
      title={<>Vos données, <em className="not-italic text-bleu">notre engagement</em></>}
      intro="Cette politique décrit comment Chauffage Artisanal collecte, utilise, conserve et protège vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD)."
    >
      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement de vos données est <strong>Chauffage Artisanal Sàrl</strong>{" "}
        <em>(coordonnées complètes à confirmer · cf. <a href="/mentions-legales">mentions
        légales</a>)</em>.
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons uniquement les données strictement nécessaires à nos finalités :</p>
      <ul>
        <li><strong>Via le formulaire /devis</strong> : nom, email, téléphone, commune, caractéristiques du projet (service, bâtiment, surface, énergie actuelle, délai, budget indicatif), photos optionnelles, message libre.</li>
        <li><strong>Via le formulaire /contact</strong> : nom, email, téléphone, objet, message.</li>
        <li><strong>Cookies techniques</strong> : un cookie de session admin (interne), un cookie de préférence de consentement.</li>
        <li><strong>Métadonnées techniques</strong> : adresse IP, user-agent, locale (à des fins de sécurité et statistiques anonymisées).</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <ul>
        <li>Traiter votre demande de devis ou d&apos;information.</li>
        <li>Vous recontacter via le canal préféré que vous avez indiqué.</li>
        <li>Préparer l&apos;étude technique de votre projet.</li>
        <li>Assurer la sécurité du site (rate limit, prévention spam).</li>
        <li>Conservation interne pour suivi commercial et obligations légales.</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>
        Le traitement de vos données repose sur votre <strong>consentement explicite</strong>{" "}
        (case à cocher obligatoire avant envoi du formulaire) et sur notre{" "}
        <strong>intérêt légitime</strong> à répondre à une demande commerciale.
      </p>

      <h2>5. Destinataires</h2>
      <p>
        Vos données sont accessibles uniquement par notre équipe interne (bureau d&apos;études,
        commerce). Aucune donnée n&apos;est revendue, ni transmise à des tiers à des fins
        commerciales.
      </p>
      <p>
        Sous-traitants techniques :
      </p>
      <ul>
        <li><strong>Vercel Inc.</strong> — hébergement web (UE / USA, conforme RGPD)</li>
        <li><strong>Supabase Inc.</strong> — base de données et stockage photos (UE)</li>
        <li><strong>Resend Inc.</strong> — envoi d&apos;emails transactionnels (UE / USA)</li>
        <li><strong>Sentry Inc.</strong> — collecte d&apos;erreurs techniques (le cas échéant, sans donnée personnelle)</li>
      </ul>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li><strong>Leads commerciaux non convertis</strong> : 24 mois à compter du dernier contact, puis suppression automatique.</li>
        <li><strong>Clients convertis</strong> : durée du contrat + 10 ans (obligations comptables et garanties techniques).</li>
        <li><strong>Logs techniques</strong> : 90 jours.</li>
        <li><strong>Cookies de consentement</strong> : 13 mois maximum.</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez à tout moment des droits suivants sur vos données :
      </p>
      <ul>
        <li><strong>Accès</strong> : obtenir une copie de vos données.</li>
        <li><strong>Rectification</strong> : corriger une donnée erronée.</li>
        <li><strong>Effacement</strong> (« droit à l&apos;oubli ») : demander la suppression de vos données.</li>
        <li><strong>Limitation</strong> : restreindre certains traitements.</li>
        <li><strong>Opposition</strong> : refuser un traitement.</li>
        <li><strong>Portabilité</strong> : récupérer vos données dans un format structuré.</li>
        <li><strong>Retrait du consentement</strong> à tout moment.</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous via le{" "}
        <a href="/contact">formulaire de contact</a> en précisant votre demande.
        Réponse sous 30 jours maximum.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Vos données sont stockées sur des serveurs sécurisés en Union européenne. Les
        communications sont chiffrées (HTTPS). L&apos;accès interne aux données est protégé
        par authentification.
      </p>

      <h2>9. Autorité de contrôle</h2>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
        réclamation auprès de la{" "}
        <a
          href="https://cnpd.public.lu"
          target="_blank"
          rel="noopener noreferrer"
        >
          Commission Nationale pour la Protection des Données (CNPD)
        </a>{" "}
        — autorité luxembourgeoise compétente.
      </p>

      <h2>10. Modification de cette politique</h2>
      <p>
        Cette politique peut évoluer. La version en vigueur est toujours celle publiée sur cette
        page, datée en pied de page.
      </p>
    </LegalPage>
  );
}
