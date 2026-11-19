# Feuille de route — Syndicate of Odds

Dernière mise à jour : 19/11/2026, fin de l'étape 8. **La V1 est complète et jouable en local.**

> **Le jeu est en ligne : https://zandaar.github.io/syndicate-of-odds/** (dépôt public, rouvert le 19/11/2026 avec l'accord du créateur).

## Où on en est

| Étape | État |
|---|---|
| 0. Outils (Git, GitHub CLI, Node 26) | ✅ |
| Conception : décisions Q1 à Q30, voir [spec-v1.md](spec-v1.md) | ✅ |
| 1. Projet, dépôt, déploiement automatique | ✅ (fermé un temps, rouvert à la fin de la V1) |
| 2. Moteur + simulateur d'équilibrage | ✅ |
| 3. Noms générés, Traits, Bureau de recrutement | ✅ |
| 4. Interface jouable (3 colonnes PC, 3 onglets mobile) | ✅ |
| 5. Réputation, 126 Talents, Maîtrise de Classe, Gadgets en Cash, Bâtiments, rythme | ✅ |
| 6. Sauvegarde locale, absence, export/import | ✅ |
| 7. Blanchiment, Réseau, Succès (sauvegarde v2) | ✅ |
| 8. Pixel art des Tables, icône, bulles d'aide, vérification mobile | ✅ (169 tests) |
| Rouvrir le site public (Q30) | ✅ En ligne |
| Phase 2 : Firebase (comptes + sauvegarde cloud) | Plus tard |

## Carte du code

- `src/data/` — données commentées en français :
  `balance.ts` (toutes les constantes), `classes.ts` (6 Classes), `talents.ts` (6 arbres × 3 branches × 7 Talents),
  `items.ts` (18 Gadgets), `traits.ts` (30 + 12 uniques), `buildings.ts` (4 Bâtiments), `network.ts` (5 bonus de Réseau),
  `achievements.ts` (7 familles de Succès), `names/` (dictionnaires de noms, Casinos, Boss, Légendaires, événements).
- `src/engine/` — moteur pur (sans React) :
  `floors.ts` (`getFloor`), `economy.ts` (stats, profil d'Équipe, Réputation, Maîtrise, prix des Gadgets),
  `combat.ts` (`tickTeam`, modes aléatoire / « expected »), `talents.ts`, `buildings.ts`, `network.ts`, `achievements.ts`,
  `names.ts`, `recruitment.ts`, `offline.ts`, `format.ts`, `simulator.ts` (joue de vraies parties, `runs` pour plusieurs Blanchiments),
  **`game.ts`** (`GameState`, `newGame`, `applyAction`, `advanceGame`, `applyOffline`, `bonusesOf`, `distributeReputation`).
- `src/storage/` — `saveFormat.ts` (JSON, grands nombres `{"$d": …}`, Base64, **`CURRENT_SAVE_VERSION = 2`**), `migrations.ts` (0 → 1 → 2),
  `SaveProvider.ts` (interface), `LocalProvider.ts` (localStorage), `saves.ts` (`loadGame`, `importSave`, `exportCode`).
- `src/render/` — `sprites.ts` (palette + sprites en caractères), `scene.ts` (`composeScene`, fonction pure testée), `draw.ts` (dessin canvas 160 × 64).
- `src/components/` — `TopBar`, `HQPanel` (Bureau + `QGPanels` : Bâtiments, Boutique, Maîtrise + `PrestigePanels` : Blanchiment, Réseau, Succès),
  `CasinoLane` (+ `TableCanvas`), `RosterSidebar` (+ `TalentTree`, équipement), `SaveWindows`, `FirstSteps`, `common`.
- `src/App.tsx` — boucle de jeu (100 ms), sauvegarde auto (10 s + fermeture), chargement avec gains d'absence, notifications.
- Tests : `src/**/*.test.ts` (169). Le simulateur vérifie le rythme ; `charter.test.ts` vérifie noms et vocabulaire.

## Rythme mesuré (simulateur, 4 sessions de 30 min par jour)

1re partie : Étage 20 en 27 min, 30 en 4 h, 50 en 24 h, 60 en 48 h. Après Blanchiment à l'Étage 50 : 2e partie Étage 50 en 8 h, 3e en 16 h.

## Prochaines étapes possibles

1. Faire jouer le créateur et recueillir ses retours (rythme, retour d'absence, lisibilité du pixel art).
2. **Phase 2 — Firebase** : `CloudProvider` qui respecte `SaveProvider` ; connexion e-mail ou Google ; document `users/{uid}` ;
   écriture toutes les **60 s seulement si la partie a changé** + à la fermeture (la sauvegarde locale reste à 10 s) ;
   règles Firestore `allow read, write: if request.auth != null && request.auth.uid == userId;` ; clés dans un fichier de config séparé.
3. Contenu et finitions : plus de décors, sons, contrats à modificateurs, 3e Équipe, Gadgets aléatoires (vision finale du PDF).

## Points ouverts

- Le retour d'absence est le gros moteur de progression (sauts à 4 h, 8 h…) : à juger en jouant ; piste : réduire l'efficacité hors-ligne.
- La 3e partie du simulateur est plus lente que la 2e (il Blanchit dès l'Étage 50, donc peu d'Influence) : à surveiller.
- Les sprites sont simples (8 × 10, dessinés en ×2) : à enrichir si le créateur le souhaite.
