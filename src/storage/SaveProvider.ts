// Interface unique des sauvegardes (« connecteur »).
// Phase 1 : LocalProvider (mémoire du navigateur). Phase 2 : un CloudProvider (Firebase) prendra
// la même forme, sans rien changer au reste du jeu.

export interface SaveProvider {
  /** Texte de la dernière sauvegarde, ou null s'il n'y en a pas. */
  load(): Promise<string | null>;
  save(text: string): Promise<void>;
  clear(): Promise<void>;
}
