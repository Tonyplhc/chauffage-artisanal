import Link from "next/link";
import { ArrowUpRight, Code2, Key, Lock, Zap } from "lucide-react";

export const metadata = {
  title: "API publique · Documentation · Chauffage Artisanal",
  description:
    "Documentation de l'API REST pour intégrer Chauffage Artisanal à votre stack.",
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/leads",
    scope: "read:leads",
    desc: "Liste des leads avec filtres optionnels.",
    params: [
      { name: "status", type: "string", desc: "nouveau · contacte · devis_envoye · converti · perdu" },
      { name: "from", type: "ISO date", desc: "Date de début (YYYY-MM-DD)" },
      { name: "to", type: "ISO date", desc: "Date de fin (YYYY-MM-DD)" },
      { name: "limit", type: "int", desc: "Max 500, défaut 100" },
    ],
    example: {
      data: [
        {
          reference: "DEV-2026-1234",
          submittedAt: "2026-05-28T10:30:00.000Z",
          status: "nouveau",
          services: ["pac"],
          surface: 180,
          commune: "Luxembourg-Ville",
          fullName: "Jean Dupont",
          email: "jean@example.lu",
          score: 72,
          level: "hot",
        },
      ],
      count: 1,
      apiVersion: "v1",
    },
  },
  {
    method: "GET",
    path: "/api/v1/catalogue",
    scope: "read:catalogue",
    desc: "Catalogue produit/prestation complet.",
    example: {
      data: [],
      count: 0,
      apiVersion: "v1",
    },
  },
  {
    method: "GET",
    path: "/api/v1/articles",
    scope: "read:articles",
    desc: "Liste publique des articles éditoriaux (métadonnées).",
    example: {
      data: [
        {
          slug: "klimabonus-2026-ce-quil-faut-savoir",
          title: "Klimabonus 2026 : ce qui change",
          excerpt: "...",
          category: "klimabonus",
          readingMinutes: 6,
          publishedAt: "2026-05-01",
        },
      ],
      count: 3,
      apiVersion: "v1",
    },
  },
  {
    method: "GET",
    path: "/api/v1/stats",
    scope: "read:stats",
    desc: "Stats agrégées (sans données personnelles).",
    example: {
      totals: { leads: 42 },
      byStatus: { nouveau: 12, contacte: 8, devis_envoye: 14, converti: 6, perdu: 2 },
      byLevel: { hot: 5, warm: 28, cold: 9 },
      byService: { pac: 18, chauffage: 12, clim: 8 },
      apiVersion: "v1",
    },
  },
];

