// =====================================================================
// SUCCÈS — par familles, à paliers (souvent sans fin).
//
// Chaque palier se débloque une seule fois et rapporte :
//   - des Jetons VIP : vipBase × (numéro du palier) ;
//   - +1 % de Cash permanent (tous Succès confondus).
// Les Succès survivent au Blanchiment ; les compteurs sont comptés sur toute la vie du Syndicat.
//
// Pour ajouter une famille : ajoute-la ici ET dans `achievementProgress` (src/engine/achievements.ts),
// qui dit quelle valeur du jeu elle mesure.
// =====================================================================

export type AchievementFamilyId = 'floor' | 'jackpots' | 'cash' | 'laundering' | 'mastery' | 'roster' | 'rarity';

export interface AchievementFamily {
  id: AchievementFamilyId;
  name: string;
  /** Seuil du palier n°`tier` (0 = premier palier), ou null s'il n'y en a plus. */
  threshold: (tier: number) => number | null;
  /** Texte d'un palier, à partir de son seuil. */
  label: (threshold: number) => string;
  vipBase: number;
}

/** 1 – 2,5 – 5 – 10 – 25 – 50… à partir de `start`. */
function oneTwoFive(start: number): (tier: number) => number {
  return (tier) => start * [1, 2.5, 5][tier % 3]! * 10 ** Math.floor(tier / 3);
}

/** 1 – 3 – 10 – 30 – 100… */
function oneThree(tier: number): number {
  return [1, 3][tier % 2]! * 10 ** Math.floor(tier / 2);
}

const fr = (value: number) => value.toLocaleString('fr-FR');

export const ACHIEVEMENTS: AchievementFamily[] = [
  { id: 'floor', name: 'Ascension', threshold: oneTwoFive(10), label: (n) => `Atteindre l'Étage ${fr(n)}`, vipBase: 5 },
  { id: 'jackpots', name: 'Main chaude', threshold: (t) => 100 * 10 ** t, label: (n) => `Réussir ${fr(n)} Jackpots`, vipBase: 5 },
  { id: 'cash', name: 'Coffres pleins', threshold: (t) => 1e6 * 1000 ** t, label: (n) => `Rafler ${n.toExponential(0).replace('e+', 'e')} $ au total`, vipBase: 5 },
  { id: 'laundering', name: 'Blanchisserie', threshold: oneThree, label: (n) => `Blanchir ${fr(n)} fois`, vipBase: 10 },
  { id: 'mastery', name: 'Maître du jeu', threshold: (t) => (t === 0 ? 5 : oneTwoFive(10)(t - 1)), label: (n) => `Maîtrise ${fr(n)} dans une Classe`, vipBase: 5 },
  { id: 'roster', name: 'Grande famille', threshold: (t) => [6, 12][t] ?? null, label: (n) => `Réunir ${n} Joueurs`, vipBase: 5 },
  {
    id: 'rarity',
    name: 'Fins limiers',
    threshold: (t) => [1, 2, 3, 4][t] ?? null,
    label: (n) => ['Recruter un Rare', 'Recruter un Épique', 'Recruter un Légendaire', 'Recruter 3 Légendaires différents'][n - 1] ?? '',
    vipBase: 10,
  },
];
