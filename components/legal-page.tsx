import { PageHeader } from "@/components/ui";

export function LegalPage({
  number,
  eyebrow,
  title,
  intro,
  children,
}: {
  number: string;
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader number={number} eyebrow={eyebrow} title={title} intro={intro} />
      <section className="py-12 lg:py-20 bg-creme">
        <div className="container max-w-3xl">
          <article className="prose-legal">{children}</article>
          <div className="mt-16 pt-8 border-t border-pierre text-xs text-muted font-mono uppercase tracking-eyebrow">
            Version du document · à confirmer par le client
          </div>
        </div>
      </section>
    </>
  );
}
