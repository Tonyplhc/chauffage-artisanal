import { notFound } from "next/navigation";
import { BrandDetailPage, buildBrandMetadata } from "@/components/brand-detail-page";
import { BRAND_SLUGS, getBrand } from "@/lib/brands-content";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return BRAND_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const brand = getBrand(params.slug);
  if (!brand) {
    return { title: "Marque introuvable · Chauffage Artisanal" };
  }
  return buildBrandMetadata(brand);
}

export default function BrandPage({ params }: { params: { slug: string } }) {
  const brand = getBrand(params.slug);
  if (!brand) notFound();
  return <BrandDetailPage brand={brand} />;
}
