// Recrutement : génération des Candidats et Bureau de recrutement.
import { BALANCE, RARITY } from '../data/balance';
import { CLASSES } from '../data/classes';
import { LEGENDARIES } from '../data/names/legendaries';
import { TRAITS } from '../data/traits';
import { D, type Decimal } from './bignum';
import { recruitCost } from './economy';
import { generateIdentity, pick } from './names';
import { createRng, type Rng } from './random';
import type { BaseStats, ClassId, Player, Rarity, StatId } from './types';

const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
const RARITIES = Object.keys(RARITY) as Rarity[];
const STATS: StatId[] = ['flair', 'luck', 'composure', 'stealth'];
const REGULAR_TRAITS = TRAITS.filter((trait) => !trait.legendaryOnly);

export type RarityWeights = Record<Rarity, number>;

export const DEFAULT_RARITY_WEIGHTS: RarityWeights = {
  common: RARITY.common.weight,
  rare: RARITY.rare.weight,
  epic: RARITY.epic.weight,
  legendary: RARITY.legendary.weight,
};

export interface CandidateOptions {
  now: Date;
  /** Noms déjà pris : roster et autres Candidats. */
  takenNames: ReadonlySet<string>;
  /** Chances de chaque Rareté (le Réseau « Indics » les améliorera). */
  rarityWeights?: RarityWeights;
  /** Impose la Classe (par exemple le Flambeur offert au départ). */
  classId?: ClassId;
}

function pickRarity(rng: Rng, weights: RarityWeights): Rarity {
  const total = RARITIES.reduce((sum, rarity) => sum + weights[rarity], 0);
  let roll = rng() * total;
  for (const rarity of RARITIES) {
    roll -= weights[rarity];
    if (roll < 0) return rarity;
  }
  return 'common';
}

function pickTraits(rng: Rng, count: number): string[] {
  const chosen = new Set<string>();
  while (chosen.size < count) chosen.add(pick(rng, REGULAR_TRAITS).id);
  return [...chosen];
}

/** Tire un nouveau Candidat. */
export function generateCandidate(rng: Rng, options: CandidateOptions): Player {
  const identity = generateIdentity(rng, {
    classId: options.classId ?? pick(rng, CLASS_IDS),
    rarity: pickRarity(rng, options.rarityWeights ?? DEFAULT_RARITY_WEIGHTS),
    now: options.now,
    takenNames: options.takenNames,
  });
  const rarity = RARITY[identity.rarity];
  const reference = CLASSES[identity.classId].baseStats;
  const spread = BALANCE.office.qualitySpread;

  const rolls = STATS.map(() => 1 + (rng() * 2 - 1) * spread);
  const baseStats = Object.fromEntries(
    STATS.map((stat, i) => [stat, reference[stat] * rarity.stats * rolls[i]!]),
  ) as unknown as BaseStats;
  const quality = Math.round((rolls.reduce((sum, roll) => sum + roll, 0) / rolls.length) * 100);

  const legendary = LEGENDARIES.find((entry) => entry.id === identity.legendaryId);
  const traitIds = legendary
    ? [legendary.uniqueTraitId, ...pickTraits(rng, rarity.traits - 1)]
    : pickTraits(rng, rarity.traits);

  return {
    id: `j-${Math.floor(rng() * 2 ** 32).toString(36)}${Math.floor(rng() * 2 ** 32).toString(36)}`,    name: identity.name,
    gender: identity.gender,
    classId: identity.classId,
    rarity: identity.rarity,
    quality,
    baseStats,
    traitIds,
    level: 1,
    reputation: D(0),
    talents: {},
    bonusTalentPoints: 0,
    gear: { accessory: null, gadget: null },
  };
}

// ---------------------------------------------------------------------
// Bureau de recrutement
// ---------------------------------------------------------------------

export interface RecruitmentOffice {
  candidates: Player[];
  /** Heure (ms) du dernier renouvellement. */
  refreshedAt: number;
  /** Graine du prochain tirage : le Bureau se sauvegarde tel quel. */
  seed: number;
}

