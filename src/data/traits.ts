// =====================================================================
// TRAITS DES JOUEURS
//
// Un Trait est tiré au recrutement. Beaucoup sont à double tranchant.
// Pour en ajouter un : copie un bloc, change son `id` (unique, minuscules
// et tirets), son nom (24 caractères maximum, voir docs/charte-des-noms.md)
// et ses effets (voir Modifier dans src/engine/types.ts).
// `legendaryOnly` : Trait unique d'un Légendaire (voir src/data/names/legendaries.ts).
// =====================================================================
import type { Modifier, StatId } from '../engine/types';

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  modifiers: Modifier[];
  legendaryOnly?: boolean;
}

const pct = (stat: StatId, value: number): Modifier => ({ kind: 'statPercent', stat, value });
const luck = (value: number): Modifier => ({ kind: 'statFlat', stat: 'luck', value });

export const TRAITS: TraitDef[] = [
  // --- Traits ordinaires ---
  { id: 'tete-brulee', name: 'Tête brûlée', description: '+20 % de Flair, −15 % de Sang-froid.', modifiers: [pct('flair', 0.2), pct('composure', -0.15)] },
  { id: 'sang-de-glace', name: 'Sang de glace', description: '+25 % de Sang-froid.', modifiers: [pct('composure', 0.25)] },
  { id: 'superstitieux', name: 'Superstitieux', description: '+8 % de Chance, −10 % de Flair.', modifiers: [luck(8), pct('flair', -0.1)] },
  { id: 'leve-tot', name: 'Lève-tôt', description: "+15 % de gains hors-ligne pour l'Équipe.", modifiers: [{ kind: 'offline', value: 0.15 }] },
  { id: 'beau-parleur', name: 'Beau parleur', description: '+20 % de Discrétion.', modifiers: [pct('stealth', 0.2)] },
  { id: 'nerveux', name: 'Nerveux', description: '+6 % de Chance, −15 % de Sang-froid.', modifiers: [luck(6), pct('composure', -0.15)] },
  { id: 'gros-bras', name: 'Gros bras', description: '+35 % de Sang-froid, −10 % de Flair.', modifiers: [pct('composure', 0.35), pct('flair', -0.1)] },
  { id: 'flegmatique', name: 'Flegmatique', description: '+15 % de Sang-froid, +10 % de Discrétion.', modifiers: [pct('composure', 0.15), pct('stealth', 0.1)] },
  { id: 'oeil-de-lynx', name: 'Œil de lynx', description: '+5 % de Chance.', modifiers: [luck(5)] },
  { id: 'main-sure', name: 'Main sûre', description: '+12 % de Flair.', modifiers: [pct('flair', 0.12)] },
  { id: 'joueur-ne', name: 'Joueur-né', description: 'Jackpots +15 %.', modifiers: [{ kind: 'jackpotPower', value: 0.15 }] },
  { id: 'noctambule', name: 'Noctambule', description: "+20 % de gains hors-ligne pour l'Équipe, −5 % de Flair.", modifiers: [{ kind: 'offline', value: 0.2 }, pct('flair', -0.05)] },
  { id: 'discret', name: 'Discret', description: '+25 % de Discrétion, −8 % de Flair.', modifiers: [pct('stealth', 0.25), pct('flair', -0.08)] },
  { id: 'bavard', name: 'Bavard', description: '+18 % de Flair, −15 % de Discrétion.', modifiers: [pct('flair', 0.18), pct('stealth', -0.15)] },
  { id: 'veinard', name: 'Veinard', description: '+4 % de Chance, Jackpots +5 %.', modifiers: [luck(4), { kind: 'jackpotPower', value: 0.05 }] },
  { id: 'radin', name: 'Radin', description: "+15 % de prime de fin d'Étage pour l'Équipe.", modifiers: [{ kind: 'floorBonus', value: 0.15 }] },
  { id: 'chasseur-de-primes', name: 'Chasseur de primes', description: '+15 % de drain contre les Boss.', modifiers: [{ kind: 'drain', on: 'boss', value: 0.15 }] },
  { id: 'routinier', name: 'Routinier', description: '+12 % de drain sur les Étages normaux, −10 % contre les Boss.', modifiers: [{ kind: 'drain', on: 'normal', value: 0.12 }, { kind: 'drain', on: 'boss', value: -0.1 }] },
  { id: 'endurant', name: 'Endurant', description: '+20 % de Sang-froid.', modifiers: [pct('composure', 0.2)] },
  { id: 'premier-arrive', name: 'Premier arrivé', description: "−20 % de dégâts subis par l'Équipe pendant les 5 premières secondes.", modifiers: [{ kind: 'earlyShield', ticks: 10, value: 0.2 }] },
  { id: 'rassembleur', name: 'Rassembleur', description: "+6 % de Couverture maximale pour l'Équipe.", modifiers: [{ kind: 'coverMax', value: 0.06 }] },
  { id: 'rancunier', name: 'Rancunier', description: '+20 % de drain contre les Boss, −10 % de Sang-froid.', modifiers: [{ kind: 'drain', on: 'boss', value: 0.2 }, pct('composure', -0.1)] },
  { id: 'mondain', name: 'Mondain', description: '+15 % de Discrétion, +2 % de Chance.', modifiers: [pct('stealth', 0.15), luck(2)] },
  { id: 'insomniaque', name: 'Insomniaque', description: "+25 % de gains hors-ligne pour l'Équipe, −10 % de Sang-froid.", modifiers: [{ kind: 'offline', value: 0.25 }, pct('composure', -0.1)] },
  { id: 'patient', name: 'Patient', description: '+0,5 % de drain par tick sur la même Table (jusqu’à +30 %).', modifiers: [{ kind: 'ramp', perTick: 0.005, cap: 0.3 }] },
  { id: 'fanfaron', name: 'Fanfaron', description: '+25 % de Flair, −25 % de Discrétion.', modifiers: [pct('flair', 0.25), pct('stealth', -0.25)] },
  { id: 'calculateur', name: 'Calculateur', description: 'Une attaque sur 8 est forcément un Jackpot.', modifiers: [{ kind: 'guaranteedJackpot', every: 8 }] },
  { id: 'pied-marin', name: 'Pied marin', description: "−5 % de Pression pour l'Équipe.", modifiers: [{ kind: 'pressure', value: -0.05 }] },
  { id: 'tatoue', name: 'Tatoué', description: '+10 % de Sang-froid, +2 % de Chance.', modifiers: [pct('composure', 0.1), luck(2)] },
  { id: 'ancien-croupier', name: 'Ancien croupier', description: '+3 % de Chance, +10 % de Discrétion.', modifiers: [luck(3), pct('stealth', 0.1)] },

  // --- Traits uniques des Légendaires ---
  { id: 'rien-ne-va-plus', name: 'Rien ne va plus', legendaryOnly: true, description: 'Jackpots +60 %.', modifiers: [{ kind: 'jackpotPower', value: 0.6 }] },
  { id: 'main-royale', name: 'Main royale', legendaryOnly: true, description: '+15 % de Chance, +20 % de Flair.', modifiers: [luck(15), pct('flair', 0.2)] },
  { id: 'immunite-diplomatique', name: 'Immunité diplomatique', legendaryOnly: true, description: "−20 % de Pression pour l'Équipe.", modifiers: [{ kind: 'pressure', value: -0.2 }] },
  { id: 'coeur-de-glace', name: 'Cœur de glace', legendaryOnly: true, description: "+60 % de Sang-froid, +20 % d'efficacité de Discrétion pour l'Équipe.", modifiers: [pct('composure', 0.6), { kind: 'stealthEfficiency', value: 0.2 }] },
  { id: 'carnet-mondain', name: 'Carnet mondain', legendaryOnly: true, description: 'Aura : +15 % de Flair et +5 % de Chance en plus.', modifiers: [{ kind: 'aura', flair: 0.15, luck: 5 }] },
  { id: 'tire-les-ficelles', name: 'Tire les ficelles', legendaryOnly: true, description: "Toutes les auras de l'Équipe donnent +15 % de Flair en plus.", modifiers: [{ kind: 'auraBoost', value: 0.15 }] },
  { id: 'methode-castellane', name: 'Méthode Castellane', legendaryOnly: true, description: '+2 % de drain par tick en plus (jusqu’à +100 %).', modifiers: [{ kind: 'ramp', perTick: 0.02, cap: 1 }] },
  { id: 'table-rase', name: 'Table rase', legendaryOnly: true, description: '+50 % de drain contre les Boss.', modifiers: [{ kind: 'drain', on: 'boss', value: 0.5 }] },
  { id: 'arnaque-du-siecle', name: 'Arnaque du siècle', legendaryOnly: true, description: "+60 % de prime de fin d'Étage et +30 % de gains hors-ligne pour l'Équipe.", modifiers: [{ kind: 'floorBonus', value: 0.6 }, { kind: 'offline', value: 0.3 }] },
  { id: 'gentleman-cambrioleur', name: 'Gentleman cambrioleur', legendaryOnly: true, description: "+30 % de Flair, +30 % de prime de fin d'Étage.", modifiers: [pct('flair', 0.3), { kind: 'floorBonus', value: 0.3 }] },
  { id: 'mille-visages', name: 'Mille visages', legendaryOnly: true, description: '+40 % de Discrétion, −40 % du supplément des Boss.', modifiers: [pct('stealth', 0.4), { kind: 'bossPressure', value: -0.4 }] },
  { id: 'neuf-vies', name: 'Neuf vies', legendaryOnly: true, description: "−40 % de dégâts pendant les 10 premières secondes, +15 % de Couverture maximale pour l'Équipe.", modifiers: [{ kind: 'earlyShield', ticks: 20, value: 0.4 }, { kind: 'coverMax', value: 0.15 }] },
];

export const TRAITS_BY_ID: ReadonlyMap<string, TraitDef> = new Map(TRAITS.map((trait) => [trait.id, trait]));
