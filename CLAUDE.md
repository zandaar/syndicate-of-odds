# Syndicate of Odds — consignes pour Claude

Idle-RPG navigateur (React + Vite + TypeScript strict + Tailwind, `break_eternity.js`), publié sur GitHub Pages.

## Avant de commencer une session

1. Lis [docs/feuille-de-route.md](docs/feuille-de-route.md) : où on en est et la prochaine étape.
2. Lis [docs/spec-v1.md](docs/spec-v1.md) : décisions de conception. **Il prime sur le PDF Gemini** (gardé en local, non publié).
3. Utilise le vocabulaire de [GLOSSARY.md](GLOSSARY.md) (Étage, Casino, Table, Caisse, Couverture, Équipe, Classe, Blanchiment…), dans le code comme dans les échanges.
4. Tout nom du jeu suit [docs/charte-des-noms.md](docs/charte-des-noms.md).
5. Décisions difficiles à défaire : [docs/adr/](docs/adr/).

## Le créateur

- Débutant complet en code, parle français. Explique simplement, une étape à la fois, avec les commandes exactes à copier.
- Préfère que Claude fasse les choses lui-même quand c'est possible.
- Pour une décision de conception : questions numérotées avec une recommandation chacune (skill `grilling`), il répond « oui » ou corrige un numéro.
- Il veut économiser les tokens : réponses concises.

## Règles de code

- Moteur (`src/engine/`) sans React ni DOM ; données (`src/data/`) commentées en français en haut de fichier, avec comment ajouter un élément.
- Toute valeur d'argent ou de puissance en `Decimal` (ADR 0001). Casinos et Boss déduits du numéro d'Étage (ADR 0002).
- Identifiants de code en anglais, textes affichés en français.
- TDD (skill `tdd`) : convenir des points de test avec le créateur avant d'écrire les tests.
- Chaque nouvelle donnée de sauvegarde : incrémenter `saveVersion` et ajouter une migration (quand `src/storage/` existera).
- Ne jamais conclure une étape sans `npm test` et `npm run build` au vert.
- Changement d'équilibrage : `src/data/balance.ts`, puis `npm test` (le simulateur vérifie le rythme).

## Commandes

```powershell
npm run dev      # jouer en local
npm test         # tests (moteur + simulateur)
npm run build    # vérification des types + version en ligne
```

## Git et GitHub

- ⚠️ **Projet clos pour l'instant (19/11/2026), à la demande du créateur** : le dépôt `zandaar/syndicate-of-odds` est **privé**, GitHub Pages est **désactivé** (le site renvoie 404) et le workflow de déploiement est **désactivé**. Ne rien republier sans son accord explicite.
- Pour rouvrir (seulement s'il le demande) : `gh repo edit zandaar/syndicate-of-odds --visibility public --accept-visibility-change-consequences`, puis `gh api -X POST repos/zandaar/syndicate-of-odds/pages -f build_type=workflow`, puis `gh workflow enable deploy.yml -R zandaar/syndicate-of-odds` et un push sur `main`. Sur un compte gratuit, GitHub Pages exige un dépôt public.
- Branche `main`. Quand le workflow est actif, chaque push sur `main` teste, compile et publie (`.github/workflows/deploy.yml`).
- L'e-mail de commit du dépôt est l'adresse noreply GitHub (déjà configurée dans `.git/config`) : ne jamais publier l'e-mail personnel.
- `gh` n'est pas dans le PATH du shell de Claude : utiliser `& "C:\Program Files\GitHub CLI\gh.exe"`.
- Messages de commit en français ; écrire le message dans un fichier temporaire et utiliser `git commit -F` (PowerShell 5.1 casse les here-strings passées à git).
- Pas de Python sur la machine : scripts en Node ou PowerShell.

## Skills du projet

`.claude/skills/` contient des skills de Matt Pocock (MIT, voir `SOURCE-mattpocock.md`) : `tdd`, `grilling`, `grill-with-docs`, `domain-modeling`, `diagnosing-bugs`, `codebase-design`, `teach`.
