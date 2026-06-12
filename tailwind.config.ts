import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // ── Tokens legacy REPOINTÉS vers la charte (noms conservés pour ne
        //    rien casser ; les valeurs sont désormais celles du logo
        //    historique). Tout `bg-cream`/`text-copper` résiduel (admin…)
        //    rend automatiquement les bons tons. ──
        cream: "#F7F2E9", // = creme
        linen: "#F7F2E9", // = creme
        stone: "#E0D5C2", // = pierre
        sand: "#EFE7D8", // = sable
        ink: "#2A2724", // = anthra
        graphite: "#6E675C", // = taupe
        muted: "#8B847A",

        charcoal: "#0A3D6E", // = navy
        coal: "#0A3D6E",

        copper: {
          DEFAULT: "#0B57A0", // = bleu
          50: "#E8F0F8", // = voile
          100: "#D4E3F2",
          200: "#EFE7D8", // accent clair sur fonds sombres = sable
          300: "#2C7BD0", // = bleuvif
          400: "#0B57A0",
          500: "#0A3D6E", // = navy
          600: "#0A3D6E",
        },
        ember: "#C24A2C", // = terracotta
        ice: "#2C7BD0", // = bleuvif

        // Aliases kept for transition
        noir: "#0A3D6E",
        anthracite: "#EDE5D3",
        steel: "#E0D5C2",
        bone: "#2A2724",

        // ════════════════════════════════════════════════════════════════
        // Design System v2 — identité « logo historique » Chauffage Artisanal
        // Bleu cobalt + rouge brique (du logo réel). Base chaude crème/sable.
        // Brique = ACCENT · Terracotta = URGENCE. Voir lib/brand.ts.
        // (copper/ember/charcoal ci-dessus = legacy, retirés après migration.)
        // ════════════════════════════════════════════════════════════════
        creme: "#F7F2E9", // fond principal (base dominante)
        sable: "#EFE7D8", // surfaces / cards
        pierre: "#E0D5C2", // bordures / séparateurs
        brun: "#5A4636", // tertiaire chaud
        anthra: "#2A2724", // texte principal (anthracite)
        taupe: "#6E675C", // texte secondaire (gris pierre)
        bleu: "#0B57A0", // PRIMAIRE — structure & confiance
        navy: "#0A3D6E", // bleu profond — sections fortes / B2B / footer
        bleuvif: "#2C7BD0", // liens / hover / accent sur navy
        voile: "#E8F0F8", // fonds bleutés doux
        brique: "#A2131A", // ACCENT signature (parcimonie)
        terracotta: "#C24A2C", // URGENCE / dépannage uniquement

        // ── DONNÉES FINANCIÈRES uniquement (simulateur / pré-devis) ──
        // Vert = gain / bénéfice · Rouge = coût / perte. JAMAIS dans le
        // design de marque (titres, nav, CTA, sections génériques).
        gain: "#2E7D5A",
        gainBg: "#E7F2EC",
        perte: "#C0392B",
        perteBg: "#FBEBE8",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // Interface & corps du design system v2 (police historique Montserrat).
        ui: ["var(--font-ui)", "Montserrat", "ui-sans-serif", "system-ui"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        eyebrow: "0.28em",
      },
      fontSize: {
        "display-2xl": ["clamp(3.5rem, 9vw, 8rem)", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
        "display-xl": ["clamp(2.75rem, 6vw, 5.5rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.25rem, 4.5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      backgroundImage: {
        // Halos repeints aux couleurs charte (bleu) — noms conservés pour
        // ne pas toucher les ~30 usages.
        "copper-glow":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(11,87,160,0.08), transparent 70%)",
        "copper-glow-dark":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(44,123,208,0.22), transparent 70%)",
        "ember-glow":
          "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(194,74,44,0.16), transparent 70%)",
        "grid":
          "linear-gradient(to right, rgba(42,37,30,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,37,30,0.04) 1px, transparent 1px)",
        "grid-dark":
          "linear-gradient(to right, rgba(246,240,228,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(246,240,228,0.05) 1px, transparent 1px)",
        "paper":
          "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(246,240,228,1), rgba(237,229,211,1) 70%)",
      },
      animation: {
        shimmer: "shimmer 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42,37,30,0.04), 0 4px 12px rgba(42,37,30,0.05)",
        card: "0 1px 2px rgba(42,37,30,0.05), 0 8px 28px -8px rgba(42,37,30,0.08)",
        lift: "0 2px 6px rgba(42,37,30,0.06), 0 24px 48px -16px rgba(42,37,30,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
