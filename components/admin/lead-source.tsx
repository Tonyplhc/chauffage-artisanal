/**
 * Bloc lecture seule affichant la source d'acquisition d'un lead, si captée.
 */

import { Globe, Megaphone, ExternalLink, Sparkles } from "lucide-react";

type Source = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landing?: string;
  capturedAt?: string;
};

export function LeadSourceBlock({ source }: { source?: Source | null }) {
  if (!source) return null;
  const hasAny =
    source.utmSource ||
    source.utmCampaign ||
    source.utmMedium ||
    source.referrer ||
    source.landing;
  if (!hasAny) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1.5 mb-3">
        <Sparkles className="h-3 w-3" />
        Source d&apos;acquisition
      </div>
      <dl className="grid gap-1.5 text-sm">
        {source.utmSource && (
          <Row icon={<Globe className="h-3 w-3" />} label="Source" value={source.utmSource} />
        )}
        {source.utmMedium && (
          <Row label="Medium" value={source.utmMedium} />
        )}
        {source.utmCampaign && (
          <Row icon={<Megaphone className="h-3 w-3" />} label="Campagne" value={source.utmCampaign} />
        )}
        {source.utmContent && (
          <Row label="Content" value={source.utmContent} />
        )}
        {source.utmTerm && <Row label="Term" value={source.utmTerm} />}
        {source.referrer && (
          <Row icon={<ExternalLink className="h-3 w-3" />} label="Referrer" value={source.referrer} />
        )}
        {source.landing && <Row label="Landing" value={source.landing} mono />}
      </dl>
      {source.capturedAt && (
        <div className="mt-3 pt-2 border-t border-ink/5 text-[10px] text-muted font-mono">
          Capté {new Date(source.capturedAt).toLocaleString("fr-FR")}
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted inline-flex items-center gap-1 min-w-[80px]">
        {icon}
        {label}
      </dt>
      <dd
        className={`text-sm text-ink truncate ${mono ? "font-mono text-[11px]" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
