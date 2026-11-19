// Bâtiments du QG : coûts et effets.
import { BALANCE, RARITY } from '../data/balance';
import { BUILDINGS, BUILDING_IDS, type BuildingId } from '../data/buildings';
import { D, type Decimal } from './bignum';
import type { RarityWeights } from './recruitment';

export type BuildingLevels = Record<BuildingId, number>;

export function noBuildings(): BuildingLevels {
  return Object.fromEntries(BUILDING_IDS.map((id) => [id, 0])) as BuildingLevels;
}

/** Prix pour passer un Bâtiment du niveau `level` au suivant. */
export function buildingCost(id: BuildingId, level: number): Decimal {
  const def = BUILDINGS[id];
  return D(def.costGrowth).pow(level).mul(def.baseCost);
}

export interface BuildingEffects {
  /** Part de la Réputation des Équipes reçue par les Joueurs sur le banc. */
  benchShare: number;
  offlineCapSeconds: number;
  candidates: number;
  rarityWeights: RarityWeights;
  /** Bonus de prime de fin d'Étage (0,1 = +10 %). */
  floorBonus: number;
}

export function buildingEffects(levels: BuildingLevels): BuildingEffects {
  const agency = levels.agency;
  return {
    benchShare: levels.training * BUILDINGS.training.perLevel,
    offlineCapSeconds: BALANCE.offlineCapSeconds + levels.hideout * BUILDINGS.hideout.perLevel * 3600,
    candidates: BALANCE.office.candidates + Math.floor(agency / 3),
    rarityWeights: {
      common: RARITY.common.weight,
      rare: RARITY.rare.weight + 2 * agency,
      epic: RARITY.epic.weight + 0.5 * agency,
      legendary: RARITY.legendary.weight + 0.1 * agency,
    },
    floorBonus: levels.vault * BUILDINGS.vault.perLevel,
  };
}
