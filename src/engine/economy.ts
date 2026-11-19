// Économie des Joueurs : stats finales, profil d'Équipe, Réputation et coûts.
// Toutes les formules de stats et de coûts du jeu vivent ici.
import { BALANCE, RARITY } from '../data/balance';
import { CLASSES } from '../data/classes';
import { ITEMS_BY_ID } from '../data/items';
import { TALENTS_BY_ID } from '../data/talents';
import { TRAITS_BY_ID } from '../data/traits';
import { D, type Decimal } from './bignum';
import type { GlobalBonuses, Modifier, Player, Rarity, StatId } from './types';

/** Stats finales d'un Joueur seul (sans l'aura de ses coéquipiers). */
export interface PlayerStats {
  flair: Decimal;
  /** En points de pourcentage. */
  luck: number;
  composure: Decimal;
  stealth: Decimal;
}

/** Ce qu'un membre apporte à chaque tick d'une Table. */
export interface MemberProfile {
  playerId: string;
  /** Flair final, aura comprise, sur un Étage normal et contre un Boss. */
  flair: Decimal;
  flairBoss: Decimal;
  /** Chance de Jackpot, entre 0 et 1. */
  jackpotChance: number;
  /** Multiplicateur de la Rafle lors d'un Jackpot, sur un Étage normal et contre un Boss. */
  jackpotMult: number;
  jackpotMultBoss: number;
  /** Chance qu'un Jackpot en relance un autre. */
  jackpotChain: number;
  jackpotStreak: { perStep: number; cap: number } | null;
  /** Bonus de Rafle (0,1 = +10 %) sur un Étage normal et sur un Boss. */
  drainBonus: { normal: number; boss: number };
  /** Bonus de Rafle quand la Couverture passe sous un seuil. */
  lowCover: { threshold: number; value: number }[];
  bossFinisher: { threshold: number; value: number }[];
  /** Une attaque sur N est un Jackpot garanti (null si aucun effet). */
  guaranteedEvery: number | null;
  /** Montée en puissance pendant une Table (null si aucun effet). */
  ramp: { perTick: number; cap: number; start: number } | null;
}

/** Tout ce que le combat doit savoir d'une Équipe. */
export interface TeamProfile {
  members: MemberProfile[];
  maxCover: Decimal;
  /** Discrétion totale, efficacité comprise. */
  stealth: Decimal;
  /** Multiplicateur de Discrétion contre les Boss. */
  bossStealthMult: number;
  pressureMult: number;
  /** Part du supplément de Pression des Boss réellement subie. */
  bossPressureMult: number;
  floorBonusMult: number;
  /** Multiplicateur de prime de fin d'Étage en plus sur les Boss. */
  bossFloorBonusMult: number;
  offlineMult: number;
  reputationMult: number;
  /** Part de la Couverture maximale rendue à chaque Jackpot. */
  jackpotHeal: number;
  /** Boucliers des premiers ticks : chacun réduit les Soupçons de `value` pendant `ticks`. */
  earlyShields: { ticks: number; value: number }[];
  /** Part des Soupçons subis raflée dans la Caisse. */
  reflect: number;
  lastStand: boolean;
  vipFind: number;
  blackout: { every: number; duration: number; value: number } | null;
  dodgeEvery: number | null;
  bossVaultCut: number;
  cashMult: number;
}

/** Multiplie les valeurs chiffrées d'un effet par un rang. */
function scaled(modifier: Modifier, rank: number): Modifier {
  switch (modifier.kind) {
    case 'statFlat':
    case 'statPercent':
    case 'drain':
    case 'jackpotPower':
    case 'stealthEfficiency':
    case 'coverMax':
    case 'pressure':
    case 'bossPressure':
    case 'floorBonus':
    case 'offline':
    case 'jackpotHeal':
    case 'reflect':
    case 'reputation':
    case 'bossFloorBonus':
    case 'auraBoost':
    case 'bossStealth':
    case 'bossAura':
    case 'bossVaultCut':
    case 'lowCoverDrain':
    case 'bossFinisher':
    case 'earlyShield':
      return { ...modifier, value: modifier.value * rank };
    case 'aura':
      return { ...modifier, flair: modifier.flair * rank, luck: modifier.luck * rank };
    case 'ramp':
      return { ...modifier, perTick: modifier.perTick * rank, cap: modifier.cap * rank };
    case 'vipFind':
      return { ...modifier, chance: modifier.chance * rank };
    case 'chainJackpot':
      return { ...modifier, chance: modifier.chance * rank };
    default:
      return modifier;
  }
}

