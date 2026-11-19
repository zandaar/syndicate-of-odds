import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../data/achievements';
import { serializeGame } from '../storage/saveFormat';
import { loadGame } from '../storage/saves';
import { achievementCount } from './achievements';
import { D } from './bignum';
import { advanceGame, applyAction, bonusesOf, newGame, offlineCapOf, teamProfile, type GameState } from './game';
import { influenceFor } from './network';
import { makePlayer } from './testing';

const NOW = Date.UTC(2026, 5, 1);
const noJackpot = () => 0.99;
const act = (state: GameState, action: Parameters<typeof applyAction>[1]) => applyAction(state, action, NOW);

/** Une partie avancée, prête à Blanchir. */
function lateGame(highestCleared = 57): GameState {
  const base = newGame(1, NOW, makePlayer('gambler', { id: 'sam', level: 40 }));
  return {
    ...base,
    roster: [...base.roster, makePlayer('bluffer', { id: 'jess' }), makePlayer('counter', { id: 'max' })],
    cash: D(1e9),
    vip: 40,
    highestCleared,
    items: { 'des-pipes': { rank: 5 } },
    buildings: { ...base.buildings, vault: 4 },
    mastery: { ...base.mastery, gambler: D(123_456) },
    achievements: { floor: 3 },
    settings: { scientific: true },
  };
}

describe('Blanchiment', () => {
  it("l'Influence vaut (Étage ÷ 10)², arrondie vers le bas", () => {
    expect(influenceFor(50)).toBe(25);
    expect(influenceFor(57)).toBe(32);
    expect(influenceFor(100)).toBe(100);
  });

  it("refusé avant l'Étage 50", () => {
    expect(act(lateGame(49), { type: 'launder' }).error).toBe('too-early');
  });

  it("remet à zéro Joueurs, Cash, Jetons VIP, Gadgets, Bâtiments et Étages", () => {
    const after = act(lateGame(), { type: 'launder' }).state;
    expect(after.roster).toHaveLength(1);
    expect(after.roster[0]).toMatchObject({ classId: 'gambler', rarity: 'common', level: 1 });
    expect(after.cash.toNumber()).toBe(0);
    expect(after.items).toEqual({});
    expect(after.buildings.vault).toBe(0);
    expect(after.highestCleared).toBe(0);
    expect(after.teams[0].run.floor).toBe(1);
    // Les Jetons VIP repartent de zéro (seuls les Succès débloqués à l'instant en redonnent).
    expect(after.vip).toBe(10);
  });

  it("conserve l'Influence gagnée, la Maîtrise, les Succès et les réglages", () => {
    const after = act(lateGame(), { type: 'launder' }).state;
    expect(after.influence).toBe(32);
    expect(after.mastery.gambler.toNumber()).toBe(123_456);
    expect(after.achievements.floor).toBe(3);
    expect(after.achievements.laundering).toBe(1);
    expect(after.lifetime.launderings).toBe(1);
    expect(after.lifetime.bestFloor).toBe(57);
    expect(after.settings.scientific).toBe(true);
  });
});

describe('Réseau', () => {
  const withInfluence = (influence: number) => ({ ...newGame(1, NOW, makePlayer('gambler', { id: 'sam' })), influence });

  it('Blanchisseurs : 5 Influence, puis +60 % ; +10 % de Cash par niveau', () => {
    let state = act(withInfluence(20), { type: 'buyNetwork', networkId: 'launderers' }).state;
    expect(state.influence).toBe(15);
    expect(bonusesOf(state).cashMult).toBeCloseTo(1.1, 10);
    state = act(state, { type: 'buyNetwork', networkId: 'launderers' }).state;
    expect(state.influence).toBe(7);
    expect(act(state, { type: 'buyNetwork', networkId: 'launderers' }).error).toBe('not-enough-influence');
  });

  it('Mentors : +10 % de Réputation par niveau', () => {
    const state = act(withInfluence(5), { type: 'buyNetwork', networkId: 'mentors' }).state;
    expect(teamProfile(state, 0).reputationMult).toBeCloseTo(1.1, 10);
  });

  it("Contacts : après un Blanchiment, la partie reprend directement à l'Étage 10", () => {
    const state = { ...lateGame(), influence: 25 };
    const withContacts = act(state, { type: 'buyNetwork', networkId: 'contacts' }).state;
    const after = act(withContacts, { type: 'launder' }).state;
    expect(after.teams[0].run.floor).toBe(10);
    expect(after.highestCleared).toBe(9);
  });

  it('Nuits blanches : +4 h de plafond hors-ligne par niveau, 2 niveaux au plus', () => {
    let state = act(withInfluence(500), { type: 'buyNetwork', networkId: 'sleepless' }).state;
    expect(offlineCapOf(state)).toBe(16 * 3600);
    state = act(state, { type: 'buyNetwork', networkId: 'sleepless' }).state;
    expect(act(state, { type: 'buyNetwork', networkId: 'sleepless' }).error).toBe('max-level');
  });
});

describe('Succès', () => {
  it("atteindre l'Étage 10 débloque un palier une seule fois : 5 Jetons VIP et +1 % de Cash", () => {
    const strong = newGame(1, NOW, makePlayer('gambler', { id: 'sam', level: 120 }));
    const result = advanceGame(strong, 6_000, NOW, noJackpot);
    expect(result.unlocked.map((u) => u.label)).toContain("Atteindre l'Étage 10");
    const floorTiers = result.state.achievements.floor ?? 0;
    expect(floorTiers).toBeGreaterThanOrEqual(1);
    expect(result.state.vip).toBeGreaterThanOrEqual(5);
    expect(bonusesOf(result.state).cashMult).toBeCloseTo(1 + 0.01 * achievementCount(result.state), 10);
    const again = advanceGame(result.state, 0, NOW, noJackpot);
    expect(again.unlocked).toEqual([]);
  });

  it('les paliers continuent sans fin : 10, 25, 50, 100… puis des millions', () => {
    const floor = ACHIEVEMENTS.find((a) => a.id === 'floor')!;
    expect([0, 1, 2, 3, 4].map(floor.threshold)).toEqual([10, 25, 50, 100, 250]);
    expect(floor.threshold(15)).toBe(1e6);
  });

  it('les Succès restent après un Blanchiment', () => {
    const after = act(lateGame(), { type: 'launder' }).state;
    expect(after.achievements.floor).toBe(3);
  });
});

describe('sauvegarde version 2', () => {
  it('une sauvegarde version 1 est migrée sans perte', () => {
    const game = newGame(1, NOW, makePlayer('gambler', { id: 'sam', level: 7 })) as unknown as Record<string, unknown>;
    const { influence: _i, network: _n, achievements: _a, lifetime: _l, ...v1 } = game;
    const text = serializeGame({ ...v1, stats: { jackpots: 42 } } as unknown as GameState, NOW).replace('"saveVersion":2', '"saveVersion":1');
    const loaded = loadGame(text, NOW);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(loaded.state.roster[0]?.level).toBe(7);
    expect(loaded.state.influence).toBe(0);
    expect(loaded.state.network.contacts).toBe(0);
    expect(loaded.state.lifetime.jackpots).toBe(42);
  });
});
