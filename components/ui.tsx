"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease, delay: i * 0.08 },
  }),
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export function Eyebrow({
  number,
  children,
  className,
}: {
  number?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow text-bleu",
        className,
      )}
    >
      {number && <span className="text-muted">{number}</span>}
      {number && <span className="block h-px w-8 bg-bleu/50" />}
      <span>{children}</span>
    </div>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-display text-display-lg text-balance text-anthra",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 group";
  const styles = {
    primary: "bg-navy text-creme hover:bg-bleu hover:-translate-y-0.5",
    secondary:
      "bg-creme text-anthra border border-pierre hover:border-bleu/40 hover:bg-white",
    ghost: "text-anthra border border-pierre hover:border-pierre hover:bg-sable/60",
  } as const;
  return (
    <Link href={href} className={cn(base, styles[variant], className)}>
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  number,
  eyebrow,
  title,
  intro,
  aside,
}: {
  number: string;
  eyebrow: string;
  title: React.ReactNode;
  intro: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="relative pt-14 lg:pt-20 pb-14 lg:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-copper-glow opacity-100" />
      <div className="absolute inset-0 bg-grid [background-size:64px_64px] opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="container relative">
        <Eyebrow number={number}>{eyebrow}</Eyebrow>
        <Reveal>
          <h1 className="mt-4 font-display text-display-xl text-balance max-w-5xl text-anthra">
            {title}
          </h1>
        </Reveal>
        <div className="mt-6 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <Reveal delay={1} className="lg:col-span-7">
            <p className="max-w-2xl text-lg text-taupe text-balance">{intro}</p>
          </Reveal>
          {aside && (
            <Reveal delay={2} className="lg:col-span-5">
              {aside}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
