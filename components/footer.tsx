import Link from "next/link";
import { Phone, Mail, MapPin, ArrowUpRight, Users } from "lucide-react";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { COMPANY } from "@/lib/company-info";
import { OpeningStatusBadge } from "@/components/opening-hours";

export function Footer() {
  return (
    <footer className="relative border-t border-ink/8 bg-linen">
      <div className="absolute inset-x-0 top-0 h-px divider-arch" />

      {/* Carrières · bandeau plein bandeau au-dessus du footer */}
      <div className="container pt-14 lg:pt-20">
        <Link
          href="/recrutement"
          className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 lg:p-6 rounded-2xl border border-copper/30 bg-white hover:bg-cream hover:shadow-lift transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="grid place-items-center h-11 w-11 rounded-full bg-copper/12 border border-copper/30 shrink-0">
              <Users className="h-5 w-5 text-copper" />
            </span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Carrières · maison technique
              </div>
              <div className="mt-1 font-display text-xl text-ink tracking-tight">
                Rejoindre Chauffage Artisanal
              </div>
              <div className="mt-1 text-sm text-graphite">
                Techniciens, frigoristes, apprentis, bureau d&apos;études — postes ouverts en
                permanence.
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-ink group-hover:text-copper transition-colors">
            Voir les postes
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </Link>
      </div>

      <div className="container py-14 lg:py-20 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-6">
            00 — La maison
          </div>
          <h2 className="font-display text-display-md text-balance text-ink">
            Le confort thermique <em className="not-italic text-copper">nouvelle génération</em> au
            Luxembourg.
          </h2>
          <p className="mt-6 text-graphite max-w-md">
            Depuis <strong className="text-copper font-semibold">1994</strong>, nous concevons, installons et entretenons des systèmes thermiques pour les
            maisons, immeubles et bâtiments tertiaires du Grand-Duché.
          </p>
          <Link
            href="/devis"
            className="mt-8 inline-flex items-center gap-2 text-ink hover:text-copper transition-colors group"
          >
            <span className="text-sm uppercase tracking-eyebrow font-mono">Demander un devis</span>
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          <div className="mt-10">
            <NewsletterSignup />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-4">
            Métiers
          </div>
          <ul className="space-y-2.5 text-sm text-graphite">
            <li><Link href="/chauffage" className="hover:text-copper transition-colors">Chauffage</Link></li>
            <li><Link href="/pompes-a-chaleur" className="hover:text-copper transition-colors">Pompes à chaleur</Link></li>
            <li><Link href="/climatisation" className="hover:text-copper transition-colors">Climatisation</Link></li>
            <li><Link href="/sanitaire" className="hover:text-copper transition-colors">Sanitaire</Link></li>
            <li><Link href="/energies-renouvelables" className="hover:text-copper transition-colors">Énergies renouvelables</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-4">
            Services
          </div>
          <ul className="space-y-2.5 text-sm text-graphite">
            <li><Link href="/depannage" className="hover:text-copper transition-colors">Dépannage 24/7</Link></li>
            <li><Link href="/entretien" className="hover:text-copper transition-colors">Entretien</Link></li>
            <li><Link href="/savoir-faire" className="hover:text-copper transition-colors">Savoir-faire</Link></li>
            <li><Link href="/marques" className="hover:text-copper transition-colors">Marques</Link></li>
            <li><Link href="/realisations" className="hover:text-copper transition-colors">Réalisations</Link></li>
            <li><Link href="/actualites" className="hover:text-copper transition-colors">Actualités</Link></li>
            <li><Link href="/primes-aides" className="hover:text-copper transition-colors">Primes & aides</Link></li>
            <li><Link href="/a-propos" className="hover:text-copper transition-colors">À propos</Link></li>
            <li><Link href="/recrutement" className="hover:text-copper transition-colors">Recrutement</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-4">
            Atelier
          </div>
          <ul className="space-y-3 text-sm text-graphite">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 text-copper shrink-0" />
              <span>
                {COMPANY.address.street}
                <br />
                {COMPANY.address.postalCode} {COMPANY.address.city}
              </span>
            </li>
            <li>
              <a
                href={`tel:${COMPANY.phone.tel}`}
                className="flex items-center gap-2.5 hover:text-copper transition-colors"
              >
                <Phone className="h-4 w-4 text-copper" />
                {COMPANY.phone.display}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${COMPANY.email}`}
                className="flex items-center gap-2.5 hover:text-copper transition-colors"
              >
                <Mail className="h-4 w-4 text-copper" />
                {COMPANY.email}
              </a>
            </li>
          </ul>
          <div className="mt-6 space-y-2">
            <OpeningStatusBadge />
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted leading-relaxed">
              Lun-Ven 8h00–12h00 / 13h00–17h00
              <br />
              Astreinte dépannage hors horaires
            </div>
          </div>
        </div>
      </div>

      {/* Pages SEO Luxembourg — maillage interne + autorité topique */}
      <div className="border-t border-ink/8 bg-cream">
        <div className="container py-8 lg:py-10">
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Au Luxembourg
            </div>
            <div className="text-xs text-muted">
              Pages dédiées par service · Grande Région
            </div>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-2 text-sm text-graphite">
            <li><Link href="/chauffage-luxembourg" className="hover:text-copper transition-colors">Chauffage Luxembourg</Link></li>
            <li><Link href="/pompe-a-chaleur-luxembourg" className="hover:text-copper transition-colors">Pompe à chaleur Luxembourg</Link></li>
            <li><Link href="/climatisation-luxembourg" className="hover:text-copper transition-colors">Climatisation Luxembourg</Link></li>
            <li><Link href="/salle-de-bain-luxembourg" className="hover:text-copper transition-colors">Salle de bain Luxembourg</Link></li>
            <li><Link href="/ventilation-luxembourg" className="hover:text-copper transition-colors">Ventilation Luxembourg</Link></li>
            <li><Link href="/depannage-luxembourg" className="hover:text-copper transition-colors">Dépannage Luxembourg</Link></li>
            <li><Link href="/entretien-chaudiere-luxembourg" className="hover:text-copper transition-colors">Entretien chaudière Luxembourg</Link></li>
            <li><Link href="/chauffe-eau-luxembourg" className="hover:text-copper transition-colors">Chauffe-eau Luxembourg</Link></li>
            <li><Link href="/plombier-luxembourg" className="hover:text-copper transition-colors">Plombier Luxembourg</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/8">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted font-mono uppercase tracking-eyebrow">
          <div>
            © {new Date().getFullYear()} {COMPANY.legalName} · RCS Luxembourg{" "}
            {COMPANY.registry.rcsLuxembourg}
          </div>
          <div className="flex gap-6 flex-wrap">
            <Link href="/mentions-legales" className="hover:text-ink">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-ink">Confidentialité</Link>
            <Link href="/cookies" className="hover:text-ink">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
