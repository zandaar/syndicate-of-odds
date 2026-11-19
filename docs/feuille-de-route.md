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
| 3. Noms générés + Traits + Bureau de recrutement | ⏭️ **Prochaine étape** |
| 4. Interface jouable (QG, Casinos, Équipe) | À faire |
| 5. Sauvegarde locale, hors-ligne au retour, export/import | À faire |
| 6. Succès, Boutique VIP, Blanchiment et Réseau | À faire |
| 7. Pixel art des Tables et finitions | À faire |
| Phase 2 : Firebase (comptes + sauvegarde cloud) | Plus tard |

## Ce qui existe dans le code

- `src/data/balance.ts` : toutes les constantes d'équilibrage (réglées avec le simulateur).
- `src/data/classes.ts` : les 6 Classes et leurs passifs.
- `src/data/items.ts` : les 18 Gadgets (12 du document + 6 Gadgets de Classe).
- `src/data/traits.ts` : **seulement 4 Traits** pour l'instant (il en faut une trentaine).
- `src/engine/` : moteur pur, sans React :
  - `floors.ts` — `getFloor(n)` : Caisse, Pression, Boss, Jetons VIP d'un Étage ;
  - `economy.ts` — `getPlayerStats`, `buildTeamProfile`, `levelUpCost`, `recruitCost` ;
  - `combat.ts` — `startTeamRun`, `tickTeam` (mode aléatoire ou « expected ») ;
  - `offline.ts` — `computeOfflineGains` ;
  - `simulator.ts` — `simulatePlaythrough` (test de rythme : Étage 50 en 20 à 48 h).
- `src/App.tsx` : page provisoire « En construction ».

## Prochaine étape en détail (étape 3)

1. Dictionnaires dans `src/data/names/` selon [la charte](charte-des-noms.md) : prénoms (par origine et genre), noms (par origine), surnoms (par Classe et Rareté, masculin et féminin), Légendaires écrits à la main (dont **Marco « La Moula » Moula**), Titres de Boss, Types / Emblèmes / Couleurs / Lieux de Casinos, Clins d'œil et dictionnaires d'événements.
2. Générateurs déterministes : `getCasino(numéro)` (Casinos 1 à 3 écrits à la main : Le Tripot des Docks, Le Mirage Doré, Le Palace Impérial) et `getBoss(étage)`.
3. Test de la charte : pas de doublons, accords présents, longueurs maximales (28 / 32 / 24 caractères).
4. Une trentaine de Traits, dont des Traits uniques de Légendaires.
5. Bureau de recrutement : 3 Candidats, Rareté (70/24/5/1 %), Qualité ±15 %, renouvellement 20 min ou contre du Cash, roster de 12, renvoi à 50 %.
6. Montrer une vingtaine de noms générés au créateur **avant** de passer à l'interface.

Méthode : skill `tdd`. Points de test à proposer au créateur avant d'écrire les tests (par exemple : « un Candidat généré », « le nom d'un Casino », « la charte des dictionnaires »).

## Points ouverts à trancher plus tard

- Formule exacte de l'Influence au Blanchiment et prix des niveaux du Réseau.
- Liste précise des Succès et de leurs bonus.
- Le simulateur n'achète pas de Gadgets : à ajouter quand la Boutique existera, puis revérifier le rythme.
- Le premier niveau coûte 1 500 $ (pour que l'Étage 50 arrive en 1 jour) : à rejuger une fois le jeu jouable.
