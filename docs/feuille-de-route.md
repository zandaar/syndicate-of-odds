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
| 4. Interface jouable (QG, Casinos, Équipe) | ⏭️ **Prochaine étape** |
| 5. Sauvegarde locale, hors-ligne au retour, export/import | À faire |
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
  - `charter.test.ts` — vérifie les dictionnaires contre la charte.
- `src/App.tsx` : page provisoire « En construction ».

## Prochaine étape en détail (étape 4 : interface jouable)

1. Un état de partie unique (`GameState` : Cash, Jetons VIP, roster, 2 Équipes, Bureau, Étage le plus haut) et une boucle de jeu (tick de 0,5 s) dans `App.tsx`, sans logique métier dans les composants.
2. Disposition « Split-Screen » sur PC (QG à gauche, Casinos au centre, roster à droite) et 3 onglets sur mobile.
3. QG : Bureau de recrutement (Candidats, embauche, renouvellement) ; montée de niveau des Joueurs.
4. Casinos : une ligne par Équipe avec nom du Casino, Étage, Boss, jauges Caisse et Couverture, gains flottants, options Auto et repli sécurisé.
5. Roster : liste des Joueurs, fiche détaillée (stats, Traits, Qualité), affectation aux Équipes (un Joueur dans une seule Équipe).
6. Affichage des grands nombres (K, M, B, T, aa, ab…), à tester.
7. Rouvrir le site public seulement si le créateur le demande (voir CLAUDE.md).

Méthode : skill `tdd` pour la logique (état de partie, format des nombres), points de test à proposer au créateur avant de les écrire. Vérifier l'interface dans le navigateur intégré.

## Points ouverts à trancher plus tard

- Formule exacte de l'Influence au Blanchiment et prix des niveaux du Réseau.
- Liste précise des Succès et de leurs bonus.
- Le simulateur n'achète pas de Gadgets : à ajouter quand la Boutique existera, puis revérifier le rythme.
- Le premier niveau coûte 1 500 $ (pour que l'Étage 50 arrive en 1 jour) : à rejuger une fois le jeu jouable.
