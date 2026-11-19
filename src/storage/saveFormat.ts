// Format de sauvegarde : transforme une partie en texte (JSON) et inversement.
//
// Les grands nombres (Decimal) sont écrits sous forme de texte : { "$d": "1.5e400" }.
// Toute sauvegarde porte `saveVersion` et `lastSavedAt` (heure de la sauvegarde, en ms).
// Si la forme de la partie change un jour, on incrémente CURRENT_SAVE_VERSION et on ajoute
// une étape dans migrations.ts : les anciennes sauvegardes sont alors mises à jour au chargement.
import { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/game';

/** Version 2 : Influence, Réseau, Succès et compteurs à vie (étape 7). */
export const CURRENT_SAVE_VERSION = 2;

export interface SaveData {
  saveVersion: number;
  /** Heure de la sauvegarde, en millisecondes. */
  lastSavedAt: number;
  /** Nombre de Blanchiments (prévu pour l'étape 7). */
  prestigeLevel: number;
  game: unknown;
}

const DECIMAL_KEY = '$d';

/** Partie → texte JSON. */
export function serializeGame(state: GameState, now: number): string {
  const data: SaveData = { saveVersion: CURRENT_SAVE_VERSION, lastSavedAt: now, prestigeLevel: state.lifetime?.launderings ?? 0, game: state };
  return JSON.stringify(data, function replacer(this: Record<string, unknown>, key: string, value: unknown) {
    // `this[key]` est la valeur d'origine, avant que Decimal ne soit transformé par son propre toJSON.
    const original = this[key];
    return original instanceof Decimal ? { [DECIMAL_KEY]: original.toString() } : value;
  });
}

/** Texte JSON → objet brut (grands nombres reconstitués), sans vérification. */
export function parseSave(text: string): unknown {
  return JSON.parse(text, (_key, value: unknown) => {
    if (value && typeof value === 'object' && DECIMAL_KEY in value && Object.keys(value).length === 1) {
      return new Decimal((value as Record<string, string>)[DECIMAL_KEY]!);
    }
    return value;
  });
}

/** Texte → code Base64 (pour copier-coller la sauvegarde sur un autre appareil). */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Code Base64 → texte. Lève une erreur si le code est abîmé. */
export function fromBase64(code: string): string {
  const binary = atob(code.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
