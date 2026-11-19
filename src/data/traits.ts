// =====================================================================
// TRAITS DES JOUEURS
//
// Un Trait est tiré au recrutement. Beaucoup sont à double tranchant.
// Pour en ajouter un : copie un bloc, change son `id` (unique), son nom
// (voir docs/charte-des-noms.md) et ses effets.
// `legendaryOnly` : réservé aux Joueurs Légendaires.
// =====================================================================
import type { Modifier } from '../engine/types';

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  modifiers: Modifier[];
  legendaryOnly?: boolean;
}

export const TRAITS: TraitDef[] = [
  {
    id: 'tete-brulee',
    name: 'Tête brûlée',
    description: '+20 % de Flair, −15 % de Sang-froid.',
    modifiers: [
      { kind: 'statPercent', stat: 'flair', value: 0.2 },
      { kind: 'statPercent', stat: 'composure', value: -0.15 },
    ],
  },
  {
    id: 'sang-de-glace',
    name: 'Sang de glace',
    description: '+25 % de Sang-froid.',
    modifiers: [{ kind: 'statPercent', stat: 'composure', value: 0.25 }],
  },
  {
    id: 'superstitieux',
    name: 'Superstitieux',
    description: '+8 % de Chance, −10 % de Flair.',
    modifiers: [
      { kind: 'statFlat', stat: 'luck', value: 8 },
      { kind: 'statPercent', stat: 'flair', value: -0.1 },
    ],
  },
  {
    id: 'leve-tot',
    name: 'Lève-tôt',
    description: "+15 % de gains hors-ligne pour l'Équipe.",
    modifiers: [{ kind: 'offline', value: 0.15 }],
  },
];

export const TRAITS_BY_ID: ReadonlyMap<string, TraitDef> = new Map(TRAITS.map((trait) => [trait.id, trait]));
