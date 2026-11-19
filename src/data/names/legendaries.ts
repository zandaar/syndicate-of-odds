// =====================================================================
// LÉGENDAIRES — liste fermée, écrite à la main (voir docs/charte-des-noms.md)
//
// Chaque Légendaire a un nom unique, une Classe et un Trait unique
// (défini dans src/data/traits.ts avec `legendaryOnly: true`).
// Un même Légendaire ne peut pas être deux fois dans le roster.
// Pour en ajouter un : copie un bloc, invente son Trait unique dans traits.ts.
// =====================================================================
import type { ClassId } from '../../engine/types';

export interface LegendaryDef {
  id: string;
  name: string;
  classId: ClassId;
  gender: 'm' | 'f';
  uniqueTraitId: string;
}

export const LEGENDARIES: LegendaryDef[] = [
  { id: 'veuve-noire', name: '« La Veuve Noire » Delacroix', classId: 'gambler', gender: 'f', uniqueTraitId: 'rien-ne-va-plus' },
  { id: 'roi-de-pique', name: '« Le Roi de Pique » Lancelin', classId: 'gambler', gender: 'm', uniqueTraitId: 'main-royale' },
  { id: 'ambassadeur', name: "« L'Ambassadeur » Whitmore", classId: 'bluffer', gender: 'm', uniqueTraitId: 'immunite-diplomatique' },
  { id: 'dame-de-glace', name: '« La Dame de Glace » Hartley', classId: 'bluffer', gender: 'f', uniqueTraitId: 'coeur-de-glace' },
  { id: 'comtesse', name: '« La Comtesse » Valmont', classId: 'mastermind', gender: 'f', uniqueTraitId: 'carnet-mondain' },
  { id: 'marionnettiste', name: '« Le Marionnettiste » Rossi', classId: 'mastermind', gender: 'm', uniqueTraitId: 'tire-les-ficelles' },
  { id: 'professeur', name: '« Le Professeur » Castellane', classId: 'counter', gender: 'm', uniqueTraitId: 'methode-castellane' },
  { id: 'mademoiselle-zero', name: '« Mademoiselle Zéro » Ashby', classId: 'counter', gender: 'f', uniqueTraitId: 'table-rase' },
  // Clin d'œil de référence de la charte.
  { id: 'marco-moula', name: 'Marco « La Moula » Moula', classId: 'pickpocket', gender: 'm', uniqueTraitId: 'arnaque-du-siecle' },
  { id: 'arsene-lapin', name: 'Arsène Lapin', classId: 'pickpocket', gender: 'm', uniqueTraitId: 'gentleman-cambrioleur' },
  { id: 'insaisissable', name: "« L'Insaisissable » Abagnolo", classId: 'saboteur', gender: 'm', uniqueTraitId: 'mille-visages' },
  { id: 'chat-noir', name: '« Le Chat Noir » Moreau', classId: 'saboteur', gender: 'f', uniqueTraitId: 'neuf-vies' },
];
