// Chargement, export et import des sauvegardes, avec les gains du retour d'absence.
import { applyOffline, type GameState, type OfflineResult } from '../engine/game';
import { migrateSave, type LoadError } from './migrations';
import { fromBase64, parseSave, serializeGame, toBase64 } from './saveFormat';

export type LoadResult = { ok: true; state: GameState; offline: OfflineResult | null } | { ok: false; error: LoadError };

/** En dessous de cette absence (en secondes), on ne montre pas de fenêtre de retour. */
export const MIN_OFFLINE_SECONDS = 60;

/**
 * Charge une sauvegarde (texte JSON) et applique les gains de l'absence depuis `lastSavedAt`.
 * Une sauvegarde abîmée ou d'une version future est refusée : la partie en cours n'est pas touchée.
 */
export function loadGame(text: string, now: number): LoadResult {
  let raw: unknown;
  try {
    raw = parseSave(text);
  } catch {
    return { ok: false, error: 'invalid' };
  }
  const migrated = migrateSave(raw);
  if (!migrated.ok) return migrated;

  const elapsedSeconds = (now - migrated.save.lastSavedAt) / 1000;
  // Une horloge qui recule ne donne rien (et ne retire rien).
  if (elapsedSeconds < MIN_OFFLINE_SECONDS) return { ok: true, state: migrated.save.game, offline: null };
  const offline = applyOffline(migrated.save.game, elapsedSeconds);
  return { ok: true, state: offline.state, offline };
}

/** Code à copier-coller pour transférer sa partie. */
export function exportCode(state: GameState, now: number): string {
  return toBase64(serializeGame(state, now));
}

/** Charge un code copié-collé (Base64) ou le contenu d'un fichier .json. */
export function importSave(input: string, now: number): LoadResult {
  const trimmed = input.trim();
  if (trimmed.startsWith('{')) return loadGame(trimmed, now);
  try {
    return loadGame(fromBase64(trimmed), now);
  } catch {
    return { ok: false, error: 'invalid' };
  }
}
