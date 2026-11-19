// Succès : progression mesurée sur toute la vie du Syndicat, paliers débloqués une seule fois.
import { ACHIEVEMENTS, type AchievementFamily, type AchievementFamilyId } from '../data/achievements';
import { CLASSES } from '../data/classes';
import { masteryFromTotal } from './economy';
import type { GameState } from './game';
import type { ClassId } from './types';

export interface AchievementUnlock {
  familyId: AchievementFamilyId;
  /** Numéro du palier, à partir de 1. */
  tier: number;
  label: string;
  vip: number;
}

/** Valeur que mesure chaque famille. */
export function achievementProgress(state: GameState, id: AchievementFamilyId): number {
  const life = state.lifetime;
  switch (id) {
    case 'floor':
      return Math.max(life.bestFloor, state.highestCleared);
    case 'jackpots':
      return life.jackpots;
    case 'cash':
      return life.cash.gt(1e300) ? Number.MAX_VALUE : life.cash.toNumber();
    case 'laundering':
      return life.launderings;
    case 'mastery':
      return Math.max(...(Object.keys(CLASSES) as ClassId[]).map((c) => masteryFromTotal(state.mastery[c]).level));
    case 'roster':
      return state.roster.length;
    case 'rarity':
      // 1 : un Rare ; 2 : un Épique ; 3 : un Légendaire ; 4 : trois Légendaires différents.
      return life.legendaries.length >= 3 ? 4 : life.legendaries.length > 0 ? 3 : life.recruitedEpic ? 2 : life.recruitedRare ? 1 : 0;
  }
}

/** Paliers déjà débloqués, toutes familles confondues. */
export function achievementCount(state: GameState): number {
  return Object.values(state.achievements).reduce((total, tiers) => total + tiers, 0);
}

/** Seuil du prochain palier d'une famille (null s'il n'y en a plus). */
export function nextThreshold(family: AchievementFamily, unlocked: number): number | null {
  return family.threshold(unlocked);
}

/** Débloque tous les paliers atteints et verse leurs Jetons VIP. */
export function evaluateAchievements(state: GameState): { state: GameState; unlocked: AchievementUnlock[] } {
  const unlocked: AchievementUnlock[] = [];
  const achievements = { ...state.achievements };
  let vip = state.vip;

  for (const family of ACHIEVEMENTS) {
    const progress = achievementProgress(state, family.id);
    for (let guard = 0; guard < 1000; guard++) {
      const done = achievements[family.id] ?? 0;
      const threshold = family.threshold(done);
      if (threshold === null || progress < threshold) break;
      const tier = done + 1;
      const reward = family.vipBase * tier;
      achievements[family.id] = tier;
      vip += reward;
      unlocked.push({ familyId: family.id, tier, label: family.label(threshold), vip: reward });
    }
  }

  if (unlocked.length === 0) return { state, unlocked };
  return { state: { ...state, achievements, vip }, unlocked };
}
