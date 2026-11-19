// État de partie et règles du jeu côté joueur : actions et passage du temps.
// L'interface ne fait qu'afficher cet état et envoyer des actions.
import { BALANCE } from '../data/balance';
import { D, type Decimal } from './bignum';
import { startTeamRun, tickTeam, type TeamEvent, type TeamRun } from './combat';
import { buildTeamProfile, gainReputation, type TeamProfile } from './economy';
import { createRng, type Rng } from './random';
import { dismissPlayer, generateCandidate, hireCandidate, openOffice, paidRefresh, refreshIfDue, type RecruitmentOffice } from './recruitment';
import { learnTalent, resetTalents, type TalentRefusal } from './talents';
import type { ClassId, GlobalBonuses, Player } from './types';

export interface TeamState {
  memberIds: string[];
  run: TeamRun;
}

export interface GameState {
  cash: Decimal;
  vip: number;
  roster: Player[];
  /** Équipe 1 et Équipe 2. */
  teams: [TeamState, TeamState];
  office: RecruitmentOffice;
  /** Étage le plus haut validé pendant ce tour (avant Blanchiment). */
  highestCleared: number;
  /** Millisecondes pas encore transformées en tick. */
  pendingMs: number;
  settings: { scientific: boolean };
  stats: { jackpots: number };
}

export type TeamIndex = 0 | 1;

export type GameAction =
  | { type: 'hire'; candidateId: string }
  | { type: 'refreshOffice' }
  | { type: 'learnTalent'; playerId: string; talentId: string }
  | { type: 'resetTalents'; playerId: string }
  | { type: 'assign'; playerId: string; team: TeamIndex | null }
  | { type: 'setTeamOptions'; team: TeamIndex; auto?: boolean; safeRetreat?: boolean }
  | { type: 'dismiss'; playerId: string }
  | { type: 'toggleScientific' };

export type GameError =
  | 'not-enough-cash'
  | 'roster-full'
  | 'unknown-candidate'
  | 'unknown-player'
  | 'team-full'
  | 'team-locked'
  | 'last-player'
  | 'not-enough-vip'
  | TalentRefusal;

export interface ActionResult {
  state: GameState;
  error: GameError | null;
}

/** Un événement de combat, avec l'Équipe concernée (pour l'affichage). */
export type GameEvent = TeamEvent & { team: TeamIndex };

export interface AdvanceResult {
  state: GameState;
  ticks: number;
  events: GameEvent[];
}

/** Au-delà, l'absence est traitée par les gains hors-ligne (étape 5). */
export const MAX_TICKS_PER_ADVANCE = 7200;

const BONUSES: GlobalBonuses = { cashMult: 1 };

/** Niveau de Maîtrise d'une Classe (étape 5B : encore à 0 pour toutes). */
export function masteryLevel(_state: GameState, _classId: ClassId): number {
  return 0;
}

function withPlayer(state: GameState, player: Player): GameState {
  return { ...state, roster: state.roster.map((p) => (p.id === player.id ? player : p)) };
}

/**
 * Après un changement de Talents, la Couverture maximale peut changer : on garde la Table en cours
 * mais on ramène la Couverture dans les nouvelles limites.
 */
function refreshTeamOf(state: GameState, playerId: string): GameState {
  const team = teamOf(state, playerId);
  if (team === null) return state;
  const run = state.teams[team].run;
  if (run.phase.kind !== 'table') return state;
  const max = teamProfile(state, team).maxCover;
  const cover = run.phase.table.cover.gt(max) ? max : run.phase.table.cover;
  return withTeam(state, team, { ...state.teams[team], run: { ...run, phase: { kind: 'table', table: { ...run.phase.table, cover } } } });
}

export function isTeamUnlocked(state: GameState, team: TeamIndex): boolean {
  return team === 0 || state.highestCleared >= BALANCE.secondTeamFloor;
}

export function teamMembers(state: GameState, team: TeamIndex): Player[] {
  return state.teams[team].memberIds
    .map((id) => state.roster.find((player) => player.id === id))
    .filter((player): player is Player => player !== undefined);
}

