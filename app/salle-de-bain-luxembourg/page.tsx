import { SeoLuxembourgPage, buildSeoMetadata } from "@/components/seo-luxembourg-page";
import { SEO_PAGES } from "@/lib/seo-luxembourg-content";

const PAGE = SEO_PAGES["salle-de-bain-luxembourg"];

export const metadata = buildSeoMetadata(PAGE);

export default function SalleDeBainLuxembourgPage() {
  return <SeoLuxembourgPage page={PAGE} />;
}
