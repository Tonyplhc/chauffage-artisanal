import { SeoLuxembourgPage, buildSeoMetadata } from "@/components/seo-luxembourg-page";
import { SEO_PAGES } from "@/lib/seo-luxembourg-content";

const PAGE = SEO_PAGES["pompe-a-chaleur-luxembourg"];

export const metadata = buildSeoMetadata(PAGE);

export default function PompeAChaleurLuxembourgPage() {
  return <SeoLuxembourgPage page={PAGE} />;
}