/** Tous les effets portés par un Joueur : Classe, Traits, Gadgets, Talents. */
function collectModifiers(player: Player): Modifier[] {
  const modifiers: Modifier[] = [...CLASSES[player.classId].modifiers];

  for (const traitId of player.traitIds) {
    const trait = TRAITS_BY_ID.get(traitId);
    if (trait) modifiers.push(...trait.modifiers);
  }

  for (const itemId of Object.values(player.gear)) {
    if (!itemId) continue;
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;
    for (const [stat, value] of Object.entries(item.stats)) {
      modifiers.push({ kind: 'statFlat', stat: stat as StatId, value });
    }
    // Les effets d'un Gadget de Classe ne marchent que sur sa Classe.
    if (!item.classId || item.classId === player.classId) modifiers.push(...item.effects);
  }

  for (const [talentId, rank] of Object.entries(player.talents)) {
    const talent = TALENTS_BY_ID.get(talentId);
    if (!talent || rank <= 0 || talent.classId !== player.classId) continue;
    if (talent.byRank) modifiers.push(...(talent.byRank[Math.min(rank, talent.byRank.length) - 1] ?? []));
    if (talent.perRank) modifiers.push(...talent.perRank.map((m) => scaled(m, rank)));
  }

  return modifiers;
}

type Of<K extends Modifier['kind']> = Extract<Modifier, { kind: K }>;

function only<K extends Modifier['kind']>(modifiers: Modifier[], kind: K): Of<K>[] {
  return modifiers.filter((m): m is Of<K> => m.kind === kind);
}

function sumOf<K extends Modifier['kind']>(modifiers: Modifier[], kind: K, pick: (modifier: Of<K>) => number): number {
  return only(modifiers, kind).reduce((total, m) => total + pick(m), 0);
}

function statsFrom(player: Player, modifiers: Modifier[]): PlayerStats {
  const flat = (stat: StatId) =>
    player.baseStats[stat] + sumOf(modifiers, 'statFlat', (m) => (m.stat === stat ? m.value : 0));
  const percent = (stat: StatId) => 1 + sumOf(modifiers, 'statPercent', (m) => (m.stat === stat ? m.value : 0));
  const growth = D(BALANCE.level.statGrowth).pow(player.level - 1);

  return {
    flair: growth.mul(flat('flair')).mul(percent('flair')),
    luck: flat('luck') * percent('luck'),
    composure: growth.mul(flat('composure')).mul(percent('composure')),
    stealth: growth.mul(flat('stealth')).mul(percent('stealth')),
  };
}

/** Stats d'un Joueur seul, telles qu'affichées dans le roster. */
export function getPlayerStats(player: Player): PlayerStats {
  return statsFrom(player, collectModifiers(player));
}

