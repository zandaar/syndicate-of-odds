import { describe, expect, it } from 'vitest';
import { D } from './bignum';
import { getPlayerStats } from './economy';
import { advanceGame, applyAction, bonusesOf, effectsOf, newGame, teamProfile, type GameState } from './game';
import { makePlayer } from './testing';

const NOW = Date.UTC(2026, 5, 1);
const noJackpot = () => 0.99;

function game(cash: number): GameState {
  const base = newGame(1, NOW, makePlayer('gambler', { id: 'sam' }));
  return { ...base, cash: D(cash), roster: [...base.roster, makePlayer('bluffer', { id: 'jess' })] };
}
const act = (state: GameState, action: Parameters<typeof applyAction>[1]) => applyAction(state, action, NOW);

describe('Gadgets achetés et améliorés en Cash', () => {
  it('les Dés Pipés coûtent 450 $ ; on ne peut pas les acheter deux fois, ni sans le Cash', () => {
    const bought = act(game(1000), { type: 'buyItem', itemId: 'des-pipes' });
    expect(bought.state.cash.toNumber()).toBe(550);
    expect(bought.state.items).toEqual({ 'des-pipes': { rank: 1 } });
    expect(act(bought.state, { type: 'buyItem', itemId: 'des-pipes' }).error).toBe('already-owned');
    expect(act(game(100), { type: 'buyItem', itemId: 'des-pipes' }).error).toBe('not-enough-cash');
  });

  it('chaque rang coûte 60 % de plus que le précédent', () => {
    let state = act(game(10_000), { type: 'buyItem', itemId: 'des-pipes' }).state;
    state = act(state, { type: 'upgradeItem', itemId: 'des-pipes' }).state;
    expect(state.cash.toNumber()).toBe(10_000 - 450 - 720);
    state = act(state, { type: 'upgradeItem', itemId: 'des-pipes' }).state;
    expect(state.cash.toNumber()).toBe(10_000 - 450 - 720 - 1152);
    expect(state.items['des-pipes']?.rank).toBe(3);
  });

  it('chaque rang renforce les stats du Gadget de 15 %', () => {
    let state = act(game(10_000), { type: 'buyItem', itemId: 'des-pipes' }).state;
    state = act(state, { type: 'upgradeItem', itemId: 'des-pipes' }).state;
    state = act(state, { type: 'equip', playerId: 'sam', itemId: 'des-pipes' }).state;
    const sam = state.roster.find((p) => p.id === 'sam')!;
    expect(getPlayerStats(sam, bonusesOf(state)).flair.toNumber()).toBeCloseTo(20.9, 6);
  });

  it("un Gadget n'est porté que par un Joueur à la fois", () => {
    let state = act(game(1000), { type: 'buyItem', itemId: 'lunettes-fumees' }).state;
    state = act(state, { type: 'equip', playerId: 'sam', itemId: 'lunettes-fumees' }).state;
    state = act(state, { type: 'equip', playerId: 'jess', itemId: 'lunettes-fumees' }).state;
    expect(state.roster.find((p) => p.id === 'sam')?.gear.accessory).toBeNull();
    expect(state.roster.find((p) => p.id === 'jess')?.gear.accessory).toBe('lunettes-fumees');
  });

  it('on ne peut porter que les Gadgets possédés', () => {
    expect(act(game(0), { type: 'equip', playerId: 'sam', itemId: 'bague-syndicat' }).error).toBe('not-owned');
  });
});

describe('Bâtiments du QG', () => {
  it('le Coffre-fort coûte 600 $, puis 70 % de plus, et donne +10 % de prime de fin d’Étage par niveau', () => {
    let state = act(game(5000), { type: 'upgradeBuilding', buildingId: 'vault' }).state;
    expect(state.cash.toNumber()).toBe(4400);
    expect(teamProfile(state, 0).floorBonusMult).toBeCloseTo(1.1, 10);
    state = act(state, { type: 'upgradeBuilding', buildingId: 'vault' }).state;
    expect(state.cash.toNumber()).toBe(4400 - 1020);
    expect(act({ ...state, cash: D(10) }, { type: 'upgradeBuilding', buildingId: 'vault' }).error).toBe('not-enough-cash');
  });

  it("la Salle d'entraînement donne au banc 5 % par niveau de la Réputation des Équipes", () => {
    const state = act(game(1000), { type: 'upgradeBuilding', buildingId: 'training' }).state;
    const after = advanceGame(state, 500, NOW, noJackpot).state;
    // Sam rafle 14 au premier tick ; Jess, sur le banc, reçoit 5 % de 14.
    expect(after.roster.find((p) => p.id === 'jess')?.reputation.toNumber()).toBeCloseTo(0.7, 6);
  });

  it('la Planque ajoute 1 heure de plafond hors-ligne par niveau', () => {
    const state = act(game(5000), { type: 'upgradeBuilding', buildingId: 'hideout' }).state;
    expect(effectsOf(state).offlineCapSeconds).toBe(13 * 3600);
  });

  it("l'Agence propose 1 Candidat de plus tous les 3 niveaux", () => {
    let state = game(1e6);
    for (let i = 0; i < 3; i++) state = act(state, { type: 'upgradeBuilding', buildingId: 'agency' }).state;
    state = act(state, { type: 'refreshOffice' }).state;
    expect(state.office.candidates).toHaveLength(4);
  });
});
