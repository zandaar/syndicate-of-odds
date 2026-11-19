import { describe, expect, it } from 'vitest';
import { startTeamRun } from './combat';
import { buildTeamProfile } from './economy';
import { computeOfflineGains } from './offline';
import { makePlayer } from './testing';
import type { Player } from './types';

const NO_BONUS = { cashMult: 1 };
const HOUR = 3600;

function teamAt(floor: number, players: Player[]) {
  const profile = buildTeamProfile(players, NO_BONUS);
  return { run: startTeamRun(floor, profile), profile };
}

describe("computeOfflineGains — ce que l'Équipe rapporte pendant l'absence", () => {
  it("un Flambeur qui vide l'Étage 1 en 2 secondes rapporte 39 $ par seconde", () => {
    const report = computeOfflineGains([teamAt(1, [makePlayer('gambler')])], HOUR);
    expect(report.seconds).toBe(HOUR);
    expect(report.cash.toNumber()).toBeCloseTo(140_400, 3);
  });

  it('les gains sont plafonnés à 12 heures', () => {
    const report = computeOfflineGains([teamAt(1, [makePlayer('gambler')])], 20 * HOUR);
    expect(report.seconds).toBe(12 * HOUR);
    expect(report.cash.toNumber()).toBeCloseTo(1_684_800, 2);
  });

  it("une Équipe qui se fait griller rapporte quand même le Cash qu'elle draine", () => {
    const report = computeOfflineGains([teamAt(20, [makePlayer('gambler')])], HOUR);
    expect(report.cash.toNumber()).toBeGreaterThan(0);
  });

  it('les bonus hors-ligne augmentent les gains (Lève-tôt : +15 %)', () => {
    const report = computeOfflineGains([teamAt(1, [makePlayer('gambler', { traitIds: ['leve-tot'] })])], HOUR);
    expect(report.cash.toNumber()).toBeCloseTo(161_460, 2);
  });

  it('les gains des deux Équipes s’additionnent', () => {
    const report = computeOfflineGains(
      [teamAt(1, [makePlayer('gambler')]), teamAt(1, [makePlayer('gambler')])],
      HOUR,
    );
    expect(report.perTeam.map((cash) => Math.round(cash.toNumber()))).toEqual([140_400, 140_400]);
    expect(report.cash.toNumber()).toBeCloseTo(280_800, 2);
  });

  it("une horloge qui recule ne donne rien (et ne retire rien)", () => {
    const report = computeOfflineGains([teamAt(1, [makePlayer('gambler')])], -500);
    expect(report.seconds).toBe(0);
    expect(report.cash.toNumber()).toBe(0);
  });
});
