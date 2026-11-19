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
- Il veut économiser les tokens : réponses concises. **Réponds en français.**

## Règles de code

- Moteur (`src/engine/`) sans React ni DOM ; données (`src/data/`) commentées en français en haut de fichier, avec comment ajouter un élément.
- Toute valeur d'argent ou de puissance en `Decimal` (ADR 0001). Casinos et Boss déduits du numéro d'Étage (ADR 0002).
- Identifiants de code en anglais, textes affichés en français.
- TDD (skill `tdd`) : convenir des points de test avec le créateur avant d'écrire les tests.
- Chaque nouvelle donnée de sauvegarde : incrémenter `CURRENT_SAVE_VERSION` (`src/storage/saveFormat.ts`, aujourd'hui 2) et ajouter une étape dans `src/storage/migrations.ts`, avec un test.
- Toute la logique de jeu passe par `src/engine/game.ts` (`applyAction`, `advanceGame`) ; l'interface ne fait qu'afficher et envoyer des actions.
- Ne jamais conclure une étape sans `npm test` et `npm run build` au vert, puis une vérification dans le navigateur intégré (configuration `jeu` de `.claude/launch.json`).
- Changement d'équilibrage : `src/data/balance.ts` (et `buildings.ts`, `items.ts`), puis `npm test`. Pour régler, écrire un test temporaire `src/engine/zz-tuning.test.ts` qui fait varier les constantes et lance `simulatePlaythrough` (option `shopping`, `runs`), puis le supprimer.
- Textes affichés : vocabulaire de l'univers uniquement (Réputation, Rafle, Soupçons… voir la charte) ; `charter.test.ts` bloque les mots de jeu de rôle.
- Tests dans le navigateur : la sauvegarde automatique à la fermeture écrase toute modification manuelle de `localStorage` ; pour tester un état précis, importer un code via la fenêtre « Sauvegarde ». **Exporter d'abord la sauvegarde du créateur** avant de la modifier.

## Commandes

```powershell
npm run dev      # jouer en local
npm test         # tests (moteur + simulateur)
npm run build    # vérification des types + version en ligne
```

## Git et GitHub

- **Site en ligne (rouvert le 19/11/2026 avec l'accord du créateur)** : dépôt **public** `zandaar/syndicate-of-odds`, jeu sur https://zandaar.github.io/syndicate-of-odds/. Tout ce qui est poussé sur `main` devient public et en ligne : vérifier l'absence d'informations personnelles avant chaque push.
- Chaque push sur `main` teste, compile et publie (`.github/workflows/deploy.yml`) ; suivre le déploiement avec `gh run watch`.
- Pour refermer (seulement s'il le demande) : `gh api -X DELETE repos/zandaar/syndicate-of-odds/pages`, `gh workflow disable deploy.yml -R zandaar/syndicate-of-odds`, puis `gh repo edit zandaar/syndicate-of-odds --visibility private --accept-visibility-change-consequences`.
- L'e-mail de commit du dépôt est l'adresse noreply GitHub (déjà configurée dans `.git/config`) : ne jamais publier l'e-mail personnel.
- `git push` est autorisé par `.claude/settings.local.json` (fichier personnel, non publié) **seulement s'il est lancé seul** : faire le commit dans une commande, puis `git push` dans une autre.
- `gh` n'est pas dans le PATH du shell de Claude : utiliser `& "C:\Program Files\GitHub CLI\gh.exe"`.
- Messages de commit en français ; écrire le message dans un fichier temporaire et utiliser `git commit -F` (PowerShell 5.1 casse les here-strings passées à git).
- Pas de Python sur la machine : scripts en Node ou PowerShell.

## Skills du projet

`.claude/skills/` contient des skills de Matt Pocock (MIT, voir `SOURCE-mattpocock.md`) : `tdd`, `grilling`, `grill-with-docs`, `domain-modeling`, `diagnosing-bugs`, `codebase-design`, `teach`.
