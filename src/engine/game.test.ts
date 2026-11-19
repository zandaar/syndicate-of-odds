import { describe, expect, it } from 'vitest';
import { D } from './bignum';
import { advanceGame, applyAction, isTeamUnlocked, newGame, teamOf, type GameState } from './game';
import { openOffice } from './recruitment';
import { makePlayer } from './testing';
import type { Player } from './types';

const NOW = Date.UTC(2026, 5, 1);
const MINUTE = 60_000;
const noJackpot = () => 0.99;

function game(starter: Player = makePlayer('gambler', { id: 'sam' })): GameState {
  return newGame(1, NOW, starter);
}

/** Ajoute des Joueurs au roster (hors Équipe) et du Cash. */
function withRoster(state: GameState, players: Player[], cash = 0): GameState {
  return { ...state, roster: [...state.roster, ...players], cash: D(cash) };
}

describe('actions du joueur', () => {
  it('une nouvelle partie offre un Flambeur Commun, déjà dans l’Équipe 1', () => {
    const state = newGame(7, NOW);
    expect(state.roster).toHaveLength(1);
    expect(state.roster[0]).toMatchObject({ classId: 'gambler', rarity: 'common', level: 1 });
    expect(teamOf(state, state.roster[0]!.id)).toBe(0);
    expect(state.office.candidates).toHaveLength(3);
    expect(isTeamUnlocked(state, 1)).toBe(false);
  });

  it('embaucher dépense le prix du Candidat ; sans Cash, rien ne change', () => {
    const base = game();
    const office = openOffice(3, { now: NOW, roster: base.roster, rarityWeights: { common: 1, rare: 0, epic: 0, legendary: 0 } });
    const state = { ...base, office, cash: D(1000) };
    const hired = applyAction(state, { type: 'hire', candidateId: office.candidates[0]!.id }, NOW);
    expect(hired.error).toBeNull();
    expect(hired.state.cash.toNumber()).toBe(950);
    expect(hired.state.roster).toHaveLength(2);

    const broke = applyAction({ ...state, cash: D(0) }, { type: 'hire', candidateId: office.candidates[0]!.id }, NOW);
    expect(broke.error).toBe('not-enough-cash');
    expect(broke.state.roster).toHaveLength(1);
  });

  it('apprendre un Talent dépense un point gagné en montant de niveau', () => {
    const state = game(makePlayer('gambler', { id: 'sam', level: 2 }));
    const result = applyAction(state, { type: 'learnTalent', playerId: 'sam', talentId: 'gambler.pyromane.meche-courte' }, NOW);
    expect(result.error).toBeNull();
    expect(result.state.roster[0]?.talents).toEqual({ 'gambler.pyromane.meche-courte': 1 });
    expect(applyAction(result.state, { type: 'learnTalent', playerId: 'sam', talentId: 'gambler.pyromane.meche-courte' }, NOW).error).toBe('no-points');
  });

  it('redistribuer les Talents coûte 5 Jetons VIP et rend tous les points', () => {
    const state = game(makePlayer('gambler', { id: 'sam', level: 4, talents: { 'gambler.pyromane.meche-courte': 3 } }));
    expect(applyAction(state, { type: 'resetTalents', playerId: 'sam' }, NOW).error).toBe('not-enough-vip');
    const result = applyAction({ ...state, vip: 7 }, { type: 'resetTalents', playerId: 'sam' }, NOW).state;
    expect(result.vip).toBe(2);
    expect(result.roster[0]?.talents).toEqual({});
  });

  it("l'Équipe 2 est verrouillée avant l'Étage 10", () => {
    const state = withRoster(game(), [makePlayer('bluffer', { id: 'jess' })]);
    expect(applyAction(state, { type: 'assign', playerId: 'jess', team: 1 }, NOW).error).toBe('team-locked');
  });

  it("un Joueur n'est jamais dans deux Équipes : l'affecter ailleurs le retire de la première", () => {
    const state = { ...game(), highestCleared: 10 };
    const moved = applyAction(state, { type: 'assign', playerId: 'sam', team: 1 }, NOW).state;
    expect(moved.teams[0].memberIds).toEqual([]);
    expect(moved.teams[1].memberIds).toEqual(['sam']);
  });

  it('une Équipe compte au plus 3 Joueurs', () => {
    const extra = ['a', 'b', 'c'].map((id) => makePlayer('bluffer', { id }));
    let state = withRoster(game(), extra);
    state = applyAction(state, { type: 'assign', playerId: 'a', team: 0 }, NOW).state;
    state = applyAction(state, { type: 'assign', playerId: 'b', team: 0 }, NOW).state;
    expect(applyAction(state, { type: 'assign', playerId: 'c', team: 0 }, NOW).error).toBe('team-full');
  });

  it("changer la composition relance la Table au même Étage, avec la nouvelle Couverture", () => {
    const base = game();
    const state = withRoster({ ...base, teams: [{ ...base.teams[0], run: { ...base.teams[0].run, floor: 4 } }, base.teams[1]] }, [
      makePlayer('bluffer', { id: 'jess' }),
    ]);
    const result = applyAction(state, { type: 'assign', playerId: 'jess', team: 0 }, NOW).state;
    expect(result.teams[0].run.floor).toBe(4);
    expect(result.teams[0].run.phase.kind === 'table' && result.teams[0].run.phase.table.cover.toNumber()).toBe(210);
  });

  it("renvoyer un Joueur le retire de son Équipe et rend la moitié de son prix d'embauche", () => {
    const state = withRoster(game(), [makePlayer('bluffer', { id: 'jess', level: 3 })]);
    const assigned = applyAction(state, { type: 'assign', playerId: 'jess', team: 0 }, NOW).state;
    const result = applyAction(assigned, { type: 'dismiss', playerId: 'jess' }, NOW).state;
    expect(result.teams[0].memberIds).toEqual(['sam']);
    expect(result.cash.toNumber()).toBe(25);
  });

  it('on ne peut pas renvoyer son dernier Joueur', () => {
    expect(applyAction(game(), { type: 'dismiss', playerId: 'sam' }, NOW).error).toBe('last-player');
  });
});

