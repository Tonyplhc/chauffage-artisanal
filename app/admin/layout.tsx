import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { ForegroundNotifier } from "@/components/admin/foreground-notifier";
import { TourOverlay } from "@/components/admin/tour-overlay";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AIAssistant } from "@/components/admin/ai-assistant";

/**
 * Sous-shell typographique de l'admin.
 * Inter pour le sans, IBM Plex Mono pour les éléments mono.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-admin-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-admin-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Admin · Pipeline leads",
  robots: { index: false, follow: false },
};

// Feature flag global IA. Si NEXT_PUBLIC_ENABLE_AI != "1" :
//   - L'assistant IA flottant n'est pas monté
//   - Les boutons ✨ "Résumer avec l'IA" / "Rédiger avec l'IA" se cachent
//     (cf. ai-summary-card.tsx et ai-draft-button.tsx)
// Pour activer : ajouter à .env.local
//   NEXT_PUBLIC_ENABLE_AI=1
//   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
const AI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI === "1";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${plexMono.variable} admin-shell`}>
      <div className="lg:flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      <ForegroundNotifier />
      <TourOverlay />
      {AI_ENABLED && <AIAssistant />}
    </div>
  );
}