const ERROR_CODES = [
  { code: 401, name: "missing_api_key", desc: "Aucune clé fournie." },
  { code: 401, name: "invalid_key", desc: "Clé inconnue ou mal formée." },
  { code: 401, name: "key_revoked", desc: "Clé révoquée par l'admin." },
  { code: 403, name: "scope_missing", desc: "Clé valide mais sans le scope requis." },
  { code: 429, name: "rate_limit", desc: "Trop de requêtes — réessayer plus tard." },
];

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Documentation · v1
          </div>
          <h1 className="mt-3 font-display text-display-md text-ink">
            API publique <em className="not-italic text-copper">REST</em>
          </h1>
          <p className="mt-4 text-graphite leading-relaxed max-w-2xl">
            Accès programmatique à vos données pour intégrer Chauffage Artisanal
            à votre stack (CRM, ERP, BI, automation). JSON only, HTTPS only,
            auth par API key.
          </p>
        </div>

        {/* Quick start */}
        <Card icon={Zap} title="Quick start">
          <ol className="space-y-3 text-sm text-graphite">
            <li>
              <strong className="text-ink">1.</strong> Générez une API key
              depuis{" "}
              <Link href="/admin/api-keys" className="text-copper underline">
                /admin/api-keys
              </Link>{" "}
              avec les scopes nécessaires.
            </li>
            <li>
              <strong className="text-ink">2.</strong> Stockez la clé hors
              ligne (elle n&apos;est affichée qu&apos;une fois).
            </li>
            <li>
              <strong className="text-ink">3.</strong> Passez-la dans le header{" "}
              <code className="font-mono bg-white px-1.5 py-0.5 rounded">
                Authorization: Bearer YOUR_KEY
              </code>{" "}
              ou{" "}
              <code className="font-mono bg-white px-1.5 py-0.5 rounded">
                X-API-Key: YOUR_KEY
              </code>
              .
            </li>
          </ol>
        </Card>

        {/* Curl example */}
        <Card icon={Code2} title="Exemple curl">
          <pre className="text-xs bg-charcoal text-cream p-4 rounded-lg overflow-x-auto">
            {`curl https://www.chauffage-artisanal.lu/api/v1/leads \\
  -H "Authorization: Bearer ca_pk_xxxxxxxxxxxxxx" \\
  -H "Accept: application/json"`}
          </pre>
        </Card>

        {/* Auth */}
        <Card icon={Key} title="Authentification">
          <div className="text-sm text-graphite space-y-2">
            <p>
              Chaque requête doit inclure une clé API valide. La clé est vérifiée
              par hash SHA-256 côté serveur — la clé en clair n&apos;est jamais
              stockée.
            </p>
            <p>
              Les scopes contrôlent ce qu&apos;une clé peut lire :
            </p>
            <ul className="grid sm:grid-cols-2 gap-1.5 mt-2">
              {["read:leads", "read:catalogue", "read:articles", "read:zones", "read:stats"].map(
                (s) => (
                  <li
                    key={s}
                    className="text-xs"
                  >
                    <code className="font-mono bg-white px-2 py-1 rounded border border-ink/10">
                      {s}
                    </code>
                  </li>
                ),
              )}
            </ul>
          </div>
        </Card>

        {/* Endpoints */}
        <div className="mt-10 mb-5">
          <h2 className="font-display text-2xl text-ink">Endpoints</h2>
        </div>

        <div className="grid gap-5">
          {ENDPOINTS.map((e) => (
            <div
              key={e.path}
              className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-ink/8 flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs uppercase tracking-eyebrow text-[#22a06b] bg-[#22a06b]/10 border border-[#22a06b]/30 px-2.5 py-1 rounded-full">
                  {e.method}
                </span>
                <code className="font-mono text-sm text-ink font-medium">
                  {e.path}
                </code>
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/30 px-2 py-0.5 rounded-full ml-auto">
                  {e.scope}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-graphite mb-3">{e.desc}</p>

                {e.params && (
                  <>
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                      Paramètres
                    </div>
                    <table className="w-full text-xs mb-4">
                      <thead className="text-left text-muted font-mono uppercase tracking-eyebrow">
                        <tr>
                          <th className="py-1 pr-3">Nom</th>
                          <th className="py-1 pr-3">Type</th>
                          <th className="py-1">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.params.map((p) => (
                          <tr key={p.name} className="border-t border-ink/8">
                            <td className="py-1.5 pr-3 font-mono text-ink">
                              {p.name}
                            </td>
                            <td className="py-1.5 pr-3 font-mono text-graphite">
                              {p.type}
                            </td>
                            <td className="py-1.5 text-graphite">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                  Exemple de réponse
                </div>
                <pre className="text-xs bg-charcoal text-cream p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(e.example, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Errors */}
        <Card icon={Lock} title="Codes d'erreur">
          <table className="w-full text-sm">
            <thead className="text-left font-mono uppercase text-[10px] tracking-eyebrow text-muted">
              <tr>
                <th className="py-2 pr-3">HTTP</th>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2">Cause</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map((e) => (
                <tr key={e.name} className="border-t border-ink/8">
                  <td className="py-2 pr-3 font-mono text-ink">{e.code}</td>
                  <td className="py-2 pr-3 font-mono text-copper">{e.name}</td>
                  <td className="py-2 text-graphite">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="mt-10 text-center">
          <Link
            href="/admin/api-keys"
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
          >
            Gérer mes clés
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Code2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-ink/10 bg-white shadow-soft p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-copper" />
        <h3 className="font-display text-xl text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}
