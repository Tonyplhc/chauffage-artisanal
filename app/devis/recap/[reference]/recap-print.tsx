"use client";

import { Printer } from "lucide-react";

export function RecapPrint() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-2.5 text-sm font-medium hover:bg-bleu transition-colors"
    >
      <Printer className="h-4 w-4" />
      Imprimer / PDF
    </button>
  );
}
