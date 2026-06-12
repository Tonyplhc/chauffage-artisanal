import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Flame,
  Leaf,
  Snowflake,
  Droplets,
  Sun,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { PageHeader, Eyebrow, Reveal, SectionTitle } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { COMMUNES, getCommune } from "@/lib/communes";
import { FinalCTA } from "@/components/home/cta";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return COMMUNES.map((c) => ({ commune: c.slug }));
}

export function generateMetadata({ params }: { params: { commune: string } }) {
  const c = getCommune(params.commune);
  if (!c) return { title: "Commune introuvable · Chauffage Artisanal" };
  return {
    title: `Chauffage, PAC, climatisation à ${c.name} · Chauffage Artisanal`,
    description: `Installation de chauffage, pompes à chaleur, climatisation et sanitaire à ${c.name} (Luxembourg). Étude personnalisée par notre bureau d'études.`,
    alternates: { canonical: `/zones/${c.slug}` },
  };
}

const SERVICES = [
  {
    icon: Flame,
    href: "/chauffage",
    title: "Chauffage",
    desc: "Chaudières condensation, hybrides, biomasse",
  },
  {
    icon: Leaf,
    href: "/pompes-a-chaleur",
    title: "Pompes à chaleur",
    desc: "Air/eau, géothermique, hybride",
  },
  {
    icon: Snowflake,
    href: "/climatisation",
    title: "Climatisation",
    desc: "Mono / multi-split, tertiaire",
  },
  {
    icon: Droplets,
    href: "/sanitaire",
    title: "Sanitaire",
    desc: "Salles de bain premium, plomberie",
  },
  {
    icon: Sun,
    href: "/energies-renouvelables",
    title: "Énergies renouvelables",
    desc: "Photovoltaïque, solaire thermique",
  },
  {
    icon: ShieldCheck,
    href: "/entretien",
    title: "Entretien",
    desc: "Contrats, dépannage prioritaire",
  },
];

export default function CommunePage({ params }: { params: { commune: string } }) {
  const c = getCommune(params.commune);
  if (!c) notFound();

  return (
    <>
      {/* JSON-LD LocalBusiness — boost SEO local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: `Chauffage Artisanal — ${c.name}`,
            description: `Chauffage, pompes à chaleur, climatisation, sanitaire et énergies renouvelables à ${c.name}.`,
            url: `https://www.chauffage-artisanal.lu/zones/${c.slug}`,
            areaServed: { "@type": "City", name: c.name, addressCountry: "LU" },
            telephone: "À configurer",
            address: { "@type": "PostalAddress", addressLocality: c.name, addressCountry: "LU" },
          }),
        }}
      />

      <PageHeader
        number="15"
        eyebrow={`Zone · ${c.name}`}
        title={
          <>
            Chauffage, PAC & climatisation{" "}
            <em className="not-italic text-bleu">à {c.name}</em>.
          </>
        }
        intro={
          <>
            {c.context} Nous intervenons sur l&apos;ensemble des typologies — résidentiel, collectif, tertiaire — avec une lecture adaptée au tissu bâti local.
          </>
        }
        aside={
          <HeroAside
            icon={MapPin}
            eyebrow={`Spécificités ${c.name}`}
            items={c.considerations.slice(0, 3).map((it) => ({
              label: it.split(" — ")[0] ?? it,
              body: it.split(" — ")[1] ?? "",
            }))}
            footnote="Étude personnalisée à chaque adresse"
          />
        }
      />

      {/* Profil bâti */}
      <section className="py-10 lg:py-14 bg-creme">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <Eyebrow number="01">Lecture du tissu bâti</Eyebrow>
              <Reveal>
                <SectionTitle className="mt-4">
                  Comprendre {c.name} avant de chiffrer.
                </SectionTitle>
              </Reveal>
              <p className="mt-5 text-taupe leading-relaxed">
                Une commune n&apos;est jamais homogène — chaque rue raconte une époque. Notre première étape sur tout projet est une lecture du bâti spécifique à votre adresse, avant tout chiffrage.
              </p>
              <Link
                href="/devis"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-sm font-medium hover:bg-bleu transition-colors"
              >
                Demander une étude
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-7 p-6 lg:p-8 rounded-3xl border border-pierre bg-white">
              <p className="text-taupe leading-relaxed">{c.buildingProfile}</p>

              <div className="mt-6 pt-5 border-t border-pierre">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-4">
                  Spécificités à anticiper
                </div>
                <ul className="grid gap-2.5">
                  {c.considerations.map((it) => (
                    <li
                      key={it}
                      className="flex items-start gap-3 text-sm text-taupe"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-bleu shrink-0" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projets typiques */}
      <section className="py-10 lg:py-14 bg-creme border-y border-pierre">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="02">Projets typiques</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Ce que nous rencontrons souvent à {c.name}.
              </SectionTitle>
            </Reveal>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {c.typicalProjects.map((p, i) => (
              <div
                key={p}
                className="p-5 lg:p-6 rounded-2xl bg-white border border-pierre hover:border-bleu/40 transition-colors"
              >
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                  Cas type 0{i + 1}
                </div>
                <div className="mt-3 text-base text-anthra font-medium">{p}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services accessibles */}
      <section className="py-10 lg:py-14 bg-creme">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="03">Nos métiers à {c.name}</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Six savoir-faires, <em className="not-italic text-bleu">une seule équipe</em>.
              </SectionTitle>
            </Reveal>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group p-5 lg:p-6 rounded-2xl border border-pierre bg-white hover:border-bleu/40 hover:shadow-lift transition-all"
              >
                <div className="h-10 w-10 rounded-full bg-bleu/10 border border-bleu/30 grid place-items-center">
                  <s.icon className="h-4 w-4 text-bleu" />
                </div>
                <div className="mt-4 font-display text-xl text-anthra tracking-tight">
                  {s.title}
                </div>
                <p className="mt-1.5 text-sm text-taupe">{s.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow text-anthra group-hover:text-bleu transition-colors">
                  Voir
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Autres communes */}
      <section className="py-10 bg-creme border-t border-pierre">
        <div className="container">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-4">
            Autres zones
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMUNES.filter((x) => x.slug !== c.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/zones/${x.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-pierre text-sm text-taupe hover:border-bleu/40 hover:text-bleu transition-colors"
              >
                <MapPin className="h-3 w-3" />
                {x.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
