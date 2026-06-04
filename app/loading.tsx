/**
 * Loading global — affiché par Next.js pendant les transitions de page.
 *
 * Volontairement minimaliste : juste une bande copper qui pulse en haut,
 * pour signaler une activité sans casser le rendu visuel de la page précédente.
 */
export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
      <div className="h-0.5 w-full bg-ink/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-copper via-ember to-copper"
          style={{
            width: "40%",
            animation: "loading-slide 1.2s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
