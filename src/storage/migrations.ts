// Migrations de sauvegarde : mettent à jour les anciennes sauvegardes, sans jamais perdre la partie.
//
// Pour faire évoluer le format :
//   1. incrémente CURRENT_SAVE_VERSION dans saveFormat.ts ;
//   2. ajoute ici une étape `n: (game) => …` qui transforme une sauvegarde de version n en version n + 1 ;
//   3. ajoute un test dans save.test.ts avec une vraie sauvegarde de l'ancienne version.
import { BUILDING_IDS } from '../data/buildings';
import { CLASSES } from '../data/classes';
import { NETWORK_IDS } from '../data/network';
import { D } from '../engine/bignum';
import type { GameState } from '../engine/game';
import { CURRENT_SAVE_VERSION, type SaveData } from './saveFormat';

type RawGame = Record<string, unknown>;

/**
 * Étapes de migration, de la version n vers n + 1.
 * Version 0 : premières parties de test, avant la Maîtrise, les Gadgets en Cash et les Bâtiments.
 */
const STEPS: Record<number, (game: RawGame) => RawGame> = {
  0: (game) => ({
    ...game,
    mastery: game.mastery ?? Object.fromEntries(Object.keys(CLASSES).map((id) => [id, D(0)])),
    items: game.items ?? {},
    buildings: game.buildings ?? Object.fromEntries(BUILDING_IDS.map((id) => [id, 0])),
    roster: Array.isArray(game.roster)
      ? game.roster.map((p: Record<string, unknown>) => ({
          reputation: D(0),
          talents: {},
          bonusTalentPoints: 0,
          ...p,
        }))
      : game.roster,
  }),

  // Version 1 → 2 : Influence, Réseau, Succès et compteurs à vie (étape 7).
  1: (game) => {
    const { stats, ...rest } = game as RawGame & { stats?: { jackpots?: number } };
    const roster = Array.isArray(game.roster) ? (game.roster as { rarity?: string; name?: string }[]) : [];
    return {
      ...rest,
      influence: 0,
      network: Object.fromEntries(NETWORK_IDS.map((id) => [id, 0])),
      achievements: {},
      lifetime: {
        jackpots: stats?.jackpots ?? 0,
        cash: D(0),
        bestFloor: typeof game.highestCleared === 'number' ? game.highestCleared : 0,
        launderings: 0,
        recruitedRare: roster.some((p) => p.rarity && p.rarity !== 'common'),
        recruitedEpic: roster.some((p) => p.rarity === 'epic' || p.rarity === 'legendary'),
        legendaries: roster.filter((p) => p.rarity === 'legendary').map((p) => p.name ?? ''),
      },
    };
  },
};

export type LoadError = 'invalid' | 'future-version';

function looksLikeGame(game: unknown): game is GameState {
  if (!game || typeof game !== 'object') return false;
  const g = game as Record<string, unknown>;
  return (
    Array.isArray(g.roster) &&
    g.roster.length > 0 &&
    Array.isArray(g.teams) &&
    g.teams.length === 2 &&
    typeof g.highestCleared === 'number' &&
    typeof g.vip === 'number' &&
    g.cash !== undefined &&
    typeof g.office === 'object' &&
    typeof g.mastery === 'object' &&
    typeof g.items === 'object' &&
    typeof g.buildings === 'object' &&
    typeof g.influence === 'number' &&
    typeof g.network === 'object' &&
    typeof g.achievements === 'object' &&
    typeof g.lifetime === 'object'
  );
}

/** Vérifie et met à jour une sauvegarde brute. */
export function migrateSave(raw: unknown): { ok: true; save: SaveData & { game: GameState } } | { ok: false; error: LoadError } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'invalid' };
  const data = raw as Partial<SaveData>;
  const version = typeof data.saveVersion === 'number' ? data.saveVersion : 0;
  if (version > CURRENT_SAVE_VERSION) return { ok: false, error: 'future-version' };
  if (!data.game || typeof data.game !== 'object') return { ok: false, error: 'invalid' };

  let game = data.game as RawGame;
  for (let v = version; v < CURRENT_SAVE_VERSION; v++) {
    const step = STEPS[v];
    if (!step) return { ok: false, error: 'invalid' };
    game = step(game);
  }
  if (!looksLikeGame(game)) return { ok: false, error: 'invalid' };

  return {
    ok: true,
    save: {
      saveVersion: CURRENT_SAVE_VERSION,
      lastSavedAt: typeof data.lastSavedAt === 'number' ? data.lastSavedAt : Date.now(),
      prestigeLevel: typeof data.prestigeLevel === 'number' ? data.prestigeLevel : 0,
      game,
    },
  };
}
