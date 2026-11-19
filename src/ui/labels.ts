// Textes et couleurs de l'interface (tout ce qui s'affiche en français).
import { CLASSES } from '../data/classes';
import type { GameError } from '../engine/game';
import type { Player, Rarity } from '../engine/types';

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

/** Classes Tailwind de couleur par Rareté. */
export const RARITY_COLOR: Record<Rarity, string> = {
  common: 'text-stone-300 border-stone-600',
  rare: 'text-sky-300 border-sky-700',
  epic: 'text-violet-300 border-violet-700',
  legendary: 'text-gold border-gold',
};

export function className(player: Player): string {
  const def = CLASSES[player.classId];
  return player.gender === 'f' ? def.nameF : def.name;
}

export const ERROR_TEXT: Record<GameError, string> = {
  'not-enough-cash': 'Pas assez de Cash.',
  'roster-full': 'Le roster est plein (12 Joueurs).',
  'unknown-candidate': 'Ce Candidat est déjà parti.',
  'unknown-player': 'Ce Joueur a quitté le Syndicat.',
  'team-full': 'Cette Équipe compte déjà 3 Joueurs.',
  'team-locked': "L'Équipe 2 se débloque après l'Étage 10.",
  'last-player': 'Impossible de renvoyer ton dernier Joueur.',
  'not-enough-vip': 'Pas assez de Jetons VIP.',
  'unknown-talent': 'Ce Talent est inconnu.',
  'wrong-class': "Ce Talent n'est pas de cette Classe.",
  'no-points': 'Plus de point de Talent : gagne de la Réputation pour monter de niveau.',
  'max-rank': 'Ce Talent est déjà au rang maximal.',
  'locked-points': "Mets d'abord plus de points dans cette branche.",
  'locked-mastery': 'Talent ultime : il faut la Maîtrise de Classe 5.',
  'unknown-item': 'Ce Gadget est inconnu.',
  'already-owned': 'Tu possèdes déjà ce Gadget : améliore-le plutôt.',
  'not-owned': "Achète d'abord ce Gadget à la Boutique.",
  'unknown-building': 'Ce Bâtiment est inconnu.',
  'too-early': "Le Blanchiment se débloque à l'Étage 50.",
  'not-enough-influence': "Pas assez d'Influence.",
  'max-level': 'Déjà au niveau maximal.',
};