export interface OfficeContext {
  /** Heure actuelle en millisecondes (Date.now()). */
  now: number;
  roster: Player[];
  rarityWeights?: RarityWeights;
}

export type OfficeFailure = { ok: false; reason: 'not-enough-cash' | 'roster-full' | 'unknown-candidate' };

function drawCandidates(seed: number, context: OfficeContext, refreshedAt: number): RecruitmentOffice {
  const rng = createRng(seed);
  const taken = new Set(context.roster.map((player) => player.name));
  const candidates: Player[] = [];
  for (let i = 0; i < BALANCE.office.candidates; i++) {
    const candidate = generateCandidate(rng, {
      now: new Date(context.now),
      takenNames: taken,
      ...(context.rarityWeights ? { rarityWeights: context.rarityWeights } : {}),
    });
    taken.add(candidate.name);
    candidates.push(candidate);
  }
  return { candidates, refreshedAt, seed: Math.floor(rng() * 2 ** 32) };
}

/** Ouvre le Bureau avec ses premiers Candidats. */
export function openOffice(seed: number, context: OfficeContext): RecruitmentOffice {
  return drawCandidates(seed, context, context.now);
}

/** Renouvelle gratuitement les Candidats si 20 minutes sont passées. */
export function refreshIfDue(office: RecruitmentOffice, context: OfficeContext): RecruitmentOffice {
  const due = context.now - office.refreshedAt >= BALANCE.office.refreshMinutes * 60_000;
  return due ? drawCandidates(office.seed, context, context.now) : office;
}

/** Prix d'un renouvellement immédiat. */
export function paidRefreshCost(highestFloor: number): Decimal {
  return recruitCost('common', highestFloor).mul(BALANCE.office.paidRefreshRatio);
}

/** Renouvelle tout de suite les Candidats contre du Cash. */
export function paidRefresh(
  wallet: { office: RecruitmentOffice; cash: Decimal; highestFloor: number },
  context: OfficeContext,
): { ok: true; office: RecruitmentOffice; cash: Decimal } | OfficeFailure {
  const cost = paidRefreshCost(wallet.highestFloor);
  if (wallet.cash.lt(cost)) return { ok: false, reason: 'not-enough-cash' };
  return { ok: true, office: drawCandidates(wallet.office.seed, context, context.now), cash: wallet.cash.sub(cost) };
}

/** Embauche un Candidat : il rejoint le roster contre son prix. */
export function hireCandidate(
  state: { office: RecruitmentOffice; roster: Player[]; cash: Decimal; highestFloor: number; rosterSize?: number },
  candidateId: string,
): { ok: true; office: RecruitmentOffice; roster: Player[]; cash: Decimal } | OfficeFailure {
  const candidate = state.office.candidates.find((c) => c.id === candidateId);
  if (!candidate) return { ok: false, reason: 'unknown-candidate' };
  if (state.roster.length >= (state.rosterSize ?? BALANCE.office.rosterSize)) return { ok: false, reason: 'roster-full' };
  const cost = recruitCost(candidate.rarity, state.highestFloor);
  if (state.cash.lt(cost)) return { ok: false, reason: 'not-enough-cash' };
  return {
    ok: true,
    office: { ...state.office, candidates: state.office.candidates.filter((c) => c.id !== candidateId) },
    roster: [...state.roster, candidate],
    cash: state.cash.sub(cost),
  };
}

/** Cash rendu quand on renvoie ce Joueur : une part de son prix d'embauche actuel. */
export function dismissRefund(player: Player, highestFloor: number): Decimal {
  return recruitCost(player.rarity, highestFloor).mul(BALANCE.office.dismissRefund);
}

/** Renvoie un Joueur : il quitte le roster et rend une part de son prix d'embauche. */
export function dismissPlayer(roster: Player[], playerId: string, highestFloor: number): { roster: Player[]; refund: Decimal } {
  const player = roster.find((p) => p.id === playerId);
  if (!player) return { roster, refund: D(0) };
  return { roster: roster.filter((p) => p.id !== playerId), refund: dismissRefund(player, highestFloor) };
}
