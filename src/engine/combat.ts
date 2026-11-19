// Combat : résolution d'une Table, tick par tick.
//
// Un tick (0,5 s) se déroule ainsi :
//   1. chaque membre draine la Caisse (Jackpot possible) ; le drainé devient du Cash ;
//   2. si la Caisse est vide : Étage validé, prime de fin d'Étage, Jetons VIP au premier passage d'un Boss ;
//   3. sinon la sécurité frappe la Couverture ; si elle tombe à zéro, l'Équipe est grillée et se replie.
//
// Le mode « expected » remplace le hasard par sa moyenne : il sert au hors-ligne et au simulateur.
import { BALANCE } from '../data/balance';
import { D, ZERO, type Decimal } from './bignum';
import type { TeamProfile } from './economy';
import { getFloor } from './floors';
import type { Rng } from './random';

export interface TableState {
  vault: Decimal;
  cover: Decimal;
  /** Ticks déjà joués sur cette Table. */
  tick: number;
  /** Nombre d'attaques de chaque membre (pour les Jackpots garantis), dans l'ordre de l'Équipe. */
  attacks: number[];
}

export type TeamPhase = { kind: 'table'; table: TableState } | { kind: 'retreat'; ticksLeft: number };

/** Où en est une Équipe. */
export interface TeamRun {
  floor: number;
  /** Auto : passer à l'Étage suivant après une victoire. */
  auto: boolean;
  /** Repli sécurisé : reculer d'un Étage après une Couverture grillée. */
  safeRetreat: boolean;
  phase: TeamPhase;
}

export type TeamEvent =
  | { type: 'jackpot'; playerId: string; amount: Decimal }
  | { type: 'victory'; floor: number }
  | { type: 'burned'; floor: number };

export interface TickOutcome {
  run: TeamRun;
  /** Cash gagné pendant ce tick (drain + prime éventuelle). */
  cash: Decimal;
  vip: number;
  /** Étage validé pendant ce tick, sinon null. */
  clearedFloor: number | null;
  events: TeamEvent[];
}

export interface TickContext {
  /** Étage le plus haut déjà validé par le Syndicat (pour les Jetons VIP des Boss). */
  highestCleared: number;
}

/** `Rng` pour un vrai tirage, `'expected'` pour la moyenne. */
export type Roll = Rng | 'expected';

function newTable(floor: number, profile: TeamProfile): TableState {
  return {
    vault: getFloor(floor).vault,
    cover: profile.maxCover,
    tick: 0,
    attacks: profile.members.map(() => 0),
  };
}

/** Place une Équipe à la Table d'un Étage. */
export function startTeamRun(
  floor: number,
  profile: TeamProfile,
  options: { auto?: boolean; safeRetreat?: boolean } = {},
): TeamRun {
  return {
    floor,
    auto: options.auto ?? true,
    safeRetreat: options.safeRetreat ?? false,
    phase: { kind: 'table', table: newTable(floor, profile) },
  };
}

/** Fait avancer une Équipe d'un tick. */
export function tickTeam(run: TeamRun, profile: TeamProfile, context: TickContext, roll: Roll): TickOutcome {
  const quiet = { cash: ZERO, vip: 0, clearedFloor: null, events: [] };

  if (run.phase.kind === 'retreat') {
    const ticksLeft = run.phase.ticksLeft - 1;
    const phase: TeamPhase =
      ticksLeft > 0 ? { kind: 'retreat', ticksLeft } : { kind: 'table', table: newTable(run.floor, profile) };
    return { ...quiet, run: { ...run, phase } };
  }

  if (profile.members.length === 0) return { ...quiet, run };

  const floor = getFloor(run.floor);
  const table = run.phase.table;
  const events: TeamEvent[] = [];

  // 1. Drain de chaque membre.
  let drain = D(0);
  let jackpots = 0;
  const attacks = profile.members.map((member, index) => {
    const attackNumber = (table.attacks[index] ?? 0) + 1;
    const bonus = floor.isBoss ? member.drainBonus.boss : member.drainBonus.normal;
    const ramp = member.ramp ? 1 + Math.min(member.ramp.perTick * table.tick, member.ramp.cap) : 1;
    const base = member.flair.mul((1 + bonus) * ramp);
    const guaranteed = member.guaranteedEvery !== null && attackNumber % member.guaranteedEvery === 0;

    if (roll === 'expected') {
      const chance = guaranteed ? 1 : member.jackpotChance;
      drain = drain.add(base.mul(1 + chance * (member.jackpotMult - 1)));
      jackpots += chance;
    } else {
      const isJackpot = guaranteed || roll() < member.jackpotChance;
      const amount = isJackpot ? base.mul(member.jackpotMult) : base;
      drain = drain.add(amount);
      if (isJackpot) {
        jackpots += 1;
        events.push({ type: 'jackpot', playerId: member.playerId, amount });
      }
    }
    return attackNumber;
  });

  const drained = minDecimal(drain, table.vault);
  const vault = table.vault.sub(drained);
  let cash = drained.mul(profile.cashMult);

  // 2. Victoire.
  if (vault.lte(0)) {
    const bonus = floor.vault.mul(BALANCE.floorBonusRatio * profile.floorBonusMult * profile.cashMult);
    cash = cash.add(bonus);
    const vip = floor.isBoss && floor.floor > context.highestCleared ? floor.vipReward : 0;
    const nextFloor = run.auto ? run.floor + 1 : run.floor;
    events.push({ type: 'victory', floor: run.floor });
    return {
      run: { ...run, floor: nextFloor, phase: { kind: 'table', table: newTable(nextFloor, profile) } },
      cash,
      vip,
      clearedFloor: run.floor,
      events,
    };
  }

  // 3. Riposte de la sécurité.
  const bossFactor = (1 + floor.bossPressureExtra * profile.bossPressureMult) / (1 + floor.bossPressureExtra);
  const reduction = profile.stealth.div(profile.stealth.add(floor.stealthScale));
  const shield = profile.earlyShield && table.tick < profile.earlyShield.ticks ? 1 - profile.earlyShield.value : 1;
  const damage = floor.pressure
    .mul(profile.pressureMult * bossFactor * shield)
    .mul(D(1).sub(reduction));
  const healed = minDecimal(table.cover.add(profile.maxCover.mul(profile.jackpotHeal * jackpots)), profile.maxCover);
  const cover = healed.sub(damage);

  if (cover.lte(0)) {
    events.push({ type: 'burned', floor: run.floor });
    const retreatFloor = run.safeRetreat ? Math.max(1, run.floor - 1) : run.floor;
    return {
      run: { ...run, floor: retreatFloor, phase: { kind: 'retreat', ticksLeft: BALANCE.retreatTicks } },
      cash,
      vip: 0,
      clearedFloor: null,
      events,
    };
  }

  return {
    run: { ...run, phase: { kind: 'table', table: { vault, cover, tick: table.tick + 1, attacks } } },
    cash,
    vip: 0,
    clearedFloor: null,
    events,
  };
}

function minDecimal(a: Decimal, b: Decimal): Decimal {
  return a.lt(b) ? a : b;
}
