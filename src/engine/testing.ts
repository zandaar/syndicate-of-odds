// Aides réservées aux tests : fabriquer rapidement des Joueurs « de référence ».
import { CLASSES } from '../data/classes';
import type { ClassId, Player, Rarity } from './types';

let nextId = 1;

/** Un Joueur à la Qualité 100 %, sans Trait ni Gadget sauf mention contraire. */
export function makePlayer(classId: ClassId, overrides: Partial<Omit<Player, 'classId'>> = {}): Player {
  const rarity: Rarity = overrides.rarity ?? 'common';
  return {
    id: overrides.id ?? `p${nextId++}`,
    name: overrides.name ?? `Test ${classId}`,
    classId,
    rarity,
    baseStats: overrides.baseStats ?? { ...CLASSES[classId].baseStats },
    traitIds: overrides.traitIds ?? [],
    level: overrides.level ?? 1,
    gear: overrides.gear ?? { accessory: null, gadget: null },
  };
}
