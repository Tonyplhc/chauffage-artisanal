import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Chauffage Artisanal Luxembourg.",
  robots: { index: true, follow: false },
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      number="L1"
      eyebrow="Mentions légales"
      title={<>Informations <em className="not-italic text-copper">légales</em></>}
      intro="Informations relatives à l'éditeur du site et à son hébergement, conformément à la législation luxembourgeoise."
    >
      <h2>Éditeur du site</h2>
      <p>
        <strong>Chauffage Artisanal S.à r.l.</strong> — société à responsabilité limitée de
        droit luxembourgeois, en activité depuis 1994.
      </p>
      <ul>
        <li>
          Siège social :{" "}
          <strong>28a, rue de Crauthem · L-3390 Peppange (commune de Roeser)</strong>
        </li>
        <li>
          Numéro d&apos;immatriculation (RCS Luxembourg) : <strong>B46877</strong>
        </li>
        <li>
          Téléphone :{" "}
          <a href="tel:+35249884100" className="hover:text-copper transition-colors">
            <strong>+352 49 88 41</strong>
          </a>
        </li>
        <li>
          Email :{" "}
          <a
            href="mailto:info@chauffage-artisanal.lu"
            className="hover:text-copper transition-colors"
          >
            <strong>info@chauffage-artisanal.lu</strong>
          </a>
        </li>
        <li>
          Gérance : <strong>Ricardo Almeida · Paolo Battista</strong>
        </li>
        <li>
          Affiliations : <strong>Fédération des Artisans · Fédération du Génie Technique</strong>
        </li>
        <li>
          Numéro de TVA intracommunautaire :{" "}
          <em>communiqué sur demande (registre LBR/VIES, RCS B46877)</em>
        </li>
      </ul>

      <h2>Hébergement du site</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut,
        CA 91789, USA — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>.
      </p>
      <p>
        Les emails transactionnels (confirmations de devis) sont envoyés via{" "}
        <strong>Resend Inc.</strong> et la base de données est hébergée chez{" "}
        <strong>Supabase Inc.</strong>, partenaires conformes RGPD avec serveurs en Europe.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu de ce site (textes, images, vidéos, identité graphique, code
        source) est protégé par le droit d&apos;auteur. Toute reproduction, même partielle, est
        soumise à autorisation préalable écrite de Chauffage Artisanal.
      </p>
      <p>
        Les marques de fabricants mentionnées (Viessmann, Daikin, Vaillant, etc.) sont la
        propriété de leurs ayants-droits respectifs. Leur mention sur ce site n&apos;implique
        aucun partenariat commercial exclusif, sauf indication contraire.
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        Les informations présentes sur ce site sont communiquées à titre informatif et peuvent
        évoluer sans préavis. Les montants d&apos;aides publiques (Klimabonus, primes
        communales) dépendent des dispositifs en vigueur et de l&apos;éligibilité individuelle du
        dossier — toute donnée chiffrée doit être vérifiée auprès des organismes officiels
        (MyEnergy, guichet.lu).
      </p>
      <p>
        Chauffage Artisanal ne saurait être tenu responsable d&apos;une mauvaise interprétation
        des contenus, ni de dommages indirects résultant de la consultation du site.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Ce site est régi par le droit luxembourgeois. Tout litige relatif à son utilisation
        relève de la compétence exclusive des tribunaux du Grand-Duché de Luxembourg.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question concernant ces mentions légales, écrivez-nous via le{" "}
        <a href="/contact">formulaire de contact</a>.
      </p>
    </LegalPage>
  );
}
