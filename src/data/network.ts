// =====================================================================
// LE RÉSEAU — bonus permanents achetés avec l'Influence (gagnée en Blanchissant).
// Le Réseau survit à tous les Blanchiments.
//
// `costs` : prix de chaque niveau, dans l'ordre. S'il y a moins de prix que de
// niveaux possibles, le prix suivant = dernier prix × `costGrowth`.
// `maxLevel` : niveau maximal (Infinity = sans limite).
// =====================================================================

export type NetworkId = 'launderers' | 'mentors' | 'informants' | 'contacts' | 'sleepless';

export interface NetworkDef {
  id: NetworkId;
  name: string;
  description: string;
  costs: number[];
  costGrowth: number;
  maxLevel: number;
}

export const NETWORK: Record<NetworkId, NetworkDef> = {
  launderers: {
    id: 'launderers',
    name: 'Blanchisseurs',
    description: '+10 % de Cash par niveau.',
    costs: [5],
    costGrowth: 1.6,
    maxLevel: Number.POSITIVE_INFINITY,
  },
  mentors: {
    id: 'mentors',
    name: 'Mentors',
    description: '+10 % de Réputation par niveau.',
    costs: [5],
    costGrowth: 1.6,
    maxLevel: Number.POSITIVE_INFINITY,
  },
  informants: {
    id: 'informants',
    name: 'Indics',
    description: 'Meilleures chances de recruter des Rares, Épiques et Légendaires, à chaque niveau.',
    costs: [10],
    costGrowth: 2,
    maxLevel: Number.POSITIVE_INFINITY,
  },
  contacts: {
    id: 'contacts',
    name: 'Contacts',
    description: 'Chaque nouvelle partie commence directement à l’Étage 10, puis 25, puis 50.',
    costs: [25, 100, 400],
    costGrowth: 1,
    maxLevel: 3,
  },
  sleepless: {
    id: 'sleepless',
    name: 'Nuits blanches',
    description: 'Plafond des gains hors-ligne +4 heures par niveau.',
    costs: [30, 120],
    costGrowth: 1,
    maxLevel: 2,
  },
};

export const NETWORK_IDS = Object.keys(NETWORK) as NetworkId[];

/** Étage de départ selon le niveau de Contacts. */
export const CONTACT_START_FLOORS = [1, 10, 25, 50];
