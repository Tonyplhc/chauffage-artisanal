"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Users } from "lucide-react";

export function RecruitmentStrip() {
  return (
    <section className="bg-creme border-y border-pierre">
      <div className="container py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 lg:p-6 rounded-2xl border border-bleu/30 bg-white shadow-soft"
        >
          <div className="flex items-start md:items-center gap-4 flex-1 min-w-0">
            <div className="grid place-items-center h-11 w-11 rounded-full bg-bleu/12 border border-bleu/30 shrink-0">
              <Users className="h-5 w-5 text-bleu" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bleu opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bleu"></span>
                </span>
                Nous recrutons
              </div>
              <div className="mt-1 font-display text-xl lg:text-2xl text-anthra tracking-tight">
                Techniciens, frigoristes, apprentis — venez bâtir une maison technique
                exigeante.
              </div>
            </div>
          </div>
          <Link
            href="/recrutement"
            className="group shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-navy text-creme px-6 py-3.5 text-sm font-medium hover:bg-bleu transition-colors"
          >
            Voir les postes
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
