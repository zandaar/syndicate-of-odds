import { describe, expect, it } from 'vitest';
import { startTeamRun, tickTeam, type TeamRun, type TickOutcome } from './combat';
import { buildTeamProfile, type TeamProfile } from './economy';
import { makePlayer } from './testing';
import type { Player } from './types';

const NO_BONUS = { cashMult: 1 };
const always = (value: number) => () => value;

function team(players: Player[]): TeamProfile {
  return buildTeamProfile(players, NO_BONUS);
}

/** Enchaîne des ticks et additionne le Cash et les Jetons VIP gagnés. */
function run(
  start: TeamRun,
  profile: TeamProfile,
  ticks: number,
  highestCleared = 0,
): { last: TickOutcome; cash: number; vip: number } {
  let current = start;
  let cash = 0;
  let vip = 0;
  let last: TickOutcome | undefined;
  for (let i = 0; i < ticks; i++) {
    last = tickTeam(current, profile, { highestCleared }, 'expected');
    current = last.run;
    cash += last.cash.toNumber();
    vip += last.vip;
  }
  if (!last) throw new Error('au moins un tick');
  return { last, cash, vip };
}

function tableOf(r: TeamRun) {
  if (r.phase.kind !== 'table') throw new Error('pas à la Table');
  return r.phase.table;
}

describe('tickTeam — un tick à la Table', () => {
  const gambler = team([makePlayer('gambler')]);

  it('le Flambeur draine la Caisse et le drainé devient du Cash (moyenne des Jackpots)', () => {
    const outcome = tickTeam(startTeamRun(1, gambler), gambler, { highestCleared: 0 }, 'expected');
    expect(outcome.cash.toNumber()).toBeCloseTo(16.52, 6);
    expect(tableOf(outcome.run).vault.toNumber()).toBeCloseTo(43.48, 6);
  });

  it('la sécurité entame la Couverture, atténuée par la Discrétion', () => {
    const outcome = tickTeam(startTeamRun(1, gambler), gambler, { highestCleared: 0 }, 'expected');
    expect(tableOf(outcome.run).cover.toNumber()).toBeCloseTo(56.363636, 5);
  });

  it("vider la Caisse valide l'Étage, verse la prime de 30 % et passe à l'Étage suivant en Auto", () => {
    const { last, cash } = run(startTeamRun(1, gambler), gambler, 4);
    expect(cash).toBeCloseTo(78, 6);
    expect(last.clearedFloor).toBe(1);
    expect(last.events).toContainEqual({ type: 'victory', floor: 1 });
    expect(last.run.floor).toBe(2);
  });

  it("sans Auto, l'Équipe rejoue le même Étage", () => {
    const { last } = run(startTeamRun(1, gambler, { auto: false }), gambler, 4);
    expect(last.run.floor).toBe(1);
    expect(tableOf(last.run).vault.toNumber()).toBe(60);
  });

  it('une Couverture grillée garde le Cash, replie l’Équipe 3 secondes puis relance le même Étage', () => {
    const start = startTeamRun(20, gambler);
    const burned = run(start, gambler, 200);
    expect(burned.cash).toBeGreaterThan(0);

    let current = start;
    let burnedAt = -1;
    for (let i = 0; i < 200 && burnedAt < 0; i++) {
      const outcome = tickTeam(current, gambler, { highestCleared: 0 }, 'expected');
      current = outcome.run;
      if (outcome.events.some((e) => e.type === 'burned')) burnedAt = i;
    }
    expect(current.phase).toEqual({ kind: 'retreat', ticksLeft: 6 });
    const afterRetreat = run(current, gambler, 6);
    expect(afterRetreat.last.run.floor).toBe(20);
    expect(afterRetreat.last.run.phase.kind).toBe('table');
  });

  it("avec le repli sécurisé, l'Équipe recule d'un Étage après une Couverture grillée", () => {
    const { last } = run(startTeamRun(20, gambler, { safeRetreat: true }), gambler, 200);
    expect(last.run.floor).toBeLessThan(20);
  });

  it("un Boss donne ses Jetons VIP au premier passage seulement", () => {
    const strong = team([makePlayer('gambler', { level: 45 })]);
    expect(run(startTeamRun(5, strong), strong, 1, 4).vip).toBe(2);
    expect(run(startTeamRun(5, strong), strong, 1, 5).vip).toBe(0);
  });

  it('le Saboteur réduit fortement la Pression d’un Boss', () => {
    const saboteur = team([makePlayer('saboteur')]);
    const outcome = tickTeam(startTeamRun(5, saboteur), saboteur, { highestCleared: 0 }, 'expected');
    expect(100 - tableOf(outcome.run).cover.toNumber()).toBeCloseTo(8.2386, 3);
  });
});

describe('tickTeam — hasard et effets spéciaux', () => {
  it('en mode aléatoire, un tirage chanceux déclenche un Jackpot ×2,5 pour le Flambeur', () => {
    const gambler = team([makePlayer('gambler', { id: 'sam' })]);
    const lucky = tickTeam(startTeamRun(1, gambler), gambler, { highestCleared: 0 }, always(0));
    expect(lucky.cash.toNumber()).toBe(35);
    expect(lucky.events).toContainEqual({ type: 'jackpot', playerId: 'sam', amount: expect.anything() });
    const unlucky = tickTeam(startTeamRun(1, gambler), gambler, { highestCleared: 0 }, always(0.99));
    expect(unlucky.cash.toNumber()).toBe(14);
  });

  it("l'As dans la Manche force un Jackpot à la 5e attaque", () => {
    // Sang-froid énorme : l'Équipe survit à l'Étage 30, dont la Caisse ne se vide pas en 5 ticks.
    const sharp = team([
      makePlayer('gambler', {
        baseStats: { flair: 14, luck: 12, composure: 1e9, stealth: 5 },
        gear: { accessory: null, gadget: 'as-manche' },
      }),
    ]);
    let current = startTeamRun(30, sharp);
    const cash: number[] = [];
    for (let i = 0; i < 5; i++) {
      const outcome = tickTeam(current, sharp, { highestCleared: 0 }, always(0.99));
      current = outcome.run;
      cash.push(outcome.cash.toNumber());
    }
    expect(cash.slice(0, 4)).toEqual([36, 36, 36, 36]);
    expect(cash[4]).toBe(90);
  });

  it('le Compteur de cartes gagne +3 % de drain à chaque tick sur la même Table', () => {
    const counter = team([makePlayer('counter', { baseStats: { flair: 12, luck: 0, composure: 1e9, stealth: 10 } })]);
    const first = tickTeam(startTeamRun(30, counter), counter, { highestCleared: 0 }, 'expected');
    const second = tickTeam(first.run, counter, { highestCleared: 0 }, 'expected');
    expect(first.cash.toNumber()).toBe(12);
    expect(second.cash.toNumber()).toBeCloseTo(12.36, 6);
  });
});
