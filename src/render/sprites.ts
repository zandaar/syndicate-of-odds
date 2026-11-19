// =====================================================================
// PIXEL ART — palette et sprites, dessinés en caractères (aucune image externe).
//
// Chaque sprite est une liste de lignes de même largeur. Chaque caractère est
// une couleur de PALETTE ; « . » est transparent.
// Pour retoucher un dessin : change les caractères, puis lance `npm test`
// (le test vérifie que les lignes ont la même largeur et que les couleurs existent).
// =====================================================================
import type { ClassId } from '../engine/types';

export const PALETTE: Record<string, string> = {
  k: '#0b0a0f', // noir
  d: '#1f1b26', // sombre
  g: '#3a3640', // gris
  G: '#6b6570', // gris clair
  w: '#e8e2d4', // blanc cassé
  s: '#d9a77a', // peau
  S: '#a8784f', // peau à l'ombre
  h: '#4a2e1f', // cheveux bruns
  r: '#b3262e', // rouge
  R: '#6b1b2a', // bordeaux
  y: '#d4a64a', // or
  Y: '#f2d27a', // or brillant
  e: '#0f5132', // tapis vert
  E: '#1b7a4c', // tapis vert clair
  b: '#2b4a7a', // bleu
  p: '#5a2a6b', // violet
  n: '#ff3fa4', // néon rose
  c: '#3fd6ff', // néon cyan
  o: '#5c3a21', // bois
  O: '#8a5a33', // bois clair
};

export type Sprite = readonly string[];

/** Bustes des 6 Classes, assis à la Table (8 × 10). */
export const CLASS_SPRITES: Record<ClassId, Sprite> = {
  // Flambeur : cravate rouge et cigare.
  gambler: ['..hhhh..', '.hhhhhh.', '.hssssh.', '.skssks.', '.sssssoY', '..ssss..', '.kwrrwk.', 'kkkrrkkk', 'kkkrrkkk', 'kkkkkkkk'],
  // Bluffeur : lunettes noires.
  bluffer: ['..hhhh..', '.hhhhhh.', '.hssssh.', '.kkkkkk.', '.ssssss.', '..sSSs..', '.gwwwwg.', 'ggwkkwgg', 'gggkkggg', 'gggggggg'],
  // Cerveau : binocles dorés et carnet.
  mastermind: ['..GGGG..', '.GGGGGG.', '.GssssG.', '.ywsywss', '.ssssss.', '..ssss..', '.bwwwwb.', 'bbbwwbbb', 'bOOObbbb', 'bbbbbbbb'],
  // Compteur de cartes : visière verte.
  counter: ['........', '.EEEEEE.', 'EEEEEEEE', '.skssks.', '.ssssss.', '..ssss..', '.pwwwwp.', 'ppwkkwpp', 'pppkkppp', 'pppppppp'],
  // Pickpocket : casquette gavroche.
  pickpocket: ['..oooo..', '.oooooo.', 'oOOOOOOo', '.skssks.', '.ssssss.', '..ssss..', '.OwwwwO.', 'OOwkkwOO', 'OOOOOOOO', 'OOOOOOOO'],
  // Saboteur : bonnet et gants.
  saboteur: ['..kkkk..', '.kkkkkk.', '.kkkkkk.', '.skssks.', '.ssssss.', '..ssss..', '.dddddd.', 'dddddddd', 'gddddddg', 'dddddddd'],
};

/** Vigile debout (8 × 14). */
export const GUARD: Sprite = [
  '..kkkk..',
  '..ssss..',
  '..kkkk..',
  '..ssss..',
  '...ss...',
  '.kkkkkk.',
  'kkkwwkkk',
  'kkkwwkkk',
  'kkkkkkkk',
  '.kkkkkk.',
  '.kk..kk.',
  '.kk..kk.',
  '.kk..kk.',
  '.gg..gg.',
];

/** Boss assis en face (8 × 11). */
export const BOSS: Sprite = ['..kkkk..', '.kkkkkk.', 'kkkkkkkk', '.ssssss.', '.skssks.', '.sssssoY', '..ssss..', '.RwwwwR.', 'RRwyyRRR', 'RRRyyRRR', 'RRRRRRRR'];

/** Caméra de surveillance (4 × 3). */
export const CAMERA: Sprite = ['gggg', 'gcGg', '.gg.'];

/** Jeton (2 × 2). */
export const CHIP: Sprite = ['yY', 'Yy'];

/** Lampe suspendue (3 × 3). */
export const LAMP: Sprite = ['.y.', 'yYy', '.Y.'];

/** Machine à sous (6 × 9). */
export const SLOT_MACHINE: Sprite = ['.nnnn.', 'nkkkkn', 'nkYkYn', 'nkkkkn', 'nnnnnn', 'nggggn', 'nggggn', 'nggggn', 'nnnnnn'];

/** Lustre doré (9 × 4). */
export const CHANDELIER: Sprite = ['....y....', '..yyyyy..', '.yYyYyYy.', 'Y.Y.Y.Y.Y'];

export const ALL_SPRITES: Record<string, Sprite> = {
  ...Object.fromEntries(Object.entries(CLASS_SPRITES).map(([id, sprite]) => [`classe ${id}`, sprite])),
  vigile: GUARD,
  boss: BOSS,
  caméra: CAMERA,
  jeton: CHIP,
  lampe: LAMP,
  'machine à sous': SLOT_MACHINE,
  lustre: CHANDELIER,
};
