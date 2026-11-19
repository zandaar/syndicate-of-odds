// Composition d'une Table : décide QUOI dessiner (sans rien dessiner).
// Fonction pure, testée ; le dessin lui-même est dans draw.ts.
import type { Ambiance } from '../data/names/casinos';
import type { ClassId } from '../engine/types';

export const SCENE_WIDTH = 160;
export const SCENE_HEIGHT = 64;

export interface SceneInput {
  ambiance: Ambiance;
  casino: number;
  floorInCasino: number;
  isBoss: boolean;
  /** Palier de prestige du Casino (0 à 3). */
  tier: number;
  members: ClassId[];
  /** Couverture restante, entre 0 et 1. */
  coverRatio: number;
  /** L'Équipe est en repli : la Table est vide. */
  retreat: boolean;
}

export interface Seat {
  classId: ClassId;
  x: number;
  y: number;
}

export interface Scene {
  ambiance: Ambiance;
  table: 'poker' | 'roulette';
  seats: Seat[];
  guards: number;
  cameras: number;
  boss: boolean;
  alert: boolean;
  empty: boolean;
}

/** Places devant la Table (coin supérieur gauche du buste) : à gauche, au centre, à droite. */
const SEATS = [
  { x: 42, y: 40 },
  { x: 72, y: 43 },
  { x: 102, y: 40 },
];

export function composeScene(input: SceneInput): Scene {
  const empty = input.retreat;
  return {
    ambiance: input.ambiance,
    // Les Tripots des Docks jouent au poker ; ailleurs, la roulette un Casino sur deux.
    table: input.ambiance === 'docks' || input.casino % 2 === 1 ? 'poker' : 'roulette',
    seats: empty
      ? []
      : input.members.slice(0, SEATS.length).map((classId, i) => ({ classId, x: SEATS[i]!.x, y: SEATS[i]!.y })),
    // La sécurité se renforce au fil des Étages du Casino.
    guards: Math.min(4, 1 + Math.floor((input.floorInCasino - 1) / 3)),
    cameras: Math.min(3, input.tier + 1),
    boss: input.isBoss && !empty,
    alert: !empty && input.members.length > 0 && input.coverRatio < 0.3,
    empty,
  };
}
