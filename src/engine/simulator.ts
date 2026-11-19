// Simulateur d'équilibrage : joue une partie « raisonnable » à toute vitesse,
// avec les VRAIES règles du jeu (mêmes actions que l'interface), pour vérifier le rythme.
//
// Le joueur simulé :
//   - joue 4 sessions de 30 minutes par jour (à 0 h, 4 h, 8 h et 12 h), le reste du temps il est absent ;
//   - toutes les 10 secondes de session :
//       1. complète ses Équipes avec le Candidat le moins cher (Équipe 2 dès l'Étage 10) ;
//       2. dépense le reste de son Cash dans l'achat le moins cher : Gadget, rang de Gadget ou Bâtiment ;
//       3. équipe les Gadgets libres sur les membres de ses Équipes ;
//       4. dépense ses points de Talent dans la première branche de chaque Classe
//          (Talent ultime compris dès la Maîtrise 5).
import { BALANCE } from '../data/balance';
import { BUILDING_IDS } from '../data/buildings';
import { ITEMS } from '../data/items';
import { BRANCHES, TALENTS } from '../data/talents';
import { CLASSES } from '../data/classes';
import { D, type Decimal } from './bignum';
import { buildingCost } from './buildings';
import { gadgetBuyCost, gadgetUpgradeCost, recruitCost } from './economy';
import {
  advanceGame,
  applyAction,
  applyOffline,
  isTeamUnlocked,
  masteryLevel,
  newGame,
  wearerOf,
  type GameAction,
  type GameState,
  type TeamIndex,
} from './game';
import { learnTalent, talentPoints } from './talents';
import type { Player } from './types';

export interface SimulationOptions {
  /** Arrêt après ce nombre d'heures simulées. */
  maxHours: number;
  /** Arrêt dès que cet Étage est validé. */
  targetFloor: number;
  seed?: number;
  /** false : n'achète ni Gadget ni Bâtiment (pour mesurer leur effet). */
  shopping?: boolean;
}

export interface SimulationResult {
  /** Heures écoulées quand chaque Étage a été validé pour la première fois. */
  hoursToFloor: Map<number, number>;
  highestCleared: number;
  hours: number;
  state: GameState;
}

const SESSION_STARTS_HOURS = [0, 4, 8, 12];
const SESSION_HOURS = 0.5;
const STEP_SECONDS = 10;
const START = Date.UTC(2026, 5, 1);

function starter(): Player {
  return {
    id: 'sim-start',
    name: 'Départ',
    gender: 'm',
    classId: 'gambler',
    rarity: 'common',
    quality: 100,
    baseStats: { ...CLASSES.gambler.baseStats },
    traitIds: [],
    level: 1,
    reputation: D(0),
    talents: {},
    bonusTalentPoints: 0,
    gear: { accessory: null, gadget: null },
  };
}

const act = (state: GameState, action: GameAction, now: number) => applyAction(state, action, now).state;

/** Dépense les points dans la première branche de la Classe, puis son ultime et son Talent sans limite. */
function spendTalents(state: GameState, now: number): GameState {
  let current = state;
  for (const player of state.roster) {
    if (talentPoints(player).available <= 0) continue;
    const branch = BRANCHES.find((b) => b.classId === player.classId);
    const order = TALENTS.filter((t) => t.classId === player.classId && t.branchId === branch?.id);
    const mastery = masteryLevel(current, player.classId);
    let p = current.roster.find((r) => r.id === player.id)!;
    for (let guard = 0; guard < 500 && talentPoints(p).available > 0; guard++) {
      const talent = order.find((t) => learnTalent(p, t.id, mastery).refusal === null);
      if (!talent) break;
      current = act(current, { type: 'learnTalent', playerId: p.id, talentId: talent.id }, now);
      p = current.roster.find((r) => r.id === player.id)!;
    }
  }
  return current;
}

function openTeam(state: GameState): TeamIndex | null {
  for (const team of [0, 1] as const) {
    if (isTeamUnlocked(state, team) && state.teams[team].memberIds.length < BALANCE.teamSize) return team;
  }
  return null;
}

