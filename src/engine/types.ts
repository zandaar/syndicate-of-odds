// Types partagés par tout le moteur. Le vocabulaire suit GLOSSARY.md.
import type { Decimal } from './bignum';

export type ClassId = 'gambler' | 'bluffer' | 'mastermind' | 'counter' | 'pickpocket' | 'saboteur';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type StatId = 'flair' | 'luck' | 'composure' | 'stealth';
export type GearSlot = 'accessory' | 'gadget';

/**
 * Les 4 stats d'un Joueur au niveau 1.
 * `luck` est en points de pourcentage (12 = 12 % de chance de Jackpot).
 */
export interface BaseStats {
  flair: number;
  luck: number;
  composure: number;
  stealth: number;
}

/**
 * Un effet chiffré apporté par une Classe, un Trait ou un Gadget.
 * Portée « owner » : ne touche que le Joueur qui le porte.
 * Portée « team » : touche toute l'Équipe du porteur.
 */
export type Modifier =
  /** owner — ajouté aux stats de niveau 1, puis grandit avec les niveaux. */
  | { kind: 'statFlat'; stat: StatId; value: number }
  /** owner — multiplie la stat finale (0,15 = +15 %). */
  | { kind: 'statPercent'; stat: StatId; value: number }
  /** owner — augmente le drain (0,1 = +10 %) sur tous les Étages, les Boss ou les Étages normaux. */
  | { kind: 'drain'; on: 'all' | 'boss' | 'normal'; value: number }
  /** owner — augmente la puissance des Jackpots (0,25 = Jackpots ×2,5 au lieu de ×2). */
  | { kind: 'jackpotPower'; value: number }
  /** owner — une attaque sur `every` est forcément un Jackpot. */
  | { kind: 'guaranteedJackpot'; every: number }
  /** owner — ne déclenche jamais de Jackpot. */
  | { kind: 'noJackpot' }
  /** owner — le drain augmente à chaque tick passé sur la même Table, jusqu'à `cap`. */
  | { kind: 'ramp'; perTick: number; cap: number }
  /** owner — renforce les coéquipiers (pas le porteur). `luck` en points de pourcentage. */
  | { kind: 'aura'; flair: number; luck: number }
  /** team — renforce le Flair donné par toutes les auras de l'Équipe. */
  | { kind: 'auraBoost'; value: number }
  /** team — efficacité de la Discrétion de l'Équipe. */
  | { kind: 'stealthEfficiency'; value: number }
  /** team — Couverture maximale. */
  | { kind: 'coverMax'; value: number }
  /** team — Pression subie (−0,15 = −15 %). */
  | { kind: 'pressure'; value: number }
  /** team — part du supplément de Pression des Boss (−0,3 = −30 % du supplément). */
  | { kind: 'bossPressure'; value: number }
  /** team — prime de fin d'Étage. */
  | { kind: 'floorBonus'; value: number }
  /** team — gains hors-ligne. */
  | { kind: 'offline'; value: number }
  /** team — chaque Jackpot rend cette part de la Couverture maximale. */
  | { kind: 'jackpotHeal'; value: number }
  /** team — réduit les dégâts subis pendant les premiers ticks d'une Table. */
  | { kind: 'earlyShield'; ticks: number; value: number };

/** Un Joueur du roster. */
export interface Player {
  id: string;
  name: string;
  gender: 'm' | 'f';
  classId: ClassId;
  rarity: Rarity;
  /** Écart des stats de départ par rapport à la référence de la Classe, en % (85 à 115). */
  quality: number;
  /** Stats de niveau 1, Rareté et Qualité déjà appliquées au recrutement. */
  baseStats: BaseStats;
  traitIds: string[];
  level: number;
  gear: Record<GearSlot, string | null>;
}

/** Bonus valables pour tout le Syndicat (Réseau, Succès). */
export interface GlobalBonuses {
  /** Multiplicateur de tout le Cash gagné (1 = normal). */
  cashMult: number;
}

/** Un Étage, entièrement déduit de son numéro. */
export interface FloorSpec {
  floor: number;
  /** Numéro du Casino, à partir de 1. */
  casino: number;
  /** Position dans le Casino, de 1 à 10. */
  floorInCasino: number;
  isBoss: boolean;
  vault: Decimal;
  pressure: Decimal;
  /** Échelle de la Discrétion : la réduction vaut Discrétion ÷ (Discrétion + échelle). */
  stealthScale: Decimal;
  /** Supplément de Pression dû au Boss (0 sur un Étage normal). */
  bossPressureExtra: number;
  /** Jetons VIP gagnés au premier passage d'un Boss. */
  vipReward: number;
}
