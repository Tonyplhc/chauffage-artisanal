"use client";

import { LegalPage } from "@/components/legal-page";

// metadata exported via layout.tsx
export default function CookiesPage() {
  return (
    <LegalPage
      number="L3"
      eyebrow="Politique cookies"
      title={<>Cookies & <em className="not-italic text-copper">traceurs</em></>}
      intro="Cette page détaille l'usage des cookies et traceurs sur notre site, conformément à la réglementation européenne (ePrivacy + RGPD)."
    >
      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, mobile)
        lors de la visite d&apos;un site. Il permet au site de mémoriser certaines informations
        sur votre navigation.
      </p>

      <h2>2. Cookies que nous utilisons</h2>

      <h3>Cookies strictement nécessaires <em className="not-italic text-copper">(toujours actifs)</em></h3>
      <p>
        Ces cookies sont indispensables au fonctionnement du site. Ils ne nécessitent pas votre
        consentement.
      </p>
      <ul>
        <li><strong>ca-admin-session</strong> — cookie de session pour l&apos;accès au tableau de bord administrateur interne. Signé HMAC, durée 12 heures.</li>
        <li><strong>ca-consent-v1</strong> — mémorise votre choix de consentement cookies (acceptation, refus, préférences). Durée : 13 mois maximum.</li>
      </ul>

      <h3>Cookies de mesure d&apos;audience (analytics) <em className="not-italic text-copper">(sur consentement)</em></h3>
      <p>
        Activés uniquement après votre accord explicite via le bandeau cookies. Permettent
        d&apos;analyser de manière anonymisée la fréquentation du site pour améliorer
        l&apos;expérience.
      </p>
      <ul>
        <li><strong>Fournisseur</strong> : à confirmer (Plausible, Matomo ou Google Analytics 4 anonymisé).</li>
        <li><strong>Données collectées</strong> : pages visitées, durée, source de trafic — agrégées, jamais individuelles.</li>
        <li><strong>Durée</strong> : 13 mois maximum.</li>
      </ul>

      <h3>Cookies marketing <em className="not-italic text-copper">(sur consentement)</em></h3>
      <p>
        Activés uniquement si vous l&apos;acceptez. Utilisés le cas échéant pour mesurer
        l&apos;efficacité de campagnes publicitaires. Aucune revente ni partage avec des tiers
        commerciaux.
      </p>

      <h2>3. Gérer vos préférences</h2>
      <p>
        Lors de votre première visite, un bandeau vous permet d&apos;accepter, refuser, ou
        personnaliser vos choix. Vous pouvez modifier vos préférences à tout moment en{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); if (typeof window !== "undefined") { localStorage.removeItem("ca-consent-v1"); location.reload(); } }}>
          réinitialisant votre consentement
        </a>
        {" "}(le bandeau réapparaîtra).
      </p>
      <p>
        Vous pouvez également bloquer les cookies directement dans votre navigateur :
      </p>
      <ul>
        <li><strong>Chrome</strong> : Paramètres → Confidentialité et sécurité → Cookies</li>
        <li><strong>Firefox</strong> : Préférences → Vie privée et sécurité</li>
        <li><strong>Safari</strong> : Préférences → Confidentialité</li>
        <li><strong>Edge</strong> : Paramètres → Cookies et autorisations</li>
      </ul>
      <p>
        Note : le blocage des cookies strictement nécessaires peut empêcher le bon
        fonctionnement de certaines parties du site.
      </p>

      <h2>4. Liens utiles</h2>
      <ul>
        <li><a href="/confidentialite">Politique de confidentialité complète</a></li>
        <li>
          <a href="https://cnpd.public.lu" target="_blank" rel="noopener noreferrer">
            CNPD Luxembourg (autorité de contrôle)
          </a>
        </li>
      </ul>
    </LegalPage>
  );
}
