# Spécification V1 — Syndicate of Odds

Ce document résume les décisions prises le 19/11/2026 à partir du document de conception Gemini
(`Syndicate of Odds - Game Design Document & Specs Techniques.pdf`).
**Quand les deux se contredisent, c'est ce document qui fait foi.** Le vocabulaire suit [GLOSSARY.md](../GLOSSARY.md),
les noms suivent [la charte des noms](charte-des-noms.md).

## Ce qui reste comme dans le document Gemini

- Stack : React + Vite + TypeScript strict + Tailwind, site statique sur GitHub Pages via GitHub Actions.
- Arborescence `src/data`, `src/engine`, `src/storage`, `src/components` ; moteur sans dépendance à React.
- Les 4 stats (Flair, Chance, Sang-froid, Discrétion), le tick de 0,5 s, la Caisse et la Couverture, la formule de réduction hyperbolique.
- Défaite sans punition : l'Équipe garde son Cash, se replie 3 s puis relance (option « repli sécurisé »).
- Sauvegarde locale toutes les 10 s et à la fermeture, `saveVersion` et migrations, export/import Base64 et `.json`. Firebase en phase 2.
- Pixel art « Dark Casino » dessiné dans le code, sans image externe.

## Ce qui change

| Sujet | Document Gemini | Décision V1 |
|---|---|---|
| Étages | 30 Étages fixes | Étages infinis ; Casinos 1 à 3 écrits à la main, puis générés (10 Étages, 2 Boss chacun). Même Étage = même Casino et mêmes Boss pour tout le monde. |
| Nombres | `number` JavaScript | Bibliothèque de grands nombres (`break_eternity.js`) dans tout le moteur ; affichage K, M, B, T, puis aa, ab… ; option notation scientifique. |
| Équilibrage | Formules fixes (non gagnables en l'état) | Mêmes formes de courbes, valeurs réglées dans `src/data/balance.ts` et vérifiées par un simulateur automatique. |
| Rythme | non précisé | Premier Blanchiment (Étage 50) en 1 à 2 jours de jeu normal ; chaque tour suivant va plus loin, plus vite. |
| Joueurs | 6 personnages nommés, 3 rôles | Joueurs générés : 6 Classes, stats ±15 % (Qualité), Traits, 4 Raretés, noms générés. |
| Recrutement | achat direct | Bureau de recrutement : 3 Candidats, renouvelés toutes les 20 min (ou contre du Cash) ; roster de 12 places extensible en Jetons VIP ; renvoi = 50 % du Cash des niveaux rendu. |
| Départ | Sam offert | Un Flambeur Commun offert. |
| Équipes | 1 + 1 débloquée | Inchangé : 2 Équipes en V1 ; Cash et Jetons VIP communs ; un Joueur dans une seule Équipe. |
| Objectifs | menu « Contrats/Objectifs » | Succès par paliers sans fin ; Jetons VIP + petit bonus permanent. |
| Hors-ligne | gains moyens | Gains de l'Étage actuel, sans monter d'Étage ; plafond 12 h. |
| Prestige | V2 | **Blanchiment en V1**, débloqué à l'Étage 50 : tout repart de zéro sauf l'Influence, le Réseau et les Succès. |
| Gadgets | 12 fixes | 18 fixes : les 12 du document + 1 Gadget de Classe par Classe ; prix réglés pour être rachetables à chaque tour. |
| Interface | 3 colonnes | 3 colonnes sur PC, 3 onglets sur mobile (QG / Casinos / Équipe). Textes en français, code en anglais. |
| Hébergement | dépôt public | Dépôt public `syndicate-of-odds`. |

## Les 6 Classes

| Classe | Rôle | Force | Faiblesse | Passif |
|---|---|---|---|---|
| Flambeur | Gros gains | Jackpots fréquents et énormes | Fragile, irrégulier | Jackpots +25 % |
| Bluffeur | Encaisse | Énorme Sang-froid, haute Discrétion | Rapporte très peu | +20 % d'efficacité de Discrétion pour l'Équipe |
| Cerveau | Renforce les autres | Booste les coéquipiers | Presque inutile seul | Coéquipiers +10 % Flair, +5 % Chance |
| Compteur de cartes | Gains réguliers | Monte en puissance, idéal contre les Boss | Démarre lentement, jamais de Jackpot | +3 % de drain par tick sur la même Table (max +150 %) |
| Pickpocket | Économie | Beaucoup de Cash hors combat | Faible à la Table | +30 % de prime de fin d'Étage et de gains hors-ligne |
| Saboteur | Neutralise la sécurité | Baisse la Pression, surtout des Boss | Drain faible, inutile si la Pression est basse | −15 % de Pression, −30 % du bonus de difficulté des Boss |

## Rareté

| Rareté | Apparition | Stats | Traits |
|---|---|---|---|
| Commun | 70 % | ×1 | 1 |
| Rare | 24 % | ×1,25 | 1 |
| Épique | 5 % | ×1,6 | 2 |
| Légendaire | 1 % | ×2,2 | 2, dont 1 unique |

## Le Réseau (bonus achetés avec l'Influence)

Blanchisseurs (+10 % de Cash par niveau), Indics (meilleures chances de Rareté), Agence de placement (+1 Candidat),
Contacts (recommencer à l'Étage 10, 25, 50), Nuits blanches (plafond hors-ligne 16 h, puis 24 h).

## Hors V1 (prévu par l'architecture)

3e Équipe et presets, Gadgets aléatoires (raretés, affixes, fusion), bâtiments évolutifs du QG, contrats à modificateurs,
mode Tour VIP, comptes Firebase et synchronisation cloud.
