# Feuille de route — Syndicate of Odds

Dernière mise à jour : 19/11/2026. Projet en pause après l'étape 2.

> **Projet clos pour l'instant** : dépôt GitHub passé en **privé**, site GitHub Pages **désactivé**, déploiement automatique **désactivé**.
> Vérifié avant fermeture : aucune information personnelle dans les fichiers ni dans l'historique (commits signés avec l'adresse noreply GitHub, PDF Gemini jamais publié).
> La procédure de réouverture est dans [CLAUDE.md](../CLAUDE.md).

## Où on en est

| Étape | État |
|---|---|
| 0. Outils (Git, GitHub CLI, Node 26) | ✅ Fait |
| Conception : 29 décisions prises en séance de questions | ✅ Fait, voir [spec-v1.md](spec-v1.md) |
| 1. Projet, dépôt public, mise en ligne automatique | ✅ Fait, puis fermé : dépôt privé, site désactivé |
| 2. Moteur + simulateur d'équilibrage (41 tests) | ✅ Fait |
| 3. Noms générés + Traits + Bureau de recrutement (73 tests au total) | ✅ Fait |
| 4. Interface jouable (QG, Casinos, Équipe) — 94 tests | ✅ Fait, jouable en local (`npm run dev`) |
| 5. Sauvegarde locale, hors-ligne au retour, export/import | ⏭️ **Prochaine étape** |
| 6. Succès, Boutique VIP, Blanchiment et Réseau | À faire |
| 7. Pixel art des Tables et finitions | À faire |
| Phase 2 : Firebase (comptes + sauvegarde cloud) | Plus tard |

## Ce qui existe dans le code

- `src/data/balance.ts` : toutes les constantes d'équilibrage (réglées avec le simulateur).
- `src/data/classes.ts` : les 6 Classes et leurs passifs.
- `src/data/items.ts` : les 18 Gadgets (12 du document + 6 Gadgets de Classe).
- `src/data/traits.ts` : 30 Traits ordinaires + 12 Traits uniques de Légendaires.
- `src/data/names/` : dictionnaires (prénoms et noms par origine, surnoms par Classe, Clins d'œil, événements datés, 12 Légendaires dont Marco « La Moula » Moula, vocabulaire des Casinos et Titres des Boss).
- `src/engine/` : moteur pur, sans React :
  - `floors.ts` — `getFloor(n)` : Caisse, Pression, Boss, Jetons VIP d'un Étage ;
  - `economy.ts` — `getPlayerStats`, `buildTeamProfile`, `levelUpCost`, `recruitCost` ;
  - `combat.ts` — `startTeamRun`, `tickTeam` (mode aléatoire ou « expected ») ;
  - `offline.ts` — `computeOfflineGains` ;
  - `simulator.ts` — `simulatePlaythrough` (test de rythme : Étage 50 en 20 à 48 h) ;
  - `names.ts` — `getCasino(n)`, `getBoss(étage)`, `generateIdentity` ;
  - `recruitment.ts` — `generateCandidate`, Bureau (`openOffice`, `refreshIfDue`, `paidRefresh`, `hireCandidate`, `dismissPlayer`) ;
  - `charter.test.ts` — vérifie les dictionnaires contre la charte ;
  - `format.ts` — `formatNumber` (K, M, B, T, aa… ou notation scientifique) ;
  - `game.ts` — `GameState`, `newGame`, `applyAction` (embauche, niveaux +1/+10/Max, affectation, options, renvoi), `advanceGame` (ticks, au plus 1 h rattrapée).
- `src/App.tsx` : boucle de jeu (100 ms) et mise en page : 3 colonnes sur PC, 3 onglets sur mobile.
- `src/components/` : `TopBar`, `HQPanel` (Bureau de recrutement ; Boutique et Succès en attente), `CasinoLane` (jauges, Boss, Auto, repli, gains flottants), `RosterSidebar` (liste + fiche du Joueur).
- `src/ui/labels.ts` : textes affichés (Raretés, Classes au féminin, messages d'erreur).
- `.claude/launch.json` : lance le jeu dans le navigateur intégré (`jeu`, port 5173).
- Pas encore de sauvegarde : rafraîchir la page recommence la partie.

## Prochaine étape en détail (étape 5 : sauvegarde)

1. `src/storage/SaveProvider.ts` (interface `load`, `save`, `exportData`, `importData`) et `LocalProvider.ts` (localStorage).
2. Format de sauvegarde : `saveVersion: 1`, `lastSavedAt`, grands nombres en texte ; `migrations.ts` prêt pour les versions suivantes ; champ `prestigeLevel` prévu.
3. Sauvegarde automatique toutes les 10 s et à la fermeture de l'onglet.
4. Au retour : gains hors-ligne (`computeOfflineGains`, plafond 12 h) et fenêtre « Pendant ton absence (2 h 15), tes Équipes ont raflé +38,4K $ ».
5. Fenêtre Sauvegarde / Transfert : copier une chaîne Base64, télécharger / importer `syndicate-save.json`, recommencer la partie avec confirmation.
6. Points de test à proposer au créateur (par exemple : aller-retour sauvegarde → chargement identique, sauvegarde abîmée refusée sans perdre la partie, migration d'une ancienne version, gains au retour).

## Points ouverts à trancher plus tard

- Formule exacte de l'Influence au Blanchiment et prix des niveaux du Réseau.
- Liste précise des Succès et de leurs bonus.
- Le simulateur n'achète pas de Gadgets : à ajouter quand la Boutique existera, puis revérifier le rythme.
- Le premier niveau coûte 1 500 $ (pour que l'Étage 50 arrive en 1 jour) : à rejuger une fois le jeu jouable.
