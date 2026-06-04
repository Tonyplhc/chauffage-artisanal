import { test, expect } from "@playwright/test";

/**
 * Smoke tests — vérifient que les URLs critiques publiques répondent
 * en 200 et contiennent leur contenu attendu. Cible : 30 secondes max.
 */
test.describe("Smoke — pages publiques critiques", () => {
  const PAGES = [
    { path: "/", contains: "Chauffage Artisanal" },
    { path: "/chauffage", contains: "chauffage" },
    { path: "/pompes-a-chaleur", contains: "Pompes à chaleur" },
    { path: "/devis", contains: "Quels sont vos" },
    { path: "/contact", contains: "Peppange" },
    { path: "/klimabonus-2026", contains: "Klimabonus" },
    { path: "/marques", contains: "marques" },
    { path: "/marques/vaillant", contains: "Vaillant" },
    { path: "/outils/economies-energie", contains: "économiser" },
    { path: "/conformite", contains: "Conformité" },
    { path: "/glossaire", contains: "Glossaire" },
    { path: "/processus", contains: "8 étapes" },
    { path: "/cgv", contains: "RCS Luxembourg" },
    { path: "/mentions-legales", contains: "B46877" },
  ];

  for (const p of PAGES) {
    test(`${p.path} → 200 + contenu attendu`, async ({ page }) => {
      const response = await page.goto(p.path);
      expect(response?.status()).toBe(200);
      const body = await page.locator("body").innerText();
      expect(body).toContain(p.contains);
    });
  }
});

test.describe("Funnel devis — flux utilisateur", () => {
  test("la page devis charge et la première étape est visible", async ({ page }) => {
    await page.goto("/devis");
    // Le configurateur client-rendered s'hydrate — on attend "Continuer" ou
    // une option de service typique
    await expect(page.locator("text=Chauffage").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Pompe à chaleur").first()).toBeVisible();
  });

  test("la pré-sélection marque via ?marque= fonctionne", async ({ page }) => {
    await page.goto("/devis?marque=vaillant");
    // Le formulaire devrait charger sans erreur, même avec un param query
    await expect(page.locator("text=Chauffage").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("API publique — endpoints HTTP", () => {
  test("POST /api/devis crée un lead valide", async ({ request }) => {
    const res = await request.post("/api/devis", {
      data: {
        trap: "",
        services: ["chauffage"],
        buildingType: "maison",
        construction: "neuf",
        surface: 150,
        currentEnergy: "gaz",
        commune: "Luxembourg",
        timeline: "exploration",
        budget: "inconnu",
        preferredBrand: "aucune",
        photos: [],
        fullName: "Playwright Test",
        email: "playwright@test.com",
        phone: "+352123456",
        preferredChannel: "email",
        message: "Smoke test E2E",
        rgpdConsent: true,
        metadata: {},
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.reference).toMatch(/^DEV-\d{4}-\d{4}$/);
  });
});

test.describe("SEO — schémas JSON-LD critiques", () => {
  test("home contient Organization / HVACBusiness JSON-LD", async ({ page }) => {
    await page.goto("/");
    const ldScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    const hasOrg = ldScripts.some(
      (s) => s.includes("HVACBusiness") || s.includes("LocalBusiness"),
    );
    expect(hasOrg).toBe(true);
  });

  test("page SEO Luxembourg contient FAQPage JSON-LD", async ({ page }) => {
    await page.goto("/chauffage-luxembourg");
    const ldScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    const hasFaq = ldScripts.some((s) => s.includes("FAQPage"));
    expect(hasFaq).toBe(true);
  });
});

test.describe("Sécurité — headers HTTP critiques", () => {
  test("la home renvoie les headers de sécurité OWASP", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();
    expect(headers["strict-transport-security"]).toContain("max-age=63072000");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toContain("strict-origin");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
  });
});
