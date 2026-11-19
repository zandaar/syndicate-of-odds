// Génération des noms selon docs/charte-des-noms.md.
// Casinos et Boss sont déduits de leur numéro (ADR 0002) ; les Joueurs sont tirés au hasard.
import { BALANCE } from '../data/balance';
import { CASINO_TIERS, CASINO_WINKS, COLORS, EMBLEMS, HANDMADE_BOSS_TITLES, HANDMADE_CASINOS, PLACES, type Ambiance, type Noun } from '../data/names/casinos';
import { LEGENDARIES } from '../data/names/legendaries';
import { EVENTS, NICKNAMES, WINKS, type EventId, type Gendered } from '../data/names/nicknames';
import { PEOPLE, type Origin } from '../data/names/people';
import { createRng, type Rng } from './random';
import type { ClassId, Rarity } from './types';

export type Gender = 'm' | 'f';

export interface CasinoInfo {
  number: number;
  name: string;
  /** Palier de prestige : 0 (Tripots) à 3 (noms mythiques). */
  tier: number;
  ambiance: Ambiance;
}

export interface BossInfo {
  title: string;
  name: string;
  gender: Gender;
}

export interface Identity {
  name: string;
  gender: Gender;
  classId: ClassId;
  rarity: Rarity;
  /** Identifiant du Légendaire, s'il en est un. */
  legendaryId: string | null;
}

const MAX = BALANCE.names.maxLength;

/** Mélange des nombres en une graine (même entrée → même graine). */
export function hashSeed(...parts: number[]): number {
  let hash = 0x811c9dc5;
  for (const part of parts) {
    hash = Math.imul(hash ^ (part | 0), 0x01000193);
    hash = Math.imul(hash ^ Math.floor(part / 2 ** 32), 0x01000193);
    hash ^= hash >>> 15;
  }
  return hash >>> 0;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('Liste vide');
  return item;
}

