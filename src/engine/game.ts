// État de partie et règles du jeu côté joueur : actions et passage du temps.
// L'interface ne fait qu'afficher cet état et envoyer des actions.
import { BALANCE } from '../data/balance';
import { BUILDINGS, type BuildingId } from '../data/buildings';
import { CLASSES } from '../data/classes';
import { ITEMS_BY_ID } from '../data/items';
import { D, type Decimal } from './bignum';
import { buildingCost, buildingEffects, noBuildings, type BuildingEffects, type BuildingLevels } from './buildings';
import { startTeamRun, tickTeam, type TeamEvent, type TeamRun } from './combat';
import {
  buildTeamProfile,
  gadgetBuyCost,
  gadgetUpgradeCost,
  gainReputation,
  masteryBonusPoints,
  masteryFromTotal,
  type TeamProfile,
} from './economy';
import { createRng, type Rng } from './random';
import {
  dismissPlayer,
  generateCandidate,
  hireCandidate,
  openOffice,
  paidRefresh,
  refreshIfDue,
  type OfficeContext,
  type RecruitmentOffice,
} from './recruitment';
import { learnTalent, resetTalents, type TalentRefusal } from './talents';
import type { ClassId, GearSlot, GlobalBonuses, Player } from './types';

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
  /** Réputation cumulée par Classe : elle fait la Maîtrise de Classe et survit au Blanchiment. */
  mastery: Record<ClassId, Decimal>;
  /** Gadgets possédés (un exemplaire chacun) et leur rang. */
  items: Record<string, { rank: number }>;
  buildings: BuildingLevels;
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
  | { type: 'buyItem'; itemId: string }
  | { type: 'upgradeItem'; itemId: string }
  | { type: 'equip'; playerId: string; itemId: string }
  | { type: 'unequip'; playerId: string; slot: GearSlot }
  | { type: 'upgradeBuilding'; buildingId: BuildingId }
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
  | 'unknown-item'
  | 'already-owned'
  | 'not-owned'
  | 'unknown-building'
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

/** Au-delà, l'absence est traitée par les gains hors-ligne (étape 6). */
export const MAX_TICKS_PER_ADVANCE = 7200;

const CLASS_IDS = Object.keys(CLASSES) as ClassId[];

function noMastery(): Record<ClassId, Decimal> {
  return Object.fromEntries(CLASS_IDS.map((id) => [id, D(0)])) as Record<ClassId, Decimal>;
}

/** Niveau de Maîtrise d'une Classe. */
export function masteryLevel(state: GameState, classId: ClassId): number {
  return masteryFromTotal(state.mastery[classId]).level;
}

/** Effets actuels des Bâtiments. */
export function effectsOf(state: GameState): BuildingEffects {
  return buildingEffects(state.buildings);
}

/** Tous les bonus du Syndicat qui touchent les Équipes. */
export function bonusesOf(state: GameState): GlobalBonuses {
  return {
    cashMult: 1,
    floorBonus: effectsOf(state).floorBonus,
    masteryLevels: Object.fromEntries(CLASS_IDS.map((id) => [id, masteryLevel(state, id)])),
    itemRanks: Object.fromEntries(Object.entries(state.items).map(([id, item]) => [id, item.rank])),
  };
}

function officeContext(state: GameState, now: number): OfficeContext {
  const effects = effectsOf(state);
  return { now, roster: state.roster, rarityWeights: effects.rarityWeights, candidates: effects.candidates };
}

function withPlayer(state: GameState, player: Player): GameState {
  return { ...state, roster: state.roster.map((p) => (p.id === player.id ? player : p)) };
}

