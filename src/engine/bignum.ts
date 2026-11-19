// Grands nombres du jeu (voir docs/adr/0001-grands-nombres-break-eternity.md).
// Toute valeur d'argent ou de puissance qui peut grossir sans limite passe par Decimal.
import Decimal from 'break_eternity.js';

export { Decimal };

/** Valeur acceptée partout où le moteur attend un grand nombre. */
export type DecimalSource = Decimal | number | string;

/** Raccourci pour créer un grand nombre. */
export function D(value: DecimalSource): Decimal {
  return new Decimal(value);
}

export const ZERO = D(0);
