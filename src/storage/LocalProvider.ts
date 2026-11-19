// Sauvegarde dans la mémoire du navigateur (localStorage) : gratuite, sans limite de fréquence.
import type { SaveProvider } from './SaveProvider';

export const SAVE_KEY = 'syndicate-of-odds-save';

/** Ce dont le connecteur a besoin : localStorage, ou une fausse mémoire dans les tests. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Le localStorage du navigateur, ou null s'il est bloqué (navigation privée, réglages). */
export function browserStore(): KeyValueStore | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Lecture immédiate (sans attendre), pour charger la partie dès l'ouverture de la page. */
export function readSaveNow(store: KeyValueStore | null): string | null {
  try {
    return store?.getItem(SAVE_KEY) ?? null;
  } catch {
    return null;
  }
}

export class LocalProvider implements SaveProvider {
  constructor(private readonly store: KeyValueStore) {}

  async load(): Promise<string | null> {
    try {
      return this.store.getItem(SAVE_KEY);
    } catch {
      return null;
    }
  }

  async save(text: string): Promise<void> {
    this.store.setItem(SAVE_KEY, text);
  }

  async clear(): Promise<void> {
    this.store.removeItem(SAVE_KEY);
  }
}
