import { describe, expect, it } from 'vitest';
import { getFloor } from './floors';

describe('getFloor — chaque Étage se déduit de son numéro', () => {
  it("l'Étage 1 est un Étage normal du premier Casino", () => {
    const floor = getFloor(1);
    expect(floor).toMatchObject({ casino: 1, floorInCasino: 1, isBoss: false, vipReward: 0, bossPressureExtra: 0 });
    expect(floor.vault.toNumber()).toBe(60);
    expect(floor.pressure.toNumber()).toBe(4);
  });

  it("l'Étage 5 est un Boss : Caisse ×3, Pression ×1,8 et 2 Jetons VIP", () => {
    const floor = getFloor(5);
    expect(floor.isBoss).toBe(true);
    expect(floor.vault.toNumber()).toBeCloseTo(337.2997, 3);
    expect(floor.pressure.toNumber()).toBeCloseTo(13.036603, 5);
    expect(floor.bossPressureExtra).toBeCloseTo(0.8, 10);
    expect(floor.vipReward).toBe(2);
  });

  it('un Casino compte 10 Étages : le 11e ouvre le Casino 2', () => {
    expect(getFloor(10)).toMatchObject({ casino: 1, floorInCasino: 10, isBoss: true });
    expect(getFloor(11)).toMatchObject({ casino: 2, floorInCasino: 1, isBoss: false });
  });

  it('les Boss rapportent de plus en plus de Jetons VIP (7 au 10e Boss)', () => {
    expect(getFloor(50).vipReward).toBe(7);
  });

  it('les Étages très lointains dépassent la limite des nombres JavaScript sans casser', () => {
    const vault = getFloor(10_000).vault;
    expect(vault.gt(1e308)).toBe(true);
    expect(Number.isFinite(vault.log10().toNumber())).toBe(true);
  });

  it("refuse un numéro d'Étage invalide", () => {
    expect(() => getFloor(0)).toThrow();
    expect(() => getFloor(2.5)).toThrow();
  });
});
