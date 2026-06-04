import { LoginPageInner } from "./login-form";

// force-dynamic : empêche Next de pré-rendre statiquement la page au build,
// ce qui dégénérait en 404 quand le Suspense de LoginForm (qui lit
// useSearchParams) ne pouvait pas se résoudre côté serveur statique.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connexion administrateur · Pipeline leads",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginPageInner />;
}