/** Calcule ce que vaut une Équipe à la Table. */
export function buildTeamProfile(players: Player[], bonuses: GlobalBonuses): TeamProfile {
  const perPlayer = players.map((player) => {
    const modifiers = collectModifiers(player);
    return { player, modifiers, stats: statsFrom(player, modifiers) };
  });
  const all = perPlayer.flatMap((p) => p.modifiers);
  const auraBoost = sumOf(all, 'auraBoost', (m) => m.value);
  const bossAuraMult = 1 + sumOf(all, 'bossAura', (m) => m.value);

  // Ce que chaque Joueur émet comme aura vers ses coéquipiers.
  const auras = perPlayer.map(({ modifiers }) => {
    const hasAura = modifiers.some((m) => m.kind === 'aura');
    return {
      flair: hasAura ? sumOf(modifiers, 'aura', (m) => m.flair) + auraBoost : 0,
      luck: sumOf(modifiers, 'aura', (m) => m.luck),
    };
  });

  const members: MemberProfile[] = perPlayer.map(({ player, modifiers, stats }, index) => {
    const others = auras.filter((_, i) => i !== index);
    const auraFlair = others.reduce((total, aura) => total + aura.flair, 0);
    const auraLuck = others.reduce((total, aura) => total + aura.luck, 0);
    const noJackpot = modifiers.some((m) => m.kind === 'noJackpot');
    const guaranteed = only(modifiers, 'guaranteedJackpot').map((m) => m.every);
    const ramps = only(modifiers, 'ramp');
    const streaks = only(modifiers, 'jackpotStreak');
    const power = sumOf(modifiers, 'jackpotPower', (m) => (m.on === 'boss' ? 0 : m.value));
    const bossPower = sumOf(modifiers, 'jackpotPower', (m) => m.value);

    let ramp: MemberProfile['ramp'] = null;
    if (ramps.length > 0) {
      const cap = ramps.reduce((total, m) => total + m.cap, 0);
      const start = cap * Math.min(1, sumOf(modifiers, 'rampStart', (m) => m.fraction));
      const uncapped = modifiers.some((m) => m.kind === 'rampUncapped');
      ramp = { perTick: ramps.reduce((total, m) => total + m.perTick, 0), cap: uncapped ? Number.POSITIVE_INFINITY : cap, start };
    }

    return {
      playerId: player.id,
      flair: stats.flair.mul(1 + auraFlair),
      flairBoss: stats.flair.mul(1 + auraFlair * bossAuraMult),
      jackpotChance: noJackpot ? 0 : Math.min((stats.luck + auraLuck) / 100, BALANCE.jackpot.maxChance),
      jackpotMult: BALANCE.jackpot.baseMult * (1 + power),
      jackpotMultBoss: BALANCE.jackpot.baseMult * (1 + bossPower),
      jackpotChain: Math.min(1, sumOf(modifiers, 'chainJackpot', (m) => m.chance)),
      jackpotStreak:
        streaks.length > 0
          ? { perStep: streaks.reduce((t, m) => t + m.perStep, 0), cap: streaks.reduce((t, m) => t + m.cap, 0) }
          : null,
      drainBonus: {
        normal: sumOf(modifiers, 'drain', (m) => (m.on === 'boss' ? 0 : m.value)),
        boss: sumOf(modifiers, 'drain', (m) => (m.on === 'normal' ? 0 : m.value)),
      },
      lowCover: only(modifiers, 'lowCoverDrain').map(({ threshold, value }) => ({ threshold, value })),
      bossFinisher: only(modifiers, 'bossFinisher').map(({ threshold, value }) => ({ threshold, value })),
      guaranteedEvery: noJackpot || guaranteed.length === 0 ? null : Math.min(...guaranteed),
      ramp,
    };
  });

  const totalComposure = perPlayer.reduce((total, p) => total.add(p.stats.composure), D(0));
  const totalStealth = perPlayer.reduce((total, p) => total.add(p.stats.stealth), D(0));
  const blackouts = only(all, 'blackout');
  const dodges = only(all, 'dodge').map((m) => m.every);

  return {
    members,
    maxCover: totalComposure.mul(1 + sumOf(all, 'coverMax', (m) => m.value)),
    stealth: totalStealth.mul(1 + sumOf(all, 'stealthEfficiency', (m) => m.value)),
    bossStealthMult: 1 + sumOf(all, 'bossStealth', (m) => m.value),
    pressureMult: Math.max(0.1, 1 + sumOf(all, 'pressure', (m) => m.value)),
    bossPressureMult: Math.max(0, 1 + sumOf(all, 'bossPressure', (m) => m.value)),
    floorBonusMult: 1 + sumOf(all, 'floorBonus', (m) => m.value),
    bossFloorBonusMult: 1 + sumOf(all, 'bossFloorBonus', (m) => m.value),
    offlineMult: 1 + sumOf(all, 'offline', (m) => m.value),
    reputationMult: 1 + sumOf(all, 'reputation', (m) => m.value),
    jackpotHeal: sumOf(all, 'jackpotHeal', (m) => m.value),
    earlyShields: only(all, 'earlyShield').map(({ ticks, value }) => ({ ticks, value: Math.min(1, value) })),
    reflect: sumOf(all, 'reflect', (m) => m.value),
    lastStand: all.some((m) => m.kind === 'lastStand'),
    vipFind: Math.min(1, sumOf(all, 'vipFind', (m) => m.chance)),
    blackout: blackouts[0] ? { ...blackouts[0], value: Math.min(1, sumOf(all, 'blackout', (m) => m.value)) } : null,
    dodgeEvery: dodges.length > 0 ? Math.min(...dodges) : null,
    bossVaultCut: Math.min(0.9, sumOf(all, 'bossVaultCut', (m) => m.value)),
    cashMult: bonuses.cashMult,
  };
}

/** Réputation nécessaire pour passer du niveau `level` au suivant. */
export function reputationToNext(level: number): Decimal {
  return D(BALANCE.reputation.growth).pow(level - 1).mul(BALANCE.reputation.base);
}

/** Ajoute de la Réputation à un Joueur et le fait monter d'autant de niveaux que possible. */
export function gainReputation(player: Player, amount: Decimal): Player {
  if (amount.lte(0)) return player;
  let reputation = player.reputation.add(amount);
  let level = player.level;
  for (let guard = 0; guard < 10_000; guard++) {
    const needed = reputationToNext(level);
    if (reputation.lt(needed)) break;
    reputation = reputation.sub(needed);
    level += 1;
  }
  return { ...player, reputation, level };
}

/** Prix d'embauche d'un Candidat selon sa Rareté et l'Étage le plus haut atteint. */
export function recruitCost(rarity: Rarity, highestFloor: number): Decimal {
  return D(BALANCE.recruit.floorGrowth)
    .pow(highestFloor)
    .mul(BALANCE.recruit.base * RARITY[rarity].recruitCost);
}
