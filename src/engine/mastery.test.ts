import { describe, expect, it } from 'vitest';
import { TALENTS } from '../data/talents';
import { D } from './bignum';
import { getPlayerStats, masteryFromTotal, masteryToNext } from './economy';
import { advanceGame, applyAction, masteryLevel, newGame } from './game';
import { openOffice } from './recruitment';
import { makePlayer } from './testing';

const NOW = Date.UTC(2026, 5, 1);
const noJackpot = () => 0.99;
const fullPyromane = Object.fromEntries(
  TALENTS.filter((t) => t.classId === 'gambler' && t.branchId === 'pyromane' && t.index < 5).map((t) => [t.id, 3]),
);

describe('Maîtrise de Classe', () => {
  it('il faut 20 000 de Réputation de Classe pour la Maîtrise 1, puis 50 % de plus à chaque niveau', () => {
    expect(masteryToNext(0).toNumber()).toBe(20_000);
    expect(masteryToNext(1).toNumber()).toBe(30_000);
    expect(masteryFromTotal(D(19_999)).level).toBe(0);
    expect(masteryFromTotal(D(50_000)).level).toBe(2);
  });

  it('toute la Réputation gagnée par un Joueur nourrit la Maîtrise de sa Classe', () => {
    const state = newGame(1, NOW, makePlayer('gambler', { id: 'sam' }));
    const after = advanceGame(state, 2500, NOW, noJackpot).state;
    expect(after.mastery.gambler.toNumber()).toBeCloseTo(78, 6);
    expect(after.mastery.bluffer.toNumber()).toBe(0);
  });

  it('chaque niveau de Maîtrise donne +2 % à toutes les stats des Joueurs de la Classe', () => {
    const stats = getPlayerStats(makePlayer('gambler'), { cashMult: 1, masteryLevels: { gambler: 5 } });
    expect(stats.flair.toNumber()).toBeCloseTo(15.4, 6);
    expect(getPlayerStats(makePlayer('bluffer'), { cashMult: 1, masteryLevels: { gambler: 5 } }).flair.toNumber()).toBe(7);
  });

  it('la Maîtrise 5 débloque les Talents ultimes', () => {
    const sam = makePlayer('gambler', { id: 'sam', level: 17, talents: fullPyromane });
    const locked = newGame(1, NOW, sam);
    const action = { type: 'learnTalent', playerId: 'sam', talentId: 'gambler.pyromane.quitte-ou-double' } as const;
    expect(applyAction(locked, action, NOW).error).toBe('locked-mastery');
    const master = { ...locked, mastery: { ...locked.mastery, gambler: D(1e7) } };
    expect(masteryLevel(master, 'gambler')).toBeGreaterThanOrEqual(5);
    expect(applyAction(master, action, NOW).error).toBeNull();
  });

  it('les recrues d’une Classe très maîtrisée arrivent avec des points de Talent', () => {
    const base = newGame(1, NOW, makePlayer('gambler', { id: 'sam' }));
    const mastered = Object.fromEntries(Object.keys(base.mastery).map((id) => [id, D(1e15)])) as typeof base.mastery;
    const office = openOffice(3, { now: NOW, roster: base.roster, rarityWeights: { common: 1, rare: 0, epic: 0, legendary: 0 } });
    const state = { ...base, office, mastery: mastered, cash: D(1000) };
    const candidate = office.candidates[0]!;
    const hired = applyAction(state, { type: 'hire', candidateId: candidate.id }, NOW).state;
    expect(hired.roster.find((p) => p.id === candidate.id)?.bonusTalentPoints).toBe(3);
  });

  it('la Maîtrise reste quand on renvoie le Joueur', () => {
    const base = newGame(1, NOW, makePlayer('gambler', { id: 'sam' }));
    const state = { ...base, roster: [...base.roster, makePlayer('bluffer', { id: 'jess' })], mastery: { ...base.mastery, bluffer: D(5000) } };
    const after = applyAction(state, { type: 'dismiss', playerId: 'jess' }, NOW).state;
    expect(after.mastery.bluffer.toNumber()).toBe(5000);
  });
});
