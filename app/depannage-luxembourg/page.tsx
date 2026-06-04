import { SeoLuxembourgPage, buildSeoMetadata } from "@/components/seo-luxembourg-page";
import { SEO_PAGES } from "@/lib/seo-luxembourg-content";

const PAGE = SEO_PAGES["depannage-luxembourg"];

export const metadata = buildSeoMetadata(PAGE);

export default function DepannageLuxembourgPage() {
  return <SeoLuxembourgPage page={PAGE} />;
}
