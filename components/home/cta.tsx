"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden bg-navy text-creme">
      {/* Layered background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop"
          alt=""
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
          quality={78}
          className="object-cover"
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(10,61,110, 0.88)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(11,87,160,0.30), transparent 65%)",
        }}
      />
      <div className="absolute top-0 inset-x-0 h-px divider-arch-dark" />

      <div className="container relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-sable">
            10 — Parlons de votre projet
          </div>
          <h2 className="mt-5 font-display text-display-2xl tracking-tightest text-balance max-w-5xl mx-auto text-creme">
            Un atelier. Une équipe.{" "}
            <em className="not-italic text-sable">Un seul interlocuteur.</em>
          </h2>
          <p className="mt-6 text-lg lg:text-xl text-creme/75 max-w-2xl mx-auto text-balance">
            Décrivez-nous votre projet : nous vous rappelons{" "}
            <strong className="text-sable font-semibold">dans la demi-journée</strong>{" "}
            pour fixer une{" "}
            <strong className="text-sable font-semibold">visite technique gratuite</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/estimation"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-creme text-navy px-7 py-4 text-sm font-medium hover:bg-bleu hover:text-creme transition-all hover:-translate-y-0.5"
            >
              Estimer mes économies · 60 s
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/contact"
              className="btn-ring group inline-flex items-center justify-center gap-2 rounded-full bg-terracotta/15 border border-terracotta/50 text-creme px-7 py-4 text-sm font-medium hover:bg-terracotta/25 transition-all"
            >
              <Phone className="h-4 w-4" />
              Nous contacter · dépannage
            </Link>
          </div>

          <div className="mt-8 text-xs font-mono uppercase tracking-eyebrow text-creme/55">
            Réponse rapide · Étude personnalisée · Devis transparent
          </div>
        </motion.div>
      </div>
    </section>
  );
}
