// Arbres de Talents : points disponibles, déblocage et redistribution.
import { TALENTS, TALENTS_BY_ID, type TalentDef } from '../data/talents';
import type { Player } from './types';

export type TalentRefusal = 'unknown-talent' | 'wrong-class' | 'no-points' | 'max-rank' | 'locked-points' | 'locked-mastery';

/** Points gagnés (1 par niveau au-delà du premier, plus le bonus d'embauche), dépensés et restants. */
export function talentPoints(player: Player): { earned: number; spent: number; available: number } {
  const earned = player.level - 1 + player.bonusTalentPoints;
  const spent = Object.values(player.talents).reduce((total, rank) => total + rank, 0);
  return { earned, spent, available: earned - spent };
}

/** Points déjà dépensés dans une branche. */
export function branchPoints(player: Player, branchId: string): number {
  return TALENTS.filter((t) => t.classId === player.classId && t.branchId === branchId).reduce(
    (total, t) => total + (player.talents[t.id] ?? 0),
    0,
  );
}

/** Pourquoi ce Talent ne peut pas recevoir de point maintenant (null s'il le peut). */
export function talentRefusal(player: Player, talentId: string, masteryLevel: number): TalentRefusal | null {
  const talent: TalentDef | undefined = TALENTS_BY_ID.get(talentId);
  if (!talent) return 'unknown-talent';
  if (talent.classId !== player.classId) return 'wrong-class';
  if ((player.talents[talentId] ?? 0) >= talent.maxRank) return 'max-rank';
  if (branchPoints(player, talent.branchId) < talent.requiredPoints) return 'locked-points';
  if (masteryLevel < talent.requiredMastery) return 'locked-mastery';
  if (talentPoints(player).available <= 0) return 'no-points';
  return null;
}

/** Ajoute un rang à un Talent. */
export function learnTalent(player: Player, talentId: string, masteryLevel: number): { player: Player; refusal: TalentRefusal | null } {
  const refusal = talentRefusal(player, talentId, masteryLevel);
  if (refusal) return { player, refusal };
  return { player: { ...player, talents: { ...player.talents, [talentId]: (player.talents[talentId] ?? 0) + 1 } }, refusal: null };
}

/** Rend tous les points de Talent d'un Joueur. */
export function resetTalents(player: Player): Player {
  return { ...player, talents: {} };
}
