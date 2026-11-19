import { describe, expect, it } from 'vitest';
import { D } from '../engine/bignum';
import { getFloor } from '../engine/floors';
import { newGame, type GameState } from '../engine/game';
import { makePlayer } from '../engine/testing';
import { LocalProvider, type KeyValueStore } from './LocalProvider';
import { CURRENT_SAVE_VERSION, serializeGame } from './saveFormat';
import { exportCode, importSave, loadGame } from './saves';

const NOW = Date.UTC(2026, 5, 1);
const HOUR = 3_600_000;

function richGame(): GameState {
  const base = newGame(1, NOW, makePlayer('gambler', { id: 'sam', level: 12, reputation: D(1234.5), talents: { 'gambler.pyromane.meche-courte': 2 } }));
  const run = base.teams[0].run;
  const table = run.phase.kind === 'table' ? run.phase.table : null;
  return {
    ...base,
    cash: D('4.2e512'),
    vip: 17,
    items: { 'des-pipes': { rank: 4 } },
    buildings: { ...base.buildings, vault: 3 },
    mastery: { ...base.mastery, gambler: D('7.5e33') },
    teams: [
      { ...base.teams[0], run: { ...run, floor: 6000, phase: { kind: 'table', table: { ...table!, vault: getFloor(6000).vault } } } },
      base.teams[1],
    ],
  };
}

describe('aller-retour de sauvegarde', () => {
  it('une partie sauvegardée puis rechargée est identique, grands nombres compris', () => {
    const original = richGame();
    const text = serializeGame(original, NOW);
    const loaded = loadGame(text, NOW);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(serializeGame(loaded.state, NOW)).toBe(text);
    const run = loaded.state.teams[0].run;
    expect(run.phase.kind === 'table' && run.phase.table.vault.gt('1e400')).toBe(true);
    expect(loaded.state.cash.eq('4.2e512')).toBe(true);
  });

  it('le code à copier-coller redonne la même partie', () => {
    const original = richGame();
    const loaded = importSave(exportCode(original, NOW), NOW);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(serializeGame(loaded.state, NOW)).toBe(serializeGame(original, NOW));
  });

  it('le connecteur local garde et rend la sauvegarde', async () => {
    const memory = new Map<string, string>();
    const store: KeyValueStore = {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    };
    const provider = new LocalProvider(store);
    await provider.save('abc');
    expect(await provider.load()).toBe('abc');
    await provider.clear();
    expect(await provider.load()).toBeNull();
  });
});

describe('sauvegarde abîmée', () => {
  it("un texte qui n'est pas une sauvegarde est refusé", () => {
    expect(loadGame('pas du tout du JSON', NOW)).toEqual({ ok: false, error: 'invalid' });
    expect(importSave('%%% code abîmé %%%', NOW)).toEqual({ ok: false, error: 'invalid' });
    expect(loadGame(JSON.stringify({ saveVersion: 1, lastSavedAt: NOW, game: { cash: 3 } }), NOW)).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('migrations', () => {
  it('une sauvegarde de la version 0 (avant la Maîtrise et les Bâtiments) est mise à jour', () => {
    const game = richGame() as unknown as Record<string, unknown>;
    const { mastery: _m, items: _i, buildings: _b, ...old } = game;
    const roster = (old.roster as Record<string, unknown>[]).map(({ reputation: _r, talents: _t, bonusTalentPoints: _p, ...p }) => p);
    const text = serializeGame({ ...old, roster } as unknown as GameState, NOW).replace(`"saveVersion":${CURRENT_SAVE_VERSION},`, '');
    const loaded = loadGame(text, NOW);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(loaded.state.mastery.gambler.toNumber()).toBe(0);
    expect(loaded.state.buildings.vault).toBe(0);
    expect(loaded.state.roster[0]?.talents).toEqual({});
  });

  it("une sauvegarde d'une version future est refusée", () => {
    const text = serializeGame(richGame(), NOW).replace(`"saveVersion":${CURRENT_SAVE_VERSION}`, '"saveVersion":99');
    expect(loadGame(text, NOW)).toEqual({ ok: false, error: 'future-version' });
  });
});

describe("retour d'absence", () => {
  const simple = () => serializeGame(newGame(1, NOW, makePlayer('gambler', { id: 'sam' })), NOW);

  it("une heure d'absence rapporte les gains de l'Étage en cours", () => {
    const loaded = loadGame(simple(), NOW + HOUR);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(loaded.offline?.seconds).toBe(3600);
    expect(loaded.state.cash.toNumber()).toBeCloseTo(140_400, 2);
    expect(loaded.offline?.reputation.toNumber()).toBeCloseTo(140_400, 2);
  });

  it('les gains sont plafonnés par la Planque (12 h de base)', () => {
    const loaded = loadGame(simple(), NOW + 20 * HOUR);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(loaded.offline?.seconds).toBe(12 * 3600);
  });

  it("une horloge qui recule ne donne rien et ne retire rien", () => {
    const loaded = loadGame(simple(), NOW - HOUR);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(loaded.offline).toBeNull();
    expect(loaded.state.cash.toNumber()).toBe(0);
  });
});