export function teamProfile(state: GameState, team: TeamIndex): TeamProfile {
  return buildTeamProfile(teamMembers(state, team), BONUSES);
}

export function teamOf(state: GameState, playerId: string): TeamIndex | null {
  if (state.teams[0].memberIds.includes(playerId)) return 0;
  if (state.teams[1].memberIds.includes(playerId)) return 1;
  return null;
}

/** Relance la Table de l'Équipe au même Étage (après un changement de composition). */
function restartTeam(state: GameState, team: TeamIndex): GameState {
  const current = state.teams[team];
  const run = startTeamRun(current.run.floor, teamProfile(state, team), {
    auto: current.run.auto,
    safeRetreat: current.run.safeRetreat,
  });
  return withTeam(state, team, { ...current, run });
}

function withTeam(state: GameState, team: TeamIndex, value: TeamState): GameState {
  const teams: [TeamState, TeamState] = [...state.teams];
  teams[team] = value;
  return { ...state, teams };
}

/** Nouvelle partie : un Flambeur Commun offert, déjà dans l'Équipe 1. */
export function newGame(seed: number, now: number, starter?: Player): GameState {
  const rng = createRng(seed);
  const first =
    starter ??
    generateCandidate(rng, {
      now: new Date(now),
      takenNames: new Set(),
      classId: 'gambler',
      rarityWeights: { common: 1, rare: 0, epic: 0, legendary: 0 },
    });
  const emptyProfile = buildTeamProfile([], BONUSES);
  const base: GameState = {
    cash: D(0),
    vip: 0,
    roster: [first],
    teams: [
      { memberIds: [first.id], run: startTeamRun(1, emptyProfile) },
      { memberIds: [], run: startTeamRun(1, emptyProfile) },
    ],
    office: openOffice(Math.floor(rng() * 2 ** 32), { now, roster: [first] }),
    highestCleared: 0,
    pendingMs: 0,
    settings: { scientific: false },
    stats: { jackpots: 0 },
  };
  return restartTeam(base, 0);
}

function fail(state: GameState, error: GameError): ActionResult {
  return { state, error };
}

/** Applique une action du joueur. En cas de refus, l'état est inchangé et `error` dit pourquoi. */
export function applyAction(state: GameState, action: GameAction, now: number): ActionResult {
  switch (action.type) {
    case 'hire': {
      const result = hireCandidate(
        { office: state.office, roster: state.roster, cash: state.cash, highestFloor: state.highestCleared },
        action.candidateId,
      );
      if (!result.ok) return fail(state, result.reason);
      return { state: { ...state, office: result.office, roster: result.roster, cash: result.cash }, error: null };
    }

    case 'refreshOffice': {
      const result = paidRefresh(
        { office: state.office, cash: state.cash, highestFloor: state.highestCleared },
        { now, roster: state.roster },
      );
      if (!result.ok) return fail(state, result.reason);
      return { state: { ...state, office: result.office, cash: result.cash }, error: null };
    }

    case 'learnTalent': {
      const player = state.roster.find((p) => p.id === action.playerId);
      if (!player) return fail(state, 'unknown-player');
      const result = learnTalent(player, action.talentId, masteryLevel(state, player.classId));
      if (result.refusal) return fail(state, result.refusal);
      return { state: refreshTeamOf(withPlayer(state, result.player), player.id), error: null };
    }

    case 'resetTalents': {
      const player = state.roster.find((p) => p.id === action.playerId);
      if (!player) return fail(state, 'unknown-player');
      if (state.vip < BALANCE.talents.respecVip) return fail(state, 'not-enough-vip');
      const next = { ...withPlayer(state, resetTalents(player)), vip: state.vip - BALANCE.talents.respecVip };
      return { state: refreshTeamOf(next, player.id), error: null };
    }

    case 'assign': {
      if (!state.roster.some((p) => p.id === action.playerId)) return fail(state, 'unknown-player');
      const from = teamOf(state, action.playerId);
      if (from === action.team) return { state, error: null };
      if (action.team !== null) {
        if (!isTeamUnlocked(state, action.team)) return fail(state, 'team-locked');
        if (state.teams[action.team].memberIds.length >= BALANCE.teamSize) return fail(state, 'team-full');
      }
      let next = state;
      if (from !== null) {
        const team = next.teams[from];
        next = restartTeam(withTeam(next, from, { ...team, memberIds: team.memberIds.filter((id) => id !== action.playerId) }), from);
      }
      if (action.team !== null) {
        const team = next.teams[action.team];
        next = restartTeam(withTeam(next, action.team, { ...team, memberIds: [...team.memberIds, action.playerId] }), action.team);
      }
      return { state: next, error: null };
    }

    case 'setTeamOptions': {
      const team = state.teams[action.team];
      const run = { ...team.run, auto: action.auto ?? team.run.auto, safeRetreat: action.safeRetreat ?? team.run.safeRetreat };
      return { state: withTeam(state, action.team, { ...team, run }), error: null };
    }

    case 'dismiss': {
      if (!state.roster.some((p) => p.id === action.playerId)) return fail(state, 'unknown-player');
      if (state.roster.length === 1) return fail(state, 'last-player');
      const unassigned = applyAction(state, { type: 'assign', playerId: action.playerId, team: null }, now).state;
      const result = dismissPlayer(unassigned.roster, action.playerId, state.highestCleared);
      return { state: { ...unassigned, roster: result.roster, cash: unassigned.cash.add(result.refund) }, error: null };
    }

    case 'toggleScientific':
      return { state: { ...state, settings: { ...state.settings, scientific: !state.settings.scientific } }, error: null };
  }
}

