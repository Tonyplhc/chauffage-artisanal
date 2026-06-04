# Cartographie des placeholders · swap post-validation

> **Objet** : pour chaque donnée à compléter une fois le client a rempli `CLIENT-VALIDATION-KIT.md`.
> **Usage** : pas de chercher-remplacer global aveugle. Suivre la table.

## A. Coordonnées identité — affichage public

| Donnée KIT | Fichier | Ligne approx. | Texte placeholder actuel |
|---|---|---|---|
| Téléphone | `components/footer.tsx` | 70 | « Numéro à confirmer » |
| Email | `components/footer.tsx` | 75 | « Email à confirmer » |
| Adresse | `components/footer.tsx` | 66 | « Adresse à confirmer » |
| Horaires | `components/footer.tsx` | 80 | « Horaires à confirmer » |
| Mentions copyright | `components/footer.tsx` | 88 | « Données entreprise à confirmer » |
| Téléphone (page contact) | `app/contact/page.tsx` | 117 | « Numéro à confirmer » |
| Email (page contact) | `app/contact/page.tsx` | 118 | « Email à confirmer » |
| Adresse (page contact) | `app/contact/page.tsx` | 119, 151 | « Adresse à confirmer » |
| Horaires (page contact) | `app/contact/page.tsx` | 120 | « Horaires à confirmer » |
| Téléphone dépannage CTA | `app/contact/page.tsx` | 136 | « Téléphone à confirmer » |
| Contact recrutement | `app/recrutement/page.tsx` | 194 | « Contact recrutement à confirmer » |

## B. Mentions légales

| Donnée KIT | Fichier | Ligne approx. | Texte placeholder actuel |
|---|---|---|---|
| Raison sociale | `app/mentions-legales/page.tsx` | 20 | « raison sociale à confirmer » |
| Adresse siège | `app/mentions-legales/page.tsx` | 23 | « adresse à confirmer · Luxembourg » |
| RCS Luxembourg | `app/mentions-legales/page.tsx` | 24 | « à confirmer » |
| TVA intracommunautaire | `app/mentions-legales/page.tsx` | 25 | « à confirmer » |
| Téléphone | `app/mentions-legales/page.tsx` | 26 | « à confirmer » |
| Email | `app/mentions-legales/page.tsx` | 27 | « à confirmer » |
| Directeur publication | `app/mentions-legales/page.tsx` | 28 | « à confirmer » |
| Fournisseur analytics | `app/cookies/page.tsx` | 40 | « à confirmer (Plausible, Matomo ou GA4) » |

## C. Numérotation référence dossier

Le préfixe `DEV-YYYY-XXXX` est généré dans `lib/devis-schema.ts:makeReference()`.
Aucune action requise — le système fonctionne tel quel.

## D. Contenu commercial à enrichir

Une fois le client a fourni les éléments via le KIT :

### Réalisations réelles
- Fichier : `app/realisations/page.tsx` (constante `PROJECTS`)
- Action : remplacer les 10 cas types par les vrais projets (objet à objet)
- Critère : ne publier QUE les projets avec accord client écrit
- Garder le disclaimer ember en haut tant qu'il reste des cas types

### Réalisations Home (4 cards)
- Fichier : `components/home/realisations.tsx` (constante `PROJECTS`)
- Action : 4 cas vedettes parmi les vrais projets

### Témoignages Home (3 cards)
- Fichier : `components/home/testimonials.tsx` (constante `TESTIMONIALS`)
- Action : remplacer les "Profil — …" par les vrais témoignages
- Critère : autorisation écrite obligatoire
- Retirer le disclaimer "Formulations illustratives" une fois 3 vrais

### Équipe À propos
- Fichier : `app/a-propos/page.tsx` (constante `TEAM`)
- Action : photos + noms + rôles réels avec accord chacun
- Sinon : retirer la section entière

### Postes recrutement
- Fichier : `app/recrutement/page.tsx` (constante `JOBS`)
- Action : ne garder que les postes réellement ouverts
- Préciser conditions confirmées en section H du KIT

### Photos services (cartes Home + heroes pages)
Si des photos client réelles deviennent disponibles, swap dans :
- `components/home/services.tsx` (cartes services)
- `app/chauffage/page.tsx` (heroImg)
- `app/pompes-a-chaleur/page.tsx`
- `app/climatisation/page.tsx`
- `app/sanitaire/page.tsx`
- `app/entretien/page.tsx`
- `app/energies-renouvelables/page.tsx`

### Marques & certifications
- Fichier : `app/savoir-faire/page.tsx` (constante `BRANDS`)
- Action : retirer les marques où aucun partenariat ni installation régulière
- Si certifications réelles existent : ajouter section certifications avec icônes/preuves

### Note Google
- Une fois confirmée par capture d'écran : ré-introduire la note dans `components/home/hero.tsx` (badge `Avis clients`) et `components/home/testimonials.tsx` (titre section)
- Sinon : garder formulation actuelle « Recommandés / Bouche-à-oreille local »

## E. Environnement de production

Aucun placeholder dans le code — uniquement dans `.env.local` à créer :

```bash
PUBLIC_URL=https://www.chauffage-artisanal.lu
ADMIN_PASSWORD=<définir>
SESSION_SECRET=<openssl rand -base64 32>
RESEND_API_KEY=<récupérer Resend>
EMAIL_FROM=devis@chauffage-artisanal.lu
EMAIL_ADMIN=contact@chauffage-artisanal.lu
SUPABASE_URL=<récupérer Supabase>
SUPABASE_SERVICE_ROLE_KEY=<récupérer Supabase>
SENTRY_DSN=<récupérer Sentry · facultatif>
```

## F. Audit post-swap

Une fois tous les swaps faits :

1. Grep final pour s'assurer qu'aucun « à confirmer » ne reste :
   ```
   grep -r "à confirmer" app/ components/
   ```
   Doit retourner **uniquement** :
   - `components/legal-page.tsx` (mention de version document — peut être retirée)
   - `app/confidentialite/page.tsx` (référence aux mentions légales — peut être retirée si validé)
   - `app/cookies/page.tsx` (fournisseur analytics — selon choix)

2. Lecture mot-à-mot du site avec le KIT à côté.

3. Run Lighthouse mobile sur la prod réelle.

4. Test envoi `/devis` réel → vérifier réception email admin + client.

5. **Mise en ligne**.

---

## Estimation effort post-validation

| Tâche | Durée |
|---|---|
| Swap coordonnées (footer, contact, mentions, recrutement) | 30 min |
| Swap mentions légales complètes | 45 min |
| Intégration témoignages réels (3) | 30 min |
| Intégration projets réels (6-10) avec photos | 2-3 h |
| Photos équipe À propos | 1 h |
| Photos services réelles si disponibles | 1 h |
| Audit grep final + relecture | 2 h |
| Config prod (Resend + Supabase + Vercel) | 2 h |
| QA end-to-end | 1 h |
| **Total** | **≈ 1 jour homme** |
