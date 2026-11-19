// =====================================================================
// CATALOGUE DES GADGETS (Boutique VIP)
//
// Chaque Joueur a 2 emplacements : 1 « accessory » (Accessoire) et 1 « gadget ».
// Pour ajouter un Gadget : copie un bloc existant, change son `id` (unique,
// en minuscules avec des tirets), son nom, son prix et ses effets.
// Les noms respectent docs/charte-des-noms.md.
//
// `stats` : bonus ajoutés aux stats de niveau 1 du porteur (ils grandissent
// donc avec ses niveaux). `luck` est en points de pourcentage.
// `effects` : effets spéciaux (voir Modifier dans src/engine/types.ts).
// `classId` : si présent, les effets ne marchent que sur cette Classe.
// =====================================================================
import type { ClassId, GearSlot, Modifier, StatId } from '../engine/types';

export interface ItemDef {
  id: string;
  name: string;
  slot: GearSlot;
  price: number;
  stats: Partial<Record<StatId, number>>;
  effects: Modifier[];
  description: string;
  classId?: ClassId;
}

export const ITEMS: ItemDef[] = [
  {
    id: 'des-pipes',
    name: 'Dés Pipés',
    slot: 'gadget',
    price: 3,
    stats: { flair: 6, luck: 4 },
    effects: [{ kind: 'drain', on: 'normal', value: 0.1 }],
    description: '+10 % de Rafle sur les Étages normaux.',
  },
  {
    id: 'lunettes-fumees',
    name: 'Lunettes Fumées',
    slot: 'accessory',
    price: 3,
    stats: { composure: 40, stealth: 8 },
    effects: [{ kind: 'earlyShield', ticks: 10, value: 0.15 }],
    description: '−15 % de Soupçons pendant les 5 premières secondes.',
  },
  {
    id: 'trefle',
    name: 'Trèfle à Quatre Feuilles',
    slot: 'accessory',
    price: 5,
    stats: { luck: 10 },
    effects: [{ kind: 'jackpotHeal', value: 0.03 }],
    description: "Chaque Jackpot rend 3 % de la Couverture de l'Équipe.",
  },
  {
    id: 'oreillette',
    name: 'Oreillette Cryptée',
    slot: 'gadget',
    price: 6,
    stats: { flair: 10, stealth: 10 },
    effects: [{ kind: 'auraBoost', value: 0.05 }],
    description: "L'aura des Cerveaux de l'Équipe donne +5 % de Flair en plus.",
  },
  {
    id: 'as-manche',
    name: 'As dans la Manche',
    slot: 'gadget',
    price: 10,
    stats: { flair: 22, luck: 6 },
    effects: [{ kind: 'guaranteedJackpot', every: 5 }],
    description: 'Une attaque sur 5 est forcément un Jackpot.',
  },
  {
    id: 'costume',
    name: 'Costume sur Mesure',
    slot: 'accessory',
    price: 12,
    stats: { composure: 120, stealth: 20 },
    effects: [{ kind: 'coverMax', value: 0.12 }],
    description: "+12 % de Couverture maximale pour l'Équipe.",
  },
  {
    id: 'brouilleur',
    name: 'Brouilleur de Caméras',
    slot: 'gadget',
    price: 18,
    stats: { stealth: 35 },
    effects: [{ kind: 'pressure', value: -0.15 }],
    description: '−15 % de Pression du casino.',
  },
  {
    id: 'montre-or',
    name: 'Montre en Or Massif',
    slot: 'accessory',
    price: 22,
    stats: { flair: 45, composure: 150 },
    effects: [{ kind: 'floorBonus', value: 0.2 }],
    description: "+20 % de prime de fin d'Étage.",
  },
  {
    id: 'jeton-porte-bonheur',
    name: 'Jeton Porte-Bonheur',
    slot: 'accessory',
    price: 30,
    stats: { luck: 18 },
    effects: [{ kind: 'jackpotPower', value: 0.4 }],
    description: 'Jackpots +40 %.',
  },
  {
    id: 'mallette',
    name: 'Mallette à Double Fond',
    slot: 'gadget',
    price: 40,
    stats: { flair: 95, stealth: 30 },
    effects: [{ kind: 'offline', value: 0.25 }],
    description: '+25 % de gains hors-ligne.',
  },
  {
    id: 'passe-partout',
    name: 'Passe-Partout VIP',
    slot: 'gadget',
    price: 55,
    stats: { flair: 140, luck: 12 },
    effects: [{ kind: 'drain', on: 'boss', value: 0.3 }],
    description: '+30 % de Rafle contre les Boss.',
  },
  {
    id: 'bague-syndicat',
    name: 'Bague du Syndicat',
    slot: 'accessory',
    price: 75,
    stats: { flair: 120, composure: 350, stealth: 45 },
    effects: [
      { kind: 'statPercent', stat: 'flair', value: 0.15 },
      { kind: 'statPercent', stat: 'luck', value: 0.15 },
      { kind: 'statPercent', stat: 'composure', value: 0.15 },
      { kind: 'statPercent', stat: 'stealth', value: 0.15 },
    ],
    description: 'Toutes les stats du porteur +15 %.',
  },

  // --- Gadgets de Classe : leurs effets ne marchent que sur leur Classe. ---
  {
    id: 'briquet-or',
    name: 'Briquet en Or',
    slot: 'gadget',
    price: 15,
    classId: 'gambler',
    stats: { flair: 20, luck: 5 },
    effects: [{ kind: 'jackpotPower', value: 0.25 }],
    description: 'Flambeur uniquement : Jackpots +25 % de plus.',
  },
  {
    id: 'masque-velours',
    name: 'Masque de Velours',
    slot: 'accessory',
    price: 15,
    classId: 'bluffer',
    stats: { composure: 150, stealth: 25 },
    effects: [{ kind: 'stealthEfficiency', value: 0.15 }],
    description: "Bluffeur uniquement : +15 % d'efficacité de Discrétion en plus.",
  },
  {
    id: 'carnet-noir',
    name: 'Le Carnet Noir',
    slot: 'gadget',
    price: 15,
    classId: 'mastermind',
    stats: { flair: 15, composure: 60 },
    effects: [{ kind: 'aura', flair: 0.05, luck: 3 }],
    description: 'Cerveau uniquement : aura +5 % de Flair et +3 % de Chance.',
  },
  {
    id: 'sabot-truque',
    name: 'Le Sabot Truqué',
    slot: 'gadget',
    price: 15,
    classId: 'counter',
    stats: { flair: 25 },
    effects: [{ kind: 'ramp', perTick: 0.01, cap: 0.5 }],
    description: 'Compteur uniquement : +1 % de Rafle par tick en plus (jusqu’à +50 %).',
  },
  {
    id: 'gants-soie',
    name: 'Les Gants de Soie',
    slot: 'accessory',
    price: 15,
    classId: 'pickpocket',
    stats: { flair: 10, stealth: 30 },
    effects: [
      { kind: 'floorBonus', value: 0.2 },
      { kind: 'offline', value: 0.2 },
    ],
    description: "Pickpocket uniquement : +20 % de prime de fin d'Étage et de gains hors-ligne.",
  },
  {
    id: 'coupe-circuit',
    name: 'Le Coupe-Circuit',
    slot: 'gadget',
    price: 15,
    classId: 'saboteur',
    stats: { stealth: 30, composure: 80 },
    effects: [{ kind: 'pressure', value: -0.1 }],
    description: 'Saboteur uniquement : −10 % de Pression en plus.',
  },
];

export const ITEMS_BY_ID: ReadonlyMap<string, ItemDef> = new Map(ITEMS.map((item) => [item.id, item]));
