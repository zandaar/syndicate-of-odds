// Affichage des grands nombres : 1,5K · 12,3M · 4B · 7T · 1aa · 3ab… puis notation scientifique.
import { D, type Decimal, type DecimalSource } from './bignum';

const NAMED = ['', 'K', 'M', 'B', 'T'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
/** Nombre de groupes de 3 chiffres qui ont un suffixe (K… T, puis aa… zz). */
const SUFFIX_GROUPS = NAMED.length + LETTERS.length * LETTERS.length;

function suffixFor(group: number): string {
  if (group < NAMED.length) return NAMED[group]!;
  const index = group - NAMED.length;
  return LETTERS[Math.floor(index / LETTERS.length)]! + LETTERS[index % LETTERS.length]!;
}

/** Tronque à 3 chiffres significatifs et écrit avec une virgule. */
function mantissaText(value: number): string {
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  const factor = 10 ** decimals;
  const truncated = Math.floor(value * factor + 1e-9) / factor;
  return String(truncated).replace('.', ',');
}

export interface FormatOptions {
  scientific?: boolean;
}

export function formatNumber(source: DecimalSource, options: FormatOptions = {}): string {
  const value: Decimal = D(source);
  if (value.lt(1000)) return String(Math.floor(Math.max(0, value.toNumber())));

  const exponent = value.log10().floor().toNumber();
  const group = Math.floor(exponent / 3);

  if (options.scientific || group >= SUFFIX_GROUPS) {
    const mantissa = value.div(D(10).pow(exponent)).toNumber();
    return `${mantissaText(mantissa)}e${exponent}`;
  }
  const mantissa = value.div(D(10).pow(group * 3)).toNumber();
  return `${mantissaText(mantissa)}${suffixFor(group)}`;
}
