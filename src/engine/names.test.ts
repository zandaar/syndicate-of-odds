import { describe, expect, it } from 'vitest';
import { CASINO_TIERS, CASINO_WINKS } from '../data/names/casinos';
import { getBoss, getCasino } from './names';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('getCasino — le nom d’un Casino', () => {
  it('les trois premiers Casinos sont ceux écrits à la main', () => {
    expect([1, 2, 3].map((n) => getCasino(n).name)).toEqual(['Le Tripot des Docks', 'Le Mirage Doré', 'Le Palace Impérial']);
  });

  it('un même numéro donne toujours le même Casino', () => {
    expect(getCasino(42)).toEqual(getCasino(42));
  });

  it('le prestige monte par paliers : Tripots jusqu’à l’Étage 100, puis Clubs, Palaces, noms mythiques', () => {
    expect([10, 11, 50, 51, 200, 201].map((n) => getCasino(n).tier)).toEqual([0, 1, 1, 2, 2, 3]);
  });

  it("un Casino des premiers Étages n'a jamais un nom de grand établissement, et inversement", () => {
    for (const n of range(4, 10)) expect(getCasino(n).name).not.toMatch(/Palace|Palais|Casino|Club|Temple/);
    for (const n of range(201, 400)) expect(getCasino(n).name).not.toMatch(/Tripot|Bouge|Estaminet|Arrière-salle/);
  });

  it('les noms sont variés', () => {
    expect(new Set(range(4, 200).map((n) => getCasino(n).name)).size).toBeGreaterThan(150);
  });

  it('aucun nom ne dépasse 32 caractères, même très loin', () => {
    for (const n of range(1, 5000)) expect(getCasino(n).name.length, getCasino(n).name).toBeLessThanOrEqual(32);
  });

  it("les Clins d'œil restent rares (environ 1 Casino sur 100)", () => {
    const winks = range(4, 5000).filter((n) => CASINO_WINKS.includes(getCasino(n).name)).length;
    expect(winks).toBeGreaterThan(10);
    expect(winks).toBeLessThan(150);
  });
});

describe('getBoss — le Boss d’un Étage', () => {
  it('les six premiers Boss ont les titres du document de conception', () => {
    expect([5, 10, 15, 20, 25, 30].map((floor) => getBoss(floor).title)).toEqual([
      'Le Videur',
      'Le Patron',
      'Le Chef de salle',
      'La Banquière',
      "L'Inspecteur",
      'Le Directeur',
    ]);
    expect(getBoss(20).gender).toBe('f');
  });

  it('un même Étage donne toujours le même Boss', () => {
    expect(getBoss(55)).toEqual(getBoss(55));
  });

  it('le Titre monte en grade avec la profondeur', () => {
    const titlesOf = (tier: number, kind: 'mid' | 'final') =>
      CASINO_TIERS[tier]!.bossTitles[kind].flatMap((title) => [title.m, title.f]);
    expect(titlesOf(0, 'mid')).toContain(getBoss(35).title);
    expect(titlesOf(2, 'mid')).toContain(getBoss(1005).title);
    expect(titlesOf(3, 'final')).toContain(getBoss(5000).title);
  });

  it("un Étage normal n'a pas de Boss", () => {
    expect(() => getBoss(7)).toThrow();
  });

  it('les Titres et les noms des Boss tiennent dans la longueur permise', () => {
    for (let floor = 5; floor <= 5000; floor += 5) {
      const boss = getBoss(floor);
      expect(boss.title.length, boss.title).toBeLessThanOrEqual(20);
      expect(boss.name.length, boss.name).toBeLessThanOrEqual(28);
    }
  });
});