/** Complète les Équipes, puis achète le moins cher tant que le Cash le permet. */
function spend(state: GameState, now: number, shopping: boolean): GameState {
  let current = state;
  for (let guard = 0; guard < 300; guard++) {
    const team = openTeam(current);
    let reserve: Decimal = D(0);
    if (team !== null) {
      const cheapest = [...current.office.candidates].sort((a, b) =>
        recruitCost(a.rarity, current.highestCleared).cmp(recruitCost(b.rarity, current.highestCleared)),
      )[0];
      if (cheapest) {
        const cost = recruitCost(cheapest.rarity, current.highestCleared);
        if (current.cash.gte(cost)) {
          current = act(current, { type: 'hire', candidateId: cheapest.id }, now);
          current = act(current, { type: 'assign', playerId: cheapest.id, team }, now);
          continue;
        }
        reserve = cost;
      }
    }

    const options: { cost: Decimal; action: GameAction }[] = [
      ...ITEMS.map((item) => {
        const owned = current.items[item.id];
        return owned
          ? { cost: gadgetUpgradeCost(item.price, owned.rank), action: { type: 'upgradeItem', itemId: item.id } as GameAction }
          : { cost: gadgetBuyCost(item.price), action: { type: 'buyItem', itemId: item.id } as GameAction };
      }),
      ...BUILDING_IDS.map((id) => ({
        cost: buildingCost(id, current.buildings[id]),
        action: { type: 'upgradeBuilding', buildingId: id } as GameAction,
      })),
    ];
    const best = options.sort((a, b) => a.cost.cmp(b.cost))[0];
    if (!shopping || !best || current.cash.sub(reserve).lt(best.cost)) break;
    current = act(current, best.action, now);
  }
  return equipFreeGadgets(current, now);
}

/** Met chaque Gadget libre sur un membre d'Équipe dont l'emplacement est vide (sa Classe en priorité). */
function equipFreeGadgets(state: GameState, now: number): GameState {
  let current = state;
  const members = () =>
    [...current.teams[0].memberIds, ...current.teams[1].memberIds].map((id) => current.roster.find((p) => p.id === id)!);
  for (const item of ITEMS) {
    if (!current.items[item.id] || wearerOf(current, item.id)) continue;
    const free = members().filter((p) => p.gear[item.slot] === null);
    const target = free.find((p) => p.classId === item.classId) ?? (item.classId ? undefined : free[0]);
    if (target) current = act(current, { type: 'equip', playerId: target.id, itemId: item.id }, now);
  }
  return current;
}

export function simulatePlaythrough(options: SimulationOptions): SimulationResult {
  const hoursToFloor = new Map<number, number>();
  let state = newGame(options.seed ?? 2026, START, starter());
  let hours = 0;

  const done = () => state.highestCleared >= options.targetFloor || hours >= options.maxHours;
  const now = () => START + hours * 3_600_000;

  const playOnline = (durationHours: number) => {
    const steps = Math.round((durationHours * 3600) / STEP_SECONDS);
    for (let step = 0; step < steps && !done(); step++) {
      state = spendTalents(spend(state, now(), options.shopping ?? true), now());
      const before = state.highestCleared;
      state = advanceGame(state, STEP_SECONDS * 1000, now(), 'expected').state;
      hours += STEP_SECONDS / 3600;
      for (let floor = before + 1; floor <= state.highestCleared; floor++) hoursToFloor.set(floor, hours);
    }
  };

  const playOffline = (durationHours: number) => {
    state = applyOffline(state, durationHours * 3600).state;
    hours += durationHours;
  };

  while (!done()) {
    const dayStart = Math.floor(hours / 24) * 24;
    for (let i = 0; i < SESSION_STARTS_HOURS.length && !done(); i++) {
      hours = Math.max(hours, dayStart + SESSION_STARTS_HOURS[i]!);
      playOnline(SESSION_HOURS);
      const nextStart = (SESSION_STARTS_HOURS[i + 1] ?? 24) + dayStart;
      if (!done() && nextStart > hours) playOffline(nextStart - hours);
    }
  }

  return { hoursToFloor, highestCleared: state.highestCleared, hours, state };
}
