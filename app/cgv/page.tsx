import { LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company-info";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Conditions générales de vente — Chauffage Artisanal Luxembourg",
  description:
    "Conditions générales de vente conformes au droit luxembourgeois : commandes, prix, paiement, livraison, garantie, rétractation, droit applicable. Article par article.",
  alternates: buildAlternates("/cgv"),
};

export default function CgvPage() {
  return (
    <LegalPage
      number="L4"
      eyebrow="Conditions générales de vente"
      title={
        <>
          Conditions générales <em className="not-italic text-copper">de vente</em>
        </>
      }
      intro="Conditions applicables à toute prestation effectuée par Chauffage Artisanal S.à r.l. au Luxembourg. Conformes au Code de commerce luxembourgeois et à la loi sur la protection des consommateurs."
    >
      <h2>1. Vendeur</h2>
      <p>
        Les présentes conditions générales de vente régissent les relations contractuelles
        entre <strong>{COMPANY.legalName}</strong>, société à responsabilité limitée de droit
        luxembourgeois, immatriculée au RCS Luxembourg sous le numéro{" "}
        <strong>{COMPANY.registry.rcsLuxembourg}</strong>, ayant son siège social{" "}
        {COMPANY.address.full}, ci-après « le Vendeur » ou « Chauffage Artisanal », et tout
        client professionnel ou consommateur ayant accepté un devis, ci-après « le Client ».
      </p>

      <h2>2. Champ d&apos;application</h2>
      <p>
        Les présentes conditions s&apos;appliquent à toute prestation de services ou vente de
        biens réalisée par le Vendeur, en ce compris l&apos;installation, l&apos;entretien et
        le dépannage d&apos;équipements de chauffage, pompes à chaleur, climatisation,
        sanitaire et énergies renouvelables.
      </p>
      <p>
        L&apos;acceptation d&apos;un devis emporte l&apos;adhésion sans réserve aux présentes
        conditions, qui prévalent sur toutes conditions générales d&apos;achat du Client sauf
        accord écrit contraire.
      </p>

      <h2>3. Devis et commande</h2>
      <p>
        Tout devis est établi gratuitement et sans engagement, sous réserve d&apos;une visite
        technique préalable pour les chantiers significatifs. Le devis est valable{" "}
        <strong>30 jours</strong> à compter de sa date d&apos;émission. La signature du devis
        par le Client vaut commande ferme.
      </p>
      <p>
        Toute modification ultérieure à la commande, demandée par le Client, fera l&apos;objet
        d&apos;un avenant chiffré, accepté par les deux parties avant exécution.
      </p>

      <h2>4. Prix</h2>
      <p>
        Les prix sont exprimés en euros, hors taxes (HT) ou toutes taxes comprises (TTC) selon
        la qualité du Client. La TVA appliquée est celle en vigueur au moment de la
        facturation.
      </p>
      <p>
        Le <strong>taux réduit TVA logement 3 %</strong> (au lieu de 17 %) est appliqué sur
        les travaux éligibles selon la loi modifiée du 12 février 1979, sous réserve de
        l&apos;ancienneté du logement, de l&apos;affectation à l&apos;habitation principale
        et de la délivrance de l&apos;autorisation préalable AED. Les conditions d&apos;octroi
        et de maintien de ce taux relèvent de la responsabilité du Client.
      </p>

      <h2>5. Paiement</h2>
      <p>Sauf dispositions particulières prévues au devis :</p>
      <ul>
        <li>
          <strong>Acompte de 30 %</strong> à la commande pour les chantiers supérieurs à
          5 000 € HT
        </li>
        <li>
          <strong>40 %</strong> à mi-chantier (sur situation de travaux)
        </li>
        <li>
          <strong>Solde de 30 %</strong> à la mise en service, sous 30 jours à compter de la
          facture
        </li>
      </ul>
      <p>
        Tout retard de paiement entraîne, sans mise en demeure préalable, l&apos;application
        d&apos;intérêts de retard au taux de la BCE majoré de 8 points, ainsi qu&apos;une
        indemnité forfaitaire de 40 € pour frais de recouvrement (Directive 2011/7/UE,
        transposée au Luxembourg).
      </p>

      <h2>6. Délais et exécution</h2>
      <p>
        Les délais d&apos;exécution sont communiqués à titre indicatif et dépendent de la
        disponibilité des équipements, des autorisations administratives (accord de principe
        Klimabonus, permis communaux le cas échéant) et de l&apos;accessibilité du chantier.
      </p>
      <p>
        Un retard d&apos;exécution ne peut donner lieu à des dommages et intérêts ni à
        l&apos;annulation de la commande, sauf en cas de manquement grave et caractérisé du
        Vendeur.
      </p>

      <h2>7. Réception des travaux</h2>
      <p>
        Pour les installations à gaz, une demande de <strong>réception SCRB</strong> (Service
        Contrôle Réception Bâtiments — Chambre des Métiers) est déposée dans les 4 semaines
        suivant la mise en service, conformément au RGD du 27 février 2010 modifié.
      </p>
      <p>
        La signature du procès-verbal de mise en service vaut réception sans réserve, sauf
        observations expresses émises dans les 8 jours suivant la mise en service.
      </p>

      <h2>8. Garanties</h2>
      <p>
        <strong>Garantie légale de conformité</strong> : conformément à la loi du 21 avril
        2004 relative à la garantie de conformité due par le vendeur de biens meubles
        corporels au consommateur, les biens fournis bénéficient de la garantie légale.
      </p>
      <p>
        <strong>Garantie constructeur</strong> : les équipements installés bénéficient de la
        garantie constructeur dans les conditions précisées par le fabricant, sous réserve du
        respect des préconisations d&apos;entretien.
      </p>
      <p>
        <strong>Garantie de pose</strong> : la pose réalisée par le Vendeur est garantie 1 an
        contre tout défaut d&apos;installation.
      </p>

      <h2>9. Réserve de propriété</h2>
      <p>
        Le Vendeur conserve la propriété pleine et entière des biens livrés jusqu&apos;au
        paiement intégral de leur prix en principal, intérêts et accessoires. Le transfert
        des risques s&apos;opère cependant à la livraison.
      </p>

      <h2>10. Droit de rétractation (consommateurs)</h2>
      <p>
        Conformément aux articles L. 222-9 et suivants du Code de la consommation
        luxembourgeois, le Client consommateur dispose d&apos;un délai de{" "}
        <strong>14 jours</strong> pour exercer son droit de rétractation à compter de la
        conclusion du contrat hors établissement (à distance ou démarchage), sans avoir à
        justifier de motifs ni à payer de pénalités.
      </p>
      <p>
        Si le Client demande expressément le commencement des travaux avant l&apos;expiration
        du délai de rétractation, il devra acquitter le montant des prestations effectuées
        en cas de rétractation.
      </p>

      <h2>11. Klimabonus et aides publiques</h2>
      <p>
        Le Vendeur fournit la partie technique nécessaire au dépôt du dossier Klimabonus
        (fiches produits, schémas, attestations). Le dépôt administratif du dossier sur
        MyGuichet.lu, ainsi que l&apos;obtention de l&apos;<strong>accord de principe AVANT
        signature du devis</strong>, demeurent de la responsabilité du Client.
      </p>
      <p>
        Aucun engagement n&apos;est pris quant à l&apos;obtention effective des aides, dont
        l&apos;attribution relève de l&apos;Administration de l&apos;environnement.
      </p>

      <h2>12. Données personnelles</h2>
      <p>
        Les données personnelles collectées dans le cadre du contrat sont traitées
        conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
        luxembourgeoise du 1er août 2018. Pour plus d&apos;informations, voir la{" "}
        <a href="/confidentialite">Politique de confidentialité</a>.
      </p>

      <h2>13. Responsabilité</h2>
      <p>
        La responsabilité du Vendeur est limitée au montant de la prestation concernée. Le
        Vendeur ne saurait être tenu responsable des dommages indirects, ni des dommages
        résultant d&apos;un défaut d&apos;entretien postérieur à la mise en service ou
        d&apos;une utilisation non conforme aux préconisations remises au Client.
      </p>

      <h2>14. Force majeure</h2>
      <p>
        Le Vendeur ne saurait être tenu responsable de la non-exécution ou de l&apos;exécution
        tardive de ses obligations en raison d&apos;événements constitutifs de force majeure
        (catastrophes naturelles, grèves, pénuries de matières premières, retards
        fournisseurs, pandémies).
      </p>

      <h2>15. Litiges et droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au <strong>droit luxembourgeois</strong>. En
        cas de litige, et préalablement à toute action contentieuse, les parties
        s&apos;efforcent de trouver une solution amiable.
      </p>
      <p>
        À défaut d&apos;accord amiable, tout litige sera porté devant les tribunaux
        compétents du Grand-Duché de Luxembourg. Pour les litiges de consommation, le Client
        consommateur peut saisir le{" "}
        <a
          href="https://mediateurconsommation.lu/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Service national du Médiateur de la consommation
        </a>{" "}
        au Luxembourg, en application de la loi du 17 février 2016.
      </p>

      <h2>16. Dispositions finales</h2>
      <p>
        Si l&apos;une des clauses des présentes conditions devait être déclarée nulle ou
        inapplicable, les autres clauses conserveraient leur pleine validité.
      </p>
      <p>
        Le fait pour le Vendeur de ne pas se prévaloir à un moment donné d&apos;une des
        clauses présentes ne saurait être interprété comme valant renonciation à s&apos;en
        prévaloir ultérieurement.
      </p>

      <p style={{ marginTop: "2rem", fontSize: "0.85em", opacity: 0.7 }}>
        <em>Dernière mise à jour : {new Date().toLocaleDateString("fr-LU")}.</em>
      </p>
    </LegalPage>
  );
}
