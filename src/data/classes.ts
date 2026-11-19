// =====================================================================
// LES 6 CLASSES
//
// Chaque Classe définit :
//   - ses stats de référence au niveau 1 (Joueur Commun, Qualité 100 %) ;
//   - son passif, sous forme de « modifiers » (voir Modifier dans src/engine/types.ts).
//
// Pour ajuster une Classe, modifie ses nombres puis lance `npm test`.
// Ajouter une 7e Classe demande aussi de l'ajouter au type ClassId.
// =====================================================================
import type { BaseStats, ClassId, Modifier } from '../engine/types';

export interface ClassDef {
  id: ClassId;
  name: string;
  /** Nom au féminin. */
  nameF: string;
  /** Ce que la Classe apporte, en une phrase (affiché dans le jeu). */
  strength: string;
  weakness: string;
  passive: string;
  baseStats: BaseStats;
  modifiers: Modifier[];
}

export const CLASSES: Record<ClassId, ClassDef> = {
  gambler: {
    id: 'gambler',
    name: 'Flambeur',
    nameF: 'Flambeuse',
    strength: 'Jackpots fréquents et énormes.',
    weakness: 'Fragile et irrégulier.',
    passive: 'Jackpots +25 %.',
    baseStats: { flair: 14, luck: 12, composure: 60, stealth: 5 },
    modifiers: [{ kind: 'jackpotPower', value: 0.25 }],
  },
  bluffer: {
    id: 'bluffer',
    name: 'Bluffeur',
    nameF: 'Bluffeuse',
    strength: 'Énorme Sang-froid, haute Discrétion.',
    weakness: 'Rapporte très peu.',
    passive: "+20 % d'efficacité de Discrétion pour l'Équipe.",
    baseStats: { flair: 7, luck: 4, composure: 150, stealth: 20 },
    modifiers: [{ kind: 'stealthEfficiency', value: 0.2 }],
  },
  mastermind: {
    id: 'mastermind',
    name: 'Cerveau',
    nameF: 'Cerveau',
    strength: 'Renforce ses coéquipiers.',
    weakness: 'Presque inutile seul.',
    passive: 'Coéquipiers : +10 % de Flair et +5 % de Chance.',
    baseStats: { flair: 10, luck: 8, composure: 90, stealth: 12 },
    modifiers: [{ kind: 'aura', flair: 0.1, luck: 5 }],
  },
  counter: {
    id: 'counter',
    name: 'Compteur de cartes',
    nameF: 'Compteuse de cartes',
    strength: 'Monte en puissance pendant une Table, idéal contre les Boss.',
    weakness: 'Démarre lentement et ne fait jamais de Jackpot.',
    passive: '+3 % de Rafle par tick passé sur la même Table (jusqu’à +150 %).',
    baseStats: { flair: 12, luck: 0, composure: 80, stealth: 10 },
    modifiers: [{ kind: 'noJackpot' }, { kind: 'ramp', perTick: 0.03, cap: 1.5 }],
  },
  pickpocket: {
    id: 'pickpocket',
    name: 'Pickpocket',
    nameF: 'Pickpocket',
    strength: 'Rapporte beaucoup de Cash hors des Tables.',
    weakness: 'Faible à la Table.',
    passive: "+30 % de prime de fin d'Étage et de gains hors-ligne.",
    baseStats: { flair: 6, luck: 10, composure: 70, stealth: 25 },
    modifiers: [
      { kind: 'floorBonus', value: 0.3 },
      { kind: 'offline', value: 0.3 },
    ],
  },
  saboteur: {
    id: 'saboteur',
    name: 'Saboteur',
    nameF: 'Saboteuse',
    strength: 'Fait baisser la Pression, surtout celle des Boss.',
    weakness: 'Rafle faible, inutile quand la Pression est basse.',
    passive: '−15 % de Pression et −30 % du supplément des Boss.',
    baseStats: { flair: 8, luck: 6, composure: 100, stealth: 15 },
    modifiers: [
      { kind: 'pressure', value: -0.15 },
      { kind: 'bossPressure', value: -0.3 },
    ],
  },
};
