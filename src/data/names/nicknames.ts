// =====================================================================
// SURNOMS DES JOUEURS (voir docs/charte-des-noms.md)
//
// Un Joueur Rare reçoit un surnom de la liste `rare` de sa Classe, un
// Épique un surnom de la liste `epic`. Chaque surnom existe au masculin
// (`m`) et au féminin (`f`) ; s'il ne change pas, écris deux fois le même.
// Pour en ajouter un : copie une ligne { m: '…', f: '…' } dans la bonne liste.
//
// WINKS : les Clins d'œil, noms complets écrits à la main, très rares.
// EVENT_NICKNAMES : surnoms qui n'apparaissent que pendant un événement daté.
// =====================================================================
import type { ClassId } from '../../engine/types';

export interface Gendered {
  m: string;
  f: string;
}

const same = (word: string): Gendered => ({ m: word, f: word });

export const NICKNAMES: Record<ClassId, { rare: Gendered[]; epic: Gendered[] }> = {
  gambler: {
    rare: [
      { m: 'Le Brûleur', f: 'La Brûleuse' },
      same('Main-Chaude'),
      same('La Mèche'),
      { m: 'Le Téméraire', f: 'La Téméraire' },
      same('Tout-ou-Rien'),
      { m: 'Le Volcan', f: 'La Tornade' },
      same('Double-Six'),
      { m: 'Le Casse-Cou', f: 'La Casse-Cou' },
    ],
    epic: [
      same('Doigts-de-Feu'),
      { m: 'Le Roi du Tapis', f: 'La Reine du Tapis' },
      { m: 'Le Phénix', f: 'La Salamandre' },
      same('Sept-Fois-Sept'),
      { m: 'Le Magnifique', f: 'La Magnifique' },
    ],
  },
  bluffer: {
    rare: [
      same('Visage-de-Marbre'),
      same('Le Sphinx'),
      { m: 'Le Mur', f: 'La Muraille' },
      same("L'Impassible"),
      same('Bois-Dormant'),
      { m: 'Le Silencieux', f: 'La Silencieuse' },
      same('Cœur-de-Pierre'),
      { m: 'Le Taiseux', f: 'La Taiseuse' },
    ],
    epic: [
      { m: 'Le Roc', f: 'La Roche' },
      same("L'Iceberg"),
      { m: 'Le Bloc', f: 'La Banquise' },
      same('Jamais-Ciller'),
      { m: 'Le Grand Muet', f: 'La Grande Muette' },
    ],
  },
  mastermind: {
    rare: [
      { m: 'Le Stratège', f: 'La Stratège' },
      { m: 'Le Prof', f: 'La Prof' },
      same('Lunettes'),
      { m: 'Le Notaire', f: 'La Notaire' },
      { m: "L'Horloger", f: "L'Horlogère" },
      { m: 'Le Renard', f: 'La Renarde' },
      { m: "L'Ancien", f: "L'Ancienne" },
      same('Les Ficelles'),
    ],
    epic: [
      same("L'Éminence"),
      { m: 'Le Maestro', f: 'La Maestra' },
      same('Échec-et-Mat'),
      { m: 'Le Cardinal', f: 'La Cardinale' },
      same("L'Oracle"),
    ],
  },
  counter: {
    rare: [
      { m: 'Le Comptable', f: 'La Comptable' },
      { m: 'Le Calculateur', f: 'La Calculatrice' },
      same('Boulier'),
      same('La Mémoire'),
      same('Le Métronome'),
      { m: 'Le Patient', f: 'La Patiente' },
      same('Deux-et-Deux'),
      same('Le Scribe'),
    ],
    epic: [
      same('Cent-Coups'),
      same('La Machine'),
      same('Vingt-et-Un'),
      same("L'Abaque"),
      { m: 'Le Polytechnicien', f: 'La Polytechnicienne' },
    ],
  },
  pickpocket: {
    rare: [
      same('La Fouine'),
      same('Le Furet'),
      same('Doigts-de-Fée'),
      same("Courant-d'Air"),
      same('Pattes-de-Velours'),
      same('La Pie'),
      same('Main-Leste'),
      { m: 'Le Filou', f: 'La Filoute' },
    ],
    epic: [
      same("Doigts-d'Or"),
      { m: 'Le Magicien', f: 'La Magicienne' },
      same('Mille-Poches'),
      { m: "L'Élégant", f: "L'Élégante" },
      same('Sans-Trace'),
    ],
  },
  saboteur: {
    rare: [
      same('Le Fantôme'),
      same("L'Ombre"),
      same('Court-Jus'),
      { m: 'Le Plombier', f: 'La Plombière' },
      same('La Panne'),
      same('Grain-de-Sable'),
      { m: "L'Électricien", f: "L'Électricienne" },
      { m: 'Le Rat', f: 'La Souris' },
    ],
    epic: [
      same('Le Spectre'),
      same('Le Noir Total'),
      same("L'Invisible"),
      { m: 'Le Démolisseur', f: 'La Démolisseuse' },
      same('Minuit'),
    ],
  },
};

/** Un Clin d'œil : nom complet écrit à la main, réservé à une Classe et une Rareté. */
export interface Wink {
  rarity: 'rare' | 'epic';
  classId: ClassId;
  gender: 'm' | 'f';
  name: string;
}

export const WINKS: Wink[] = [
  { rarity: 'epic', classId: 'pickpocket', gender: 'm', name: 'Carlo « Pyramide » Ponzetti' },
  { rarity: 'rare', classId: 'bluffer', gender: 'm', name: 'Gaston « 49.3 » Béchard' },
  { rarity: 'rare', classId: 'bluffer', gender: 'm', name: 'Paul « Langue-de-Bois » Roux' },
  { rarity: 'rare', classId: 'gambler', gender: 'f', name: 'Edith « Sans-Regret » Piaffe' },
  { rarity: 'epic', classId: 'saboteur', gender: 'm', name: 'Alfred « Suspense » Hitchcoq' },
  { rarity: 'rare', classId: 'saboteur', gender: 'm', name: 'Jimmy « Double-Zéro » Bonde' },
  { rarity: 'epic', classId: 'gambler', gender: 'm', name: 'Bernard « Tapis » Tapiolo' },
];

export type EventId = 'april-fools' | 'halloween' | 'christmas';

/** Événements datés : mois (1 à 12) et jours inclus. */
export const EVENTS: Record<EventId, { month: number; fromDay: number; toDay: number; nicknames: Gendered[] }> = {
  'april-fools': {
    month: 4,
    fromDay: 1,
    toDay: 1,
    nicknames: [same("Poisson-d'Avril"), { m: 'Le Farceur', f: 'La Farceuse' }, same('Coucou')],
  },
  halloween: {
    month: 10,
    fromDay: 25,
    toDay: 31,
    nicknames: [
      { m: 'Le Revenant', f: 'La Revenante' },
      same('Le Vampire'),
      same('Le Croque-Mort'),
      same('Citrouille'),
    ],
  },
  christmas: {
    month: 12,
    fromDay: 20,
    toDay: 26,
    nicknames: [
      { m: 'Le Père Fouettard', f: 'La Mère Fouettard' },
      same('Sapin'),
      { m: 'Le Lutin', f: 'La Lutine' },
      same('Boule-de-Neige'),
    ],
  },
};
