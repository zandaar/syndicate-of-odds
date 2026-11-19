// Le Réseau : prix et effets des bonus permanents achetés avec l'Influence.
import { CONTACT_START_FLOORS, NETWORK, NETWORK_IDS, type NetworkId } from '../data/network';

export type NetworkLevels = Record<NetworkId, number>;

export function noNetwork(): NetworkLevels {
  return Object.fromEntries(NETWORK_IDS.map((id) => [id, 0])) as NetworkLevels;
}

/** Prix en Influence pour passer un bonus du niveau `level` au suivant (null si déjà au maximum). */
export function networkCost(id: NetworkId, level: number): number | null {
  const def = NETWORK[id];
  if (level >= def.maxLevel) return null;
  const listed = def.costs[level];
  if (listed !== undefined) return listed;
  const last = def.costs[def.costs.length - 1]!;
  return Math.ceil(last * def.costGrowth ** (level - def.costs.length + 1));
}

export interface NetworkEffects {
  cashMult: number;
  reputationMult: number;
  /** Poids ajoutés aux chances de Rareté. */
  rarityBonus: { rare: number; epic: number; legendary: number };
  startFloor: number;
  offlineExtraSeconds: number;
}

export function networkEffects(levels: NetworkLevels): NetworkEffects {
  return {
    cashMult: 1 + 0.1 * levels.launderers,
    reputationMult: 1 + 0.1 * levels.mentors,
    rarityBonus: { rare: 3 * levels.informants, epic: levels.informants, legendary: 0.25 * levels.informants },
    startFloor: CONTACT_START_FLOORS[Math.min(levels.contacts, CONTACT_START_FLOORS.length - 1)]!,
    offlineExtraSeconds: 4 * 3600 * levels.sleepless,
  };
}

/** Influence gagnée en Blanchissant après avoir atteint cet Étage. */
export function influenceFor(highestCleared: number): number {
  return Math.floor((highestCleared / 10) ** 2);
}
