// =====================================================================
// NOMS DES CASINOS ET TITRES DES BOSS (voir docs/charte-des-noms.md)
//
// Les Casinos 1 à 3 sont écrits à la main. Les suivants sont assemblés à
// partir des listes ci-dessous ; le même numéro donne toujours le même nom.
// Le prestige monte par paliers (TIERS) : Tripot au début, Palace bien plus loin.
//
// Pour ajouter un mot : copie une ligne de la bonne liste.
//   - `gender` : 'm' ou 'f' ; `elide: true` si le mot commence par une voyelle (L'…).
//   - Les Couleurs ont une forme masculine et féminine (accordée à l'Emblème).
//   - Les Lieux s'écrivent déjà avec leur « de » (des Quais, du Phare, de la Jetée).
// =====================================================================
import type { Gendered } from './nicknames';

export type Ambiance = 'docks' | 'neon' | 'velvet' | 'gold';

export interface Noun {
  word: string;
  gender: 'm' | 'f';
  elide?: boolean;
}

export interface CasinoTier {
  /** Dernier numéro de Casino de ce palier (Infinity pour le dernier). */
  upToCasino: number;
  types: Noun[];
  ambiances: Ambiance[];
  /** Titres du Boss du 5e Étage et du 10e Étage de chaque Casino. */
  bossTitles: { mid: Gendered[]; final: Gendered[] };
}

export const CASINO_TIERS: CasinoTier[] = [
  {
    // Étages 1 à 100
    upToCasino: 10,
    types: [
      { word: 'Tripot', gender: 'm' },
      { word: 'Arrière-salle', gender: 'f', elide: true },
      { word: 'Cercle', gender: 'm' },
      { word: 'Bouge', gender: 'm' },
      { word: 'Estaminet', gender: 'm', elide: true },
    ],
    ambiances: ['docks', 'neon'],
    bossTitles: {
      mid: [
        { m: 'Le Videur', f: 'La Videuse' },
        { m: 'Le Cogneur', f: 'La Cogneuse' },
      ],
      final: [
        { m: 'Le Patron', f: 'La Patronne' },
        { m: 'Le Tenancier', f: 'La Tenancière' },
      ],
    },
  },
  {
    // Étages 101 à 500
    upToCasino: 50,
    types: [
      { word: 'Club', gender: 'm' },
      { word: 'Casino', gender: 'm' },
      { word: 'Salon', gender: 'm' },
      { word: 'Cercle Privé', gender: 'm' },
      { word: 'Maison de Jeu', gender: 'f' },
    ],
    ambiances: ['neon', 'velvet'],
    bossTitles: {
      mid: [
        { m: 'Le Chef de salle', f: 'La Cheffe de salle' },
        { m: "L'Inspecteur", f: "L'Inspectrice" },
      ],
      final: [
        { m: 'Le Directeur', f: 'La Directrice' },
        { m: 'Le Banquier', f: 'La Banquière' },
      ],
    },
  },
  {
    // Étages 501 à 2 000
    upToCasino: 200,
    types: [
      { word: 'Palace', gender: 'm' },
      { word: 'Grand Casino', gender: 'm' },
      { word: 'Grand Cercle', gender: 'm' },
      { word: 'Rotonde', gender: 'f' },
    ],
    ambiances: ['velvet', 'gold'],
    bossTitles: {
      mid: [
        { m: 'Le Baron', f: 'La Baronne' },
        { m: "L'Intendant", f: "L'Intendante" },
      ],
      final: [
        { m: 'Le Parrain', f: 'La Marraine' },
        { m: 'Le Comte', f: 'La Comtesse' },
      ],
    },
  },
  {
    // Au-delà : noms quasi mythiques
    upToCasino: Number.POSITIVE_INFINITY,
    types: [
      { word: 'Palais', gender: 'm' },
      { word: 'Temple', gender: 'm' },
      { word: 'Grand Palace', gender: 'm' },
      { word: 'Sanctuaire', gender: 'm' },
      { word: 'Olympe', gender: 'm', elide: true },
    ],
    ambiances: ['gold'],
    bossTitles: {
      mid: [
        { m: "L'Éminence", f: "L'Éminence" },
        { m: 'Le Commandeur', f: 'La Commandeuse' },
      ],
      final: [
        { m: 'Le Grand Parrain', f: 'La Grande Marraine' },
        { m: 'Le Doge', f: 'La Dogaresse' },
      ],
    },
  },
];

