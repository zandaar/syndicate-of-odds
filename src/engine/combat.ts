// Combat : résolution d'une Table, tick par tick.
//
// Un tick (0,5 s) se déroule ainsi :
//   1. chaque membre rafle dans la Caisse (Jackpot possible) ; le raflé devient du Cash et de la Réputation ;
//   2. si la Caisse est vide : Étage validé, prime de fin d'Étage, Jetons VIP au premier passage d'un Boss ;
//   3. sinon la sécurité fait naître des Soupçons qui entament la Couverture ; si elle tombe à zéro,
//      l'Équipe est grillée et se replie.
//
// Le mode « expected » remplace le hasard par sa moyenne : il sert au hors-ligne et au simulateur.
import { BALANCE } from '../data/balance';
import { D, ZERO, type Decimal } from './bignum';
import type { MemberProfile, TeamProfile } from './economy';
import { getFloor } from './floors';
import type { Rng } from './random';
import type { FloorSpec } from './types';

export interface TableState {
  vault: Decimal;
  cover: Decimal;
  /** Ticks déjà joués sur cette Table. */
  tick: number;
  /** Nombre d'attaques de chaque membre (pour les Jackpots garantis), dans l'ordre de l'Équipe. */
  attacks: number[];
  /** Jackpots d'affilée de chaque membre (Série noire). */
  streaks: number[];
  /** « Inébranlable » déjà utilisé sur cette Table. */
  lastStandUsed: boolean;
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
  /** Cash gagné pendant ce tick (Rafle + prime éventuelle). */
  cash: Decimal;
  /** Réputation gagnée par toute l'Équipe pendant ce tick (à partager entre ses membres). */
  reputation: Decimal;
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

function minDecimal(a: Decimal, b: Decimal): Decimal {
  return a.lt(b) ? a : b;
}

/** Caisse de départ d'une Table (Dynamite entame celle des Boss). */
function startingVault(floor: FloorSpec, profile: TeamProfile): Decimal {
  return floor.isBoss ? floor.vault.mul(1 - profile.bossVaultCut) : floor.vault;
}

function newTable(floor: number, profile: TeamProfile): TableState {
  return {
    vault: startingVault(getFloor(floor), profile),
    cover: profile.maxCover,
    tick: 0,
    attacks: profile.members.map(() => 0),
    streaks: profile.members.map(() => 0),
    lastStandUsed: false,
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

/** Rafle d'un membre pendant ce tick. */
function memberDrain(
  member: MemberProfile,
  index: number,
  context: { floor: FloorSpec; table: TableState; coverRatio: number; vaultRatio: number; roll: Roll },
): { amount: Decimal; jackpots: number; attack: number; streak: number; jackpot: Decimal | null } {
  const { floor, table, coverRatio, vaultRatio, roll } = context;
  const attack = (table.attacks[index] ?? 0) + 1;
  const streak = table.streaks[index] ?? 0;

  let bonus = floor.isBoss ? member.drainBonus.boss : member.drainBonus.normal;
  for (const low of member.lowCover) if (coverRatio < low.threshold) bonus += low.value;
  if (floor.isBoss) for (const finisher of member.bossFinisher) if (vaultRatio < finisher.threshold) bonus += finisher.value;

  const ramp = member.ramp ? 1 + Math.min(member.ramp.start + member.ramp.perTick * table.tick, member.ramp.cap) : 1;
  const base = (floor.isBoss ? member.flairBoss : member.flair).mul((1 + bonus) * ramp);
  const mult = floor.isBoss ? member.jackpotMultBoss : member.jackpotMult;
  const guaranteed = member.guaranteedEvery !== null && attack % member.guaranteedEvery === 0;

  if (roll === 'expected') {
    const chance = guaranteed ? 1 : member.jackpotChance;
    const chained = mult * (1 + member.jackpotChain * (mult - 1));
    const streakBonus = member.jackpotStreak && chance < 1
      ? Math.min(member.jackpotStreak.cap, member.jackpotStreak.perStep * (chance / (1 - chance)))
      : member.jackpotStreak ? member.jackpotStreak.cap : 0;
    return {
      amount: base.mul(1 + chance * (chained * (1 + streakBonus) - 1)),
      jackpots: chance,
      attack,
      streak,
      jackpot: null,
    };
  }

  const isJackpot = guaranteed || roll() < member.jackpotChance;
  if (!isJackpot) return { amount: base, jackpots: 0, attack, streak: 0, jackpot: null };
  const streakBonus = member.jackpotStreak ? Math.min(member.jackpotStreak.cap, member.jackpotStreak.perStep * streak) : 0;
  let amount = base.mul(mult * (1 + streakBonus));
  if (member.jackpotChain > 0 && roll() < member.jackpotChain) amount = amount.mul(mult);
  return { amount, jackpots: 1, attack, streak: streak + 1, jackpot: amount };
}

/** Fait avancer une Équipe d'un tick. */
export function tickTeam(run: TeamRun, profile: TeamProfile, context: TickContext, roll: Roll): TickOutcome {
  const quiet = { cash: ZERO, reputation: ZERO, vip: 0, clearedFloor: null, events: [] };

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
  const coverRatio = profile.maxCover.gt(0) ? table.cover.div(profile.maxCover).toNumber() : 0;
  const vaultRatio = table.vault.div(floor.vault).toNumber();

  // 1. Rafle de chaque membre.
  let drain = D(0);
  let jackpots = 0;
  const attacks: number[] = [];
  const streaks: number[] = [];
  profile.members.forEach((member, index) => {
    const result = memberDrain(member, index, { floor, table, coverRatio, vaultRatio, roll });
    drain = drain.add(result.amount);
    jackpots += result.jackpots;
    attacks.push(result.attack);
    streaks.push(result.streak);
    if (result.jackpot) events.push({ type: 'jackpot', playerId: member.playerId, amount: result.jackpot });
  });

  let drained = minDecimal(drain, table.vault);
  let vault = table.vault.sub(drained);

  // 2. Victoire.
  if (vault.lte(0)) return victory(run, profile, context, floor, drained, roll, events);

  // 3. Riposte de la sécurité.
  const bossFactor = (1 + floor.bossPressureExtra * profile.bossPressureMult) / (1 + floor.bossPressureExtra);
  const stealth = floor.isBoss ? profile.stealth.mul(profile.bossStealthMult) : profile.stealth;
  const reduction = stealth.div(stealth.add(floor.stealthScale));
  let factor = profile.pressureMult * bossFactor;
  for (const shield of profile.earlyShields) if (table.tick < shield.ticks) factor *= 1 - shield.value;
  if (profile.blackout && table.tick % profile.blackout.every < profile.blackout.duration) factor *= 1 - profile.blackout.value;
  if (profile.dodgeEvery !== null && (table.tick + 1) % profile.dodgeEvery === 0) factor = 0;
  const suspicion = floor.pressure.mul(factor).mul(D(1).sub(reduction));

  // Contre-bluff : une part des Soupçons est raflée dans la Caisse.
  if (profile.reflect > 0) {
    const reflected = minDecimal(suspicion.mul(profile.reflect), vault);
    drained = drained.add(reflected);
    vault = vault.sub(reflected);
    if (vault.lte(0)) return victory(run, profile, context, floor, drained, roll, events);
  }

  const healed = minDecimal(table.cover.add(profile.maxCover.mul(profile.jackpotHeal * jackpots)), profile.maxCover);
  let cover = healed.sub(suspicion);
  let lastStandUsed = table.lastStandUsed;
  if (cover.lte(0) && profile.lastStand && !lastStandUsed) {
    cover = profile.maxCover.mul(0.01);
    lastStandUsed = true;
  }

  const cash = drained.mul(profile.cashMult);
  const reputation = drained.mul(profile.reputationMult);

  if (cover.lte(0)) {
    events.push({ type: 'burned', floor: run.floor });
    const retreatFloor = run.safeRetreat ? Math.max(1, run.floor - 1) : run.floor;
    return {
      run: { ...run, floor: retreatFloor, phase: { kind: 'retreat', ticksLeft: BALANCE.retreatTicks } },
      cash,
      reputation,
      vip: 0,
      clearedFloor: null,
      events,
    };
  }

  return {
    run: { ...run, phase: { kind: 'table', table: { vault, cover, tick: table.tick + 1, attacks, streaks, lastStandUsed } } },
    cash,
    reputation,
    vip: 0,
    clearedFloor: null,
    events,
  };
}

function victory(
  run: TeamRun,
  profile: TeamProfile,
  context: TickContext,
  floor: FloorSpec,
  drained: Decimal,
  roll: Roll,
  events: TeamEvent[],
): TickOutcome {
  const bossBonus = floor.isBoss ? profile.bossFloorBonusMult : 1;
  const bonus = floor.vault.mul(BALANCE.floorBonusRatio * profile.floorBonusMult * bossBonus * profile.cashMult);
  const reputation = drained.add(floor.vault.mul(BALANCE.reputation.floorBonusRatio)).mul(profile.reputationMult);

  let vip = floor.isBoss && floor.floor > context.highestCleared ? floor.vipReward : 0;
  if (!floor.isBoss && profile.vipFind > 0) {
    vip += roll === 'expected' ? profile.vipFind : roll() < profile.vipFind ? 1 : 0;
  }

  const nextFloor = run.auto ? run.floor + 1 : run.floor;
  events.push({ type: 'victory', floor: run.floor });
  return {
    run: { ...run, floor: nextFloor, phase: { kind: 'table', table: newTable(nextFloor, profile) } },
    cash: drained.mul(profile.cashMult).add(bonus),
    reputation,
    vip,
    clearedFloor: run.floor,
    events,
  };
}
