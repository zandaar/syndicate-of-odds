import { describe, expect, it } from 'vitest';
import { D } from './bignum';
import { formatNumber } from './format';

describe('formatNumber — les nombres affichés dans le jeu', () => {
  it('les petits nombres sont affichés sans décimales', () => {
    expect(formatNumber(D(0))).toBe('0');
    expect(formatNumber(D(78.6))).toBe('78');
    expect(formatNumber(D(999))).toBe('999');
  });

  it('au-delà de 1 000 : 3 chiffres significatifs, virgule française et suffixe', () => {
    expect(formatNumber(D(1500))).toBe('1,5K');
    expect(formatNumber(D(12_345))).toBe('12,3K');
    expect(formatNumber(D(1.15e6))).toBe('1,15M');
    expect(formatNumber(D(2.5e9))).toBe('2,5B');
    expect(formatNumber(D(1e12))).toBe('1T');
  });

  it("on tronque au lieu d'arrondir : 999 999 reste 999K", () => {
    expect(formatNumber(D(999_999))).toBe('999K');
  });

  it('après T viennent les lettres : aa, ab… puis ba', () => {
    expect(formatNumber(D(1e15))).toBe('1aa');
    expect(formatNumber(D(3e18))).toBe('3ab');
    expect(formatNumber(D(1e93))).toBe('1ba');
  });

  it('les nombres gigantesques passent en notation scientifique', () => {
    expect(formatNumber(D('1.5e5000'))).toBe('1,5e5000');
  });

  it('l’option notation scientifique s’applique dès 1 000', () => {
    expect(formatNumber(D(1500), { scientific: true })).toBe('1,5e3');
    expect(formatNumber(D(78), { scientific: true })).toBe('78');
  });
});