function pickWeighted<T>(rng: Rng, items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

function withArticle(noun: Noun): string {
  if (noun.elide) return `L'${noun.word}`;
  return `${noun.gender === 'm' ? 'Le' : 'La'} ${noun.word}`;
}

function withDe(noun: Noun): string {
  if (noun.elide) return `de l'${noun.word}`;
  return `${noun.gender === 'm' ? 'du' : 'de la'} ${noun.word}`;
}

function tierOf(casino: number): number {
  return CASINO_TIERS.findIndex((tier) => casino <= tier.upToCasino);
}

/** Le Casino numéro `casino` (le Casino 1 couvre les Étages 1 à 10). */
export function getCasino(casino: number): CasinoInfo {
  if (!Number.isInteger(casino) || casino < 1) throw new Error(`Numéro de Casino invalide : ${casino}`);
  const tierIndex = tierOf(casino);
  const tier = CASINO_TIERS[tierIndex]!;

  const handmade = HANDMADE_CASINOS[casino - 1];
  if (handmade) return { number: casino, name: handmade.name, tier: tierIndex, ambiance: handmade.ambiance };

  const rng = createRng(hashSeed(casino, 0xca51));
  const ambiance = pick(rng, tier.ambiances);
  if (rng() < BALANCE.names.casinoWinkChance) {
    return { number: casino, name: pick(rng, CASINO_WINKS), tier: tierIndex, ambiance };
  }

  let name = '';
  do {
    const pattern = rng();
    const type = pick(rng, tier.types);
    const emblem = pick(rng, EMBLEMS);
    const color = pick(rng, COLORS)[emblem.gender];
    if (pattern < 0.4) name = `${withArticle(type)} ${pick(rng, PLACES)}`;
    else if (pattern < 0.8) name = `${withArticle(type)} ${withDe(emblem)} ${color}`;
    else name = `${withArticle(emblem)} ${color}`;
  } while (name.length > MAX.casino);

  return { number: casino, name, tier: tierIndex, ambiance };
}

/** Le Boss de l'Étage `floor` (un Étage multiple de 5). */
export function getBoss(floor: number): BossInfo {
  if (!Number.isInteger(floor) || floor < 1 || floor % BALANCE.bossEvery !== 0) {
    throw new Error(`L'Étage ${floor} n'a pas de Boss`);
  }
  const rng = createRng(hashSeed(floor, 0xb055));
  const handmade = HANDMADE_BOSS_TITLES[floor / BALANCE.bossEvery - 1];

  let title: string;
  let gender: Gender;
  if (handmade) {
    title = handmade.title;
    gender = handmade.gender;
  } else {
    const tier = CASINO_TIERS[tierOf(Math.ceil(floor / BALANCE.floorsPerCasino))]!;
    const titles = floor % BALANCE.floorsPerCasino === 0 ? tier.bossTitles.final : tier.bossTitles.mid;
    gender = rng() < 0.5 ? 'm' : 'f';
    title = pick(rng, titles)[gender];
  }

  return { title, name: composeName(rng, gender, null), gender };
}

/** Événement daté en cours, s'il y en a un. */
export function activeEvent(now: Date): EventId | null {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  for (const [id, event] of Object.entries(EVENTS) as [EventId, (typeof EVENTS)[EventId]][]) {
    if (event.month === month && day >= event.fromDay && day <= event.toDay) return id;
  }
  return null;
}

/** « Prénom Nom » ou « Prénom « Surnom » Nom », d'une même origine, dans la longueur permise. */
function composeName(rng: Rng, gender: Gender, nickname: string | null): string {
  const origins = (Object.keys(PEOPLE) as Origin[]).map((value) => ({ value, weight: PEOPLE[value].weight }));
  for (let attempt = 0; attempt < 50; attempt++) {
    const people = PEOPLE[pickWeighted(rng, origins)];
    const first = pick(rng, people.firstNames[gender]);
    const last = pick(rng, people.lastNames);
    const name = nickname ? `${first} « ${nickname} » ${last}` : `${first} ${last}`;
    if (name.length <= MAX.player) return name;
  }
  return `« ${nickname ?? '?'} »`;
}

function pickNickname(rng: Rng, classId: ClassId, rarity: 'rare' | 'epic', gender: Gender, now: Date): string {
  const event = activeEvent(now);
  const pool: Gendered[] =
    event && rng() < BALANCE.names.eventNicknameChance ? EVENTS[event].nicknames : NICKNAMES[classId][rarity];
  return pick(rng, pool)[gender];
}

export interface IdentityRequest {
  classId: ClassId;
  rarity: Rarity;
  now: Date;
  /** Noms déjà pris (roster et autres Candidats) : jamais de doublon. */
  takenNames: ReadonlySet<string>;
}

/**
 * Nom d'un nouveau Joueur selon sa Rareté. Peut changer la Classe (Légendaire,
 * Clin d'œil) ; un Légendaire déjà pris devient un Épique.
 */
export function generateIdentity(rng: Rng, request: IdentityRequest): Identity {
  const { now, takenNames } = request;

  if (request.rarity === 'legendary') {
    const free = LEGENDARIES.filter((legendary) => !takenNames.has(legendary.name));
    if (free.length > 0) {
      const legendary = pick(rng, free);
      return { name: legendary.name, gender: legendary.gender, classId: legendary.classId, rarity: 'legendary', legendaryId: legendary.id };
    }
    return generateIdentity(rng, { ...request, rarity: 'epic' });
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    const gender: Gender = rng() < 0.5 ? 'm' : 'f';
    const rarity = request.rarity;

    if (rarity !== 'common' && rng() < BALANCE.names.winkChance[rarity]) {
      const winks = WINKS.filter((wink) => wink.rarity === rarity && !takenNames.has(wink.name));
      if (winks.length > 0) {
        const wink = pick(rng, winks);
        return { name: wink.name, gender: wink.gender, classId: wink.classId, rarity, legendaryId: null };
      }
    }

    const nickname = rarity === 'common' ? null : pickNickname(rng, request.classId, rarity, gender, now);
    const name = composeName(rng, gender, nickname);
    if (!takenNames.has(name)) return { name, gender, classId: request.classId, rarity, legendaryId: null };
  }
  throw new Error('Impossible de trouver un nom libre');
}