/**
 * Après un changement de Talents ou d'équipement, la Couverture maximale peut changer : on garde la
 * Table en cours mais on ramène la Couverture dans les nouvelles limites.
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
  return buildTeamProfile(teamMembers(state, team), bonusesOf(state));
}

export function teamOf(state: GameState, playerId: string): TeamIndex | null {
  if (state.teams[0].memberIds.includes(playerId)) return 0;
  if (state.teams[1].memberIds.includes(playerId)) return 1;
  return null;
}

/** Joueur qui porte ce Gadget, s'il y en a un. */
export function wearerOf(state: GameState, itemId: string): Player | null {
  return state.roster.find((p) => p.gear.accessory === itemId || p.gear.gadget === itemId) ?? null;
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
  const emptyProfile = buildTeamProfile([], { cashMult: 1 });
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
    mastery: noMastery(),
    items: {},
    buildings: noBuildings(),
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
      // Les recrues d'une Classe bien maîtrisée arrivent avec des points de Talent.
      const roster = result.roster.map((p) =>
        p.id === action.candidateId ? { ...p, bonusTalentPoints: masteryBonusPoints(masteryLevel(state, p.classId)) } : p,
      );
      return { state: { ...state, office: result.office, roster, cash: result.cash }, error: null };
    }

    case 'refreshOffice': {
      const result = paidRefresh(
        { office: state.office, cash: state.cash, highestFloor: state.highestCleared },
        officeContext(state, now),
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

    case 'buyItem': {
      const item = ITEMS_BY_ID.get(action.itemId);
      if (!item) return fail(state, 'unknown-item');
      if (state.items[item.id]) return fail(state, 'already-owned');
      const cost = gadgetBuyCost(item.price);
      if (state.cash.lt(cost)) return fail(state, 'not-enough-cash');
      return { state: { ...state, cash: state.cash.sub(cost), items: { ...state.items, [item.id]: { rank: 1 } } }, error: null };
    }

    case 'upgradeItem': {
      const item = ITEMS_BY_ID.get(action.itemId);
      if (!item) return fail(state, 'unknown-item');
      const owned = state.items[item.id];
      if (!owned) return fail(state, 'not-owned');
      const cost = gadgetUpgradeCost(item.price, owned.rank);
      if (state.cash.lt(cost)) return fail(state, 'not-enough-cash');
      const next = { ...state, cash: state.cash.sub(cost), items: { ...state.items, [item.id]: { rank: owned.rank + 1 } } };
      const wearer = wearerOf(next, item.id);
      return { state: wearer ? refreshTeamOf(next, wearer.id) : next, error: null };
    }

    case 'equip': {
      const item = ITEMS_BY_ID.get(action.itemId);
      if (!item) return fail(state, 'unknown-item');
      if (!state.items[item.id]) return fail(state, 'not-owned');
      const player = state.roster.find((p) => p.id === action.playerId);
      if (!player) return fail(state, 'unknown-player');
      // Un Gadget n'est porté que par un Joueur à la fois : on le retire à son ancien porteur.
      let next = state;
      const previous = wearerOf(state, item.id);
      if (previous && previous.id !== player.id) {
        next = refreshTeamOf(withPlayer(next, { ...previous, gear: { ...previous.gear, [item.slot]: null } }), previous.id);
      }
      const target = next.roster.find((p) => p.id === player.id)!;
      next = withPlayer(next, { ...target, gear: { ...target.gear, [item.slot]: item.id } });
      return { state: refreshTeamOf(next, player.id), error: null };
    }

    case 'unequip': {
      const player = state.roster.find((p) => p.id === action.playerId);
      if (!player) return fail(state, 'unknown-player');
      const next = withPlayer(state, { ...player, gear: { ...player.gear, [action.slot]: null } });
      return { state: refreshTeamOf(next, player.id), error: null };
    }

    case 'upgradeBuilding': {
      if (!BUILDINGS[action.buildingId]) return fail(state, 'unknown-building');
      const level = state.buildings[action.buildingId];
      const cost = buildingCost(action.buildingId, level);
      if (state.cash.lt(cost)) return fail(state, 'not-enough-cash');
      return {
        state: { ...state, cash: state.cash.sub(cost), buildings: { ...state.buildings, [action.buildingId]: level + 1 } },
        error: null,
      };
    }

    case 'toggleScientific':
      return { state: { ...state, settings: { ...state.settings, scientific: !state.settings.scientific } }, error: null };
  }
}

/**
 * Distribue la Réputation gagnée par les Équipes : à parts égales entre leurs membres, plus une part
 * pour le banc grâce à la Salle d'entraînement. Toute Réputation nourrit la Maîtrise de sa Classe.
 */
export function distributeReputation(state: GameState, perTeam: [Decimal, Decimal]): GameState {
  const bench = state.roster.filter((p) => teamOf(state, p.id) === null);
  const benchPool = perTeam[0].add(perTeam[1]).mul(effectsOf(state).benchShare);
  const mastery = { ...state.mastery };

  const roster = state.roster.map((player) => {
    const team = teamOf(state, player.id);
    const share =
      team !== null
        ? perTeam[team].div(state.teams[team].memberIds.length)
        : bench.length > 0
          ? benchPool.div(bench.length)
          : D(0);
    if (share.lte(0)) return player;
    mastery[player.classId] = mastery[player.classId].add(share);
    return gainReputation(player, share);
  });
  return { ...state, roster, mastery };
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
  const teamReputation: [Decimal, Decimal] = [D(0), D(0)];

  for (let tick = 0; tick < ticks; tick++) {
    for (const team of [0, 1] as const) {
      if (profiles[team].members.length === 0) continue;
      const outcome = tickTeam(runs[team], profiles[team], { highestCleared }, rng);
      runs[team] = outcome.run;
      cash = cash.add(outcome.cash);
      teamReputation[team] = teamReputation[team].add(outcome.reputation);
      vip += outcome.vip;
      if (outcome.clearedFloor !== null) highestCleared = Math.max(highestCleared, outcome.clearedFloor);
      for (const event of outcome.events) {
        if (event.type === 'jackpot') jackpots += 1;
        events.push({ ...event, team });
      }
    }
  }

  const withReputation = distributeReputation(state, teamReputation);
  const next: GameState = {
    ...withReputation,
    cash,
    vip,
    highestCleared,
    pendingMs,
    teams: [
      { ...state.teams[0], run: runs[0] },
      { ...state.teams[1], run: runs[1] },
    ],
    stats: { ...state.stats, jackpots },
    office: refreshIfDue(state.office, officeContext(state, now)),
  };
  // On ne garde que les derniers événements : l'interface n'en affiche que quelques-uns.
  return { state: next, ticks, events: events.slice(-50) };
}
