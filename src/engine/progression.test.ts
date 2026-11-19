import { describe, expect, it } from 'vitest';
import { D } from './bignum';
import { startTeamRun, tickTeam } from './combat';
import { buildTeamProfile, gainReputation, reputationToNext } from './economy';
import { talentPoints } from './talents';
import { makePlayer } from './testing';

const NO_BONUS = { cashMult: 1 };

describe('Réputation et niveaux', () => {
  it('il faut 5 000 de Réputation pour le niveau 2, puis 20 % de plus à chaque niveau', () => {
    expect(reputationToNext(1).toNumber()).toBe(5000);
    expect(reputationToNext(2).toNumber()).toBe(6000);
  });

  it('un Joueur monte de niveau quand sa Réputation atteint le seuil, et garde le surplus', () => {
    const sam = makePlayer('gambler');
    expect(gainReputation(sam, D(4999))).toMatchObject({ level: 1 });
    const up = gainReputation(sam, D(5100));
    expect(up.level).toBe(2);
    expect(up.reputation.toNumber()).toBe(100);
  });

  it("beaucoup de Réputation d'un coup fait monter de plusieurs niveaux", () => {
    expect(gainReputation(makePlayer('gambler'), D(5000 + 6000 + 7200)).level).toBe(4);
  });

  it('chaque niveau au-delà du premier donne 1 point de Talent', () => {
    expect(talentPoints(makePlayer('gambler', { level: 4 }))).toEqual({ earned: 3, spent: 0, available: 3 });
    expect(talentPoints(makePlayer('gambler', { level: 4, bonusTalentPoints: 2 })).available).toBe(5);
  });

  it("valider un Étage rapporte la Rafle plus 30 % de la Caisse en Réputation", () => {
    const profile = buildTeamProfile([makePlayer('gambler')], NO_BONUS);
    let run = startTeamRun(1, profile);
    let reputation = 0;
    for (let i = 0; i < 4; i++) {
      const outcome = tickTeam(run, profile, { highestCleared: 0 }, 'expected');
      run = outcome.run;
      reputation += outcome.reputation.toNumber();
    }
    expect(reputation).toBeCloseTo(78, 6);
  });
});
