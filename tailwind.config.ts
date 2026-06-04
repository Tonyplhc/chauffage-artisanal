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
        // Light architectural palette (primary)
        cream: "#F6F0E4",
        linen: "#EDE5D3",
        stone: "#DDD3BE",
        sand: "#E8DFC9",
        ink: "#2A251E",
        graphite: "#4A4338",
        muted: "#8B847A",

        // Premium dark (used sparingly — hero, CTA, footer accents)
        charcoal: "#1E1A15",
        coal: "#28231D",

        // Accents
        copper: {
          DEFAULT: "#B86A36",
          50: "#FAF1E5",
          100: "#F1DCBE",
          200: "#E1B780",
          300: "#CF8F4F",
          400: "#B86A36",
          500: "#94532A",
          600: "#723F1F",
        },
        ember: "#DC5A28",
        ice: "#6BA3C5",

        // Aliases kept for transition
        noir: "#1E1A15",
        anthracite: "#EDE5D3",
        steel: "#DDD3BE",
        bone: "#2A251E",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
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
        "copper-glow":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(184,106,54,0.10), transparent 70%)",
        "copper-glow-dark":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(184,106,54,0.22), transparent 70%)",
        "ember-glow":
          "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(220,90,40,0.18), transparent 70%)",
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
