# VΛIN STUDIO — Mise en ligne de ton site

Ton site est **prêt à vendre**. Il reste à : (1) remplacer **6 valeurs** par tes vraies infos, puis (2) le **publier sur ton domaine**.
Compte ~30 minutes. Aucune compétence technique avancée requise.

---

## 📁 Tes fichiers

| Fichier | Rôle | À publier ? |
|---|---|---|
| `index.html` | **Page d'accueil** (le site principal) | ✅ oui |
| `devispilot.html` | Page produit DevisPilot | ✅ oui |
| `demonstrateur-electricien.html` | Démonstrateur métier Électricien | ✅ oui |
| `demonstrateur-industriel.html` | Démonstrateur métier Industrie | ✅ oui |
| `robots.txt` / `sitemap.xml` | SEO (Google) | ✅ oui |
| `kit-test-terrain.md` | Ton protocole de test (interne) | ❌ non |
| `SETUP-MISE-EN-LIGNE.md` | Ce guide (interne) | ❌ non |

---

## 1️⃣ Les valeurs à renseigner

Il y a **deux endroits** à éditer. Tant qu'une valeur reste vide, le canal correspondant est **automatiquement masqué ou désactivé** — il ne fait jamais semblant de marcher.

### A. Tes coordonnées → le bloc CONFIG (dans `index.html`)

Ouvre `index.html`, descends tout en bas (juste après `<script>`). Tu verras ce bloc — remplis simplement entre les guillemets :

```js
var VAIN_CONFIG = {
  formspreeId:  "",   // ex: "abcdwxyz"  (voir étape 2)
  calendly:     "",   // ex: "https://calendly.com/vain-studio/feuille-de-route" (étape 3)
  whatsapp:     "",   // ex: "352661123456"  (format international, SANS +)
  phoneDial:    "",   // ex: "+352661123456"
  phoneDisplay: ""    // ex: "+352 661 12 34 56"  (ce qui s'affiche à l'écran)
};
```

- `formspreeId` vide → **formulaire désactivé** (bouton grisé, message « en cours d'activation »).
- `calendly` vide → **bouton Réserver masqué**.
- `whatsapp` vide → **bouton WhatsApp masqué**.
- `phoneDial` vide → **téléphone affiché en placeholder propre, non cliquable**.

### B. Ton domaine & ton email → Rechercher / Remplacer

Avec un éditeur (Notepad++, VS Code, Bloc-notes), Ctrl+H dans **les 4 `.html` + `robots.txt` + `sitemap.xml`** :

| À chercher | Remplacer par |
|---|---|
| `vainstudio.lu` | ton vrai domaine (sans https://) |
| `hello@vainstudio.lu` | ton vrai email |

---

## 2️⃣ Formulaire → ta boîte mail (Formspree, gratuit)

Le formulaire envoie les demandes directement dans ta boîte mail, sans serveur.

1. Va sur **https://formspree.io** → crée un compte gratuit (avec l'email où tu veux recevoir les demandes).
2. Clique **New Form** → nomme-le « Feuille de route ».
3. Formspree te donne une URL du type `https://formspree.io/f/abcdwxyz`.
4. Copie la partie après `/f/` (ici `abcdwxyz`) et colle-la dans **`formspreeId`** du bloc CONFIG.
5. Envoie un test depuis le site : le 1er envoi te demande de confirmer ton email (une seule fois).

✅ Le plan gratuit suffit pour démarrer (50 demandes/mois). Au-delà, leur offre payante est ~10 €/mois.

---

## 3️⃣ Bouton « Réserver un créneau » (Calendly, gratuit)

1. Va sur **https://calendly.com** → compte gratuit.
2. Crée un type d'événement « **Feuille de route — 30 min** ».
3. Connecte ton Google/Outlook Agenda (pour éviter les doubles réservations).
4. Copie ton lien public (ex. `https://calendly.com/vain-studio/feuille-de-route`).
5. Colle-le dans **`calendly`** du bloc CONFIG. Le bouton « Réserver un créneau » apparaît automatiquement.

> Alternative gratuite et sans limite : **Cal.com**. Même principe.

---

## 4️⃣ WhatsApp & téléphone

Tout se passe dans le bloc CONFIG, rien à installer :

- **WhatsApp** : renseigne `whatsapp` (format international **sans +**, ex. `352661123456`). Le bouton apparaît, avec un message pré-rempli.
- **Téléphone** : renseigne `phoneDial` (ex. `+352661123456`) et `phoneDisplay` (ex. `+352 661 12 34 56`). Le numéro devient cliquable dans la nav, le formulaire et le footer.

---

## 5️⃣ Publier sur TON domaine

Tu as déjà un domaine 👍. Deux chemins selon ton hébergement :

### Option A — Hébergement moderne (recommandé) : Vercel ou Netlify (gratuit)
C'est ce que tu utilises déjà pour `chauffage-artisanal.vercel.app`.

1. Va sur **https://vercel.com** (ou Netlify) → connecte-toi.
2. **Add New → Project → déploie** ce dossier (glisser-déposer le dossier, ou via GitHub).
3. Une fois en ligne, va dans **Settings → Domains → Add** et saisis ton domaine (ex. `vainstudio.lu`).
4. Vercel t'indique 1 ou 2 enregistrements DNS à ajouter chez ton **registrar** (là où tu as acheté le domaine) :
   - soit un enregistrement **A** vers l'IP indiquée,
   - soit un **CNAME** `www` vers `cname.vercel-dns.com`.
5. Ajoute-les dans la zone DNS de ton domaine → attends la propagation (quelques minutes à 24 h).

✅ HTTPS (cadenas) automatique et gratuit.

### Option B — Hébergement classique (cPanel / FTP / OVH, etc.)
1. Connecte-toi à ton espace d'hébergement (FileZilla en FTP, ou le gestionnaire de fichiers du cPanel).
2. Dépose les fichiers à publier (tableau ci-dessus) dans le dossier racine du site (souvent `public_html` ou `www`).
3. Vérifie que `index.html` est bien à la racine → c'est la page d'accueil automatique.
4. Active le HTTPS (Let's Encrypt, souvent en 1 clic dans le cPanel).

---

## 6️⃣ Deux derniers détails (5 min, recommandés)

- **Image de partage** (`og-cover.jpg`) : quand on partage ton lien sur WhatsApp/LinkedIn, une image s'affiche. Crée une image 1200×630 px (fond noir, logo VΛIN doré) nommée **`og-cover.jpg`**, dépose-la à la racine. Tant qu'elle n'existe pas, le partage marche quand même (titre + description).
- **Google** : une fois en ligne, ajoute ton site à **Google Search Console** (gratuit) et soumets `sitemap.xml` pour être indexé plus vite.

---

## ✅ Check-list finale avant d'envoyer le lien

- [ ] Le bloc CONFIG est rempli + domaine/email remplacés
- [ ] J'ai testé le **formulaire** (j'ai reçu l'email)
- [ ] J'ai testé le bouton **Réserver** (mon agenda s'ouvre)
- [ ] J'ai testé **WhatsApp** et **l'appel** depuis mon téléphone
- [ ] Le site s'ouvre sur **mon domaine** avec le cadenas 🔒
- [ ] Les pages DevisPilot et démonstrateurs s'ouvrent bien

Quand ces 6 cases sont cochées, ton site **vend**. Tu peux lancer le test des 10 entreprises (`kit-test-terrain.md`).

---

*Besoin que je hardcode tes vraies coordonnées à ta place ? Donne-moi : domaine, email, téléphone, WhatsApp, lien Calendly — et je les intègre directement dans les fichiers.*
