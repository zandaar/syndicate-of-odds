// =====================================================================
// BÂTIMENTS DU QG — améliorés avec du Cash, sans limite de niveau.
//
// Coût du niveau suivant = baseCost × costGrowth^(niveau actuel).
// `perLevel` : l'effet d'un niveau (voir chaque description).
// Pour régler un Bâtiment : change ses nombres puis lance `npm test`.
// =====================================================================

export type BuildingId = 'training' | 'hideout' | 'agency' | 'vault';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  perLevel: number;
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  training: {
    id: 'training',
    name: "Salle d'entraînement",
    description: 'Les Joueurs sur le banc reçoivent +5 % par niveau de la Réputation gagnée par les Équipes.',
    baseCost: 10000,
    costGrowth: 2.5,
    perLevel: 0.05,
  },
  hideout: {
    id: 'hideout',
    name: 'Planque',
    description: 'Plafond des gains hors-ligne +1 heure par niveau.',
    baseCost: 20000,
    costGrowth: 2.5,
    perLevel: 1,
  },
  agency: {
    id: 'agency',
    name: 'Agence',
    description: 'Meilleures chances de Raretés à chaque niveau, et 1 Candidat de plus tous les 3 niveaux.',
    baseCost: 16000,
    costGrowth: 2.5,
    perLevel: 1,
  },
  vault: {
    id: 'vault',
    name: 'Coffre-fort',
    description: "Prime de fin d'Étage +10 % par niveau.",
    baseCost: 12000,
    costGrowth: 2.5,
    perLevel: 0.1,
  },
};

export const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingId[];