/** Fait avancer la partie de `elapsedMs` millisecondes (ticks de 0,5 s). */
export function advanceGame(state: GameState, elapsedMs: number, now: number, rng: Rng): AdvanceResult {
  const tickMs = BALANCE.tickSeconds * 1000;
  const available = state.pendingMs + Math.max(0, elapsedMs);
  const ticks = Math.min(Math.floor(available / tickMs), MAX_TICKS_PER_ADVANCE);
  const pendingMs = ticks === MAX_TICKS_PER_ADVANCE ? 0 : available - ticks * tickMs;

  const profiles = [teamProfile(state, 0), teamProfile(state, 1)] as const;
  const runs: [TeamRun, TeamRun] = [state.teams[0].run, state.teams[1].run];
  let cash = state.cash;
  let vip = state.vip;
  let highestCleared = state.highestCleared;
  let jackpots = state.stats.jackpots;
  const events: GameEvent[] = [];
  const teamReputation = [D(0), D(0)];

  for (let tick = 0; tick < ticks; tick++) {
    for (const team of [0, 1] as const) {
      if (profiles[team].members.length === 0) continue;
      const outcome = tickTeam(runs[team], profiles[team], { highestCleared }, rng);
      runs[team] = outcome.run;
      cash = cash.add(outcome.cash);
      teamReputation[team] = teamReputation[team]!.add(outcome.reputation);
      vip += outcome.vip;
      if (outcome.clearedFloor !== null) highestCleared = Math.max(highestCleared, outcome.clearedFloor);
      for (const event of outcome.events) {
        if (event.type === 'jackpot') jackpots += 1;
        events.push({ ...event, team });
      }
    }
  }

  // La Réputation est partagée à parts égales entre les membres de chaque Équipe.
  const roster = state.roster.map((player) => {
    const team = teamOf(state, player.id);
    if (team === null) return player;
    const share = teamReputation[team]!.div(state.teams[team].memberIds.length);
    return gainReputation(player, share);
  });

  const next: GameState = {
    ...state,
    roster,
    cash,
    vip,
    highestCleared,
    pendingMs,
    teams: [
      { ...state.teams[0], run: runs[0] },
      { ...state.teams[1], run: runs[1] },
    ],
    stats: { ...state.stats, jackpots },
    office: refreshIfDue(state.office, { now, roster: state.roster }),
  };
  // On ne garde que les derniers événements : l'interface n'en affiche que quelques-uns.
  return { state: next, ticks, events: events.slice(-50) };
}