export const EMBLEMS: Noun[] = [
  { word: 'Lotus', gender: 'm' },
  { word: 'Lion', gender: 'm' },
  { word: 'Comète', gender: 'f' },
  { word: 'Hippocampe', gender: 'm', elide: true },
  { word: 'Éclipse', gender: 'f', elide: true },
  { word: 'Orchidée', gender: 'f', elide: true },
  { word: 'Panthère', gender: 'f' },
  { word: 'Cygne', gender: 'm' },
  { word: 'Scarabée', gender: 'm' },
  { word: 'Sirène', gender: 'f' },
  { word: 'Corbeau', gender: 'm' },
  { word: 'Méduse', gender: 'f' },
  { word: 'Faucon', gender: 'm' },
  { word: 'Rose', gender: 'f' },
  { word: 'Licorne', gender: 'f' },
  { word: 'Salamandre', gender: 'f' },
  { word: 'Dragon', gender: 'm' },
  { word: 'Paon', gender: 'm' },
  { word: 'Phalène', gender: 'f' },
  { word: 'Serpent', gender: 'm' },
];

export const COLORS: Gendered[] = [
  { m: 'Pourpre', f: 'Pourpre' },
  { m: 'Doré', f: 'Dorée' },
  { m: 'Noir', f: 'Noire' },
  { m: "d'Ivoire", f: "d'Ivoire" },
  { m: 'de Jade', f: 'de Jade' },
  { m: 'Écarlate', f: 'Écarlate' },
  { m: "d'Argent", f: "d'Argent" },
  { m: 'Céleste', f: 'Céleste' },
  { m: 'Ardent', f: 'Ardente' },
  { m: 'de Velours', f: 'de Velours' },
  { m: 'Endormi', f: 'Endormie' },
  { m: 'Fauve', f: 'Fauve' },
  { m: "d'Opale", f: "d'Opale" },
  { m: 'Bleu Nuit', f: 'Bleu Nuit' },
];

/** Lieux de Port-Sauvage, déjà écrits avec leur « de ». */
export const PLACES: string[] = [
  'des Quais',
  'du Vieux-Port',
  'de la Corniche',
  'des Docks',
  'du Phare',
  'de la Jetée',
  'des Remparts',
  'du Belvédère',
  'de la Criée',
  'des Salines',
  'du Cap Noir',
  'de la Marina',
  'des Pins',
  "de l'Arsenal",
  'des Halles',
  'de la Pointe',
  'du Môle',
];

/** Clins d'œil : environ 1 Casino généré sur 100. */
export const CASINO_WINKS: string[] = ['Le Cercle des Pokers Disparus', 'Le Caesar’s Salade', 'Las Végétas'];

/** Les trois premiers Casinos, écrits à la main (document de conception). */
export const HANDMADE_CASINOS: { name: string; ambiance: Ambiance }[] = [
  { name: 'Le Tripot des Docks', ambiance: 'docks' },
  { name: 'Le Mirage Doré', ambiance: 'neon' },
  { name: 'Le Palace Impérial', ambiance: 'gold' },
];

/** Titres des six premiers Boss, écrits à la main (Étages 5 à 30). */
export const HANDMADE_BOSS_TITLES: { title: string; gender: 'm' | 'f' }[] = [
  { title: 'Le Videur', gender: 'm' },
  { title: 'Le Patron', gender: 'm' },
  { title: 'Le Chef de salle', gender: 'm' },
  { title: 'La Banquière', gender: 'f' },
  { title: "L'Inspecteur", gender: 'm' },
  { title: 'Le Directeur', gender: 'm' },
];