describe('avancement du temps', () => {
  it("5 ticks (2,5 s) suffisent au Flambeur pour vider l'Étage 1 : 60 $ drainés + 18 $ de prime", () => {
    const result = advanceGame(game(), 2500, NOW, noJackpot);
    expect(result.ticks).toBe(5);
    expect(result.state.cash.toNumber()).toBe(78);
    expect(result.state.highestCleared).toBe(1);
    expect(result.state.teams[0].run.floor).toBe(2);
  });

  it("la Réputation gagnée à la Table est partagée entre les membres de l'Équipe ; le banc ne gagne rien", () => {
    let state = withRoster(game(), [makePlayer('bluffer', { id: 'jess' }), makePlayer('mastermind', { id: 'banc' })]);
    state = applyAction(state, { type: 'assign', playerId: 'jess', team: 0 }, NOW).state;
    const after = advanceGame(state, 500, NOW, noJackpot).state;
    const rep = (id: string) => after.roster.find((p) => p.id === id)!.reputation.toNumber();
    // Rafle du tick : Sam 14 + Jess 7 = 21, soit 10,5 chacun.
    expect(rep('sam')).toBeCloseTo(10.5, 6);
    expect(rep('jess')).toBeCloseTo(10.5, 6);
    expect(rep('banc')).toBe(0);
  });

  it('le temps qui ne fait pas un tick entier est gardé pour la suite', () => {
    const first = advanceGame(game(), 700, NOW, noJackpot);
    expect(first.ticks).toBe(1);
    expect(advanceGame(first.state, 300, NOW, noJackpot).ticks).toBe(1);
  });

  it("si l'onglet a été figé longtemps, on rattrape au plus une heure de ticks", () => {
    expect(advanceGame(game(), 10 * 3600 * 1000, NOW, noJackpot).ticks).toBe(7200);
  });

  it("valider l'Étage 10 débloque l'Équipe 2 et le premier passage d'un Boss rapporte des Jetons VIP", () => {
    const strong = makePlayer('gambler', { id: 'sam', level: 120 });
    const result = advanceGame(game(strong), 60_000, NOW, noJackpot);
    expect(result.state.highestCleared).toBeGreaterThanOrEqual(10);
    expect(isTeamUnlocked(result.state, 1)).toBe(true);
    expect(result.state.vip).toBeGreaterThanOrEqual(4);
  });

  it('le Bureau renouvelle ses Candidats après 20 minutes', () => {
    const state = game();
    const later = advanceGame(state, 0, NOW + 20 * MINUTE, noJackpot).state;
    expect(later.office.candidates).not.toEqual(state.office.candidates);
  });
});
