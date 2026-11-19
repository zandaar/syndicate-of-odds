// Économie des Joueurs : stats finales, profil d'Équipe et coûts.
// Toutes les formules de stats et de coûts du jeu vivent ici.
import { BALANCE, RARITY } from '../data/balance';
import { CLASSES } from '../data/classes';
import { ITEMS_BY_ID } from '../data/items';
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
  /** Flair final, aura comprise. */
  flair: Decimal;
  /** Chance de Jackpot, entre 0 et 1. */
  jackpotChance: number;
  /** Multiplicateur du drain lors d'un Jackpot. */
  jackpotMult: number;
  /** Bonus de drain (0,1 = +10 %) sur un Étage normal et sur un Boss. */
  drainBonus: { normal: number; boss: number };
  /** Une attaque sur N est un Jackpot garanti (null si aucun effet). */
  guaranteedEvery: number | null;
  /** Montée en puissance pendant une Table (null si aucun effet). */
  ramp: { perTick: number; cap: number } | null;
}

/** Tout ce que le combat doit savoir d'une Équipe. */
export interface TeamProfile {
  members: MemberProfile[];
  maxCover: Decimal;
  /** Discrétion totale, efficacité comprise. */
  stealth: Decimal;
  pressureMult: number;
  /** Part du supplément de Pression des Boss réellement subie. */
  bossPressureMult: number;
  floorBonusMult: number;
  offlineMult: number;
  /** Part de la Couverture maximale rendue à chaque Jackpot. */
  jackpotHeal: number;
  earlyShield: { ticks: number; value: number } | null;
  cashMult: number;
}

/** Tous les effets portés par un Joueur : Classe, Traits, Gadgets. */
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

  return modifiers;
}

/** Additionne les `value` des modifiers d'un type donné. */
function sumOf<K extends Modifier['kind']>(
  modifiers: Modifier[],
  kind: K,
  pick: (modifier: Extract<Modifier, { kind: K }>) => number,
): number {
  let total = 0;
  for (const modifier of modifiers) {
    if (modifier.kind === kind) total += pick(modifier as Extract<Modifier, { kind: K }>);
  }
  return total;
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
    const guaranteed = modifiers.filter((m) => m.kind === 'guaranteedJackpot').map((m) => m.every);
    const hasRamp = modifiers.some((m) => m.kind === 'ramp');

    return {
      playerId: player.id,
      flair: stats.flair.mul(1 + auraFlair),
      jackpotChance: noJackpot ? 0 : Math.min((stats.luck + auraLuck) / 100, BALANCE.jackpot.maxChance),
      jackpotMult: BALANCE.jackpot.baseMult * (1 + sumOf(modifiers, 'jackpotPower', (m) => m.value)),
      drainBonus: {
        normal: sumOf(modifiers, 'drain', (m) => (m.on === 'boss' ? 0 : m.value)),
        boss: sumOf(modifiers, 'drain', (m) => (m.on === 'normal' ? 0 : m.value)),
      },
      guaranteedEvery: noJackpot || guaranteed.length === 0 ? null : Math.min(...guaranteed),
      ramp: hasRamp
        ? { perTick: sumOf(modifiers, 'ramp', (m) => m.perTick), cap: sumOf(modifiers, 'ramp', (m) => m.cap) }
        : null,
    };
  });

  const totalComposure = perPlayer.reduce((total, p) => total.add(p.stats.composure), D(0));
  const totalStealth = perPlayer.reduce((total, p) => total.add(p.stats.stealth), D(0));
  const shieldTicks = Math.max(0, ...all.map((m) => (m.kind === 'earlyShield' ? m.ticks : 0)));
  const shieldValue = Math.min(0.9, sumOf(all, 'earlyShield', (m) => m.value));

  return {
    members,
    maxCover: totalComposure.mul(1 + sumOf(all, 'coverMax', (m) => m.value)),
    stealth: totalStealth.mul(1 + sumOf(all, 'stealthEfficiency', (m) => m.value)),
    pressureMult: Math.max(0.1, 1 + sumOf(all, 'pressure', (m) => m.value)),
    bossPressureMult: Math.max(0, 1 + sumOf(all, 'bossPressure', (m) => m.value)),
    floorBonusMult: 1 + sumOf(all, 'floorBonus', (m) => m.value),
    offlineMult: 1 + sumOf(all, 'offline', (m) => m.value),
    jackpotHeal: sumOf(all, 'jackpotHeal', (m) => m.value),
    earlyShield: shieldTicks > 0 ? { ticks: shieldTicks, value: shieldValue } : null,
    cashMult: bonuses.cashMult,
  };
}

/** Prix pour faire passer un Joueur au niveau suivant. */
export function levelUpCost(player: Player): Decimal {
  return D(BALANCE.level.costGrowth)
    .pow(player.level - 1)
    .mul(BALANCE.level.costBase * RARITY[player.rarity].levelCost);
}

/** Prix d'embauche d'un Candidat selon sa Rareté et l'Étage le plus haut atteint. */
export function recruitCost(rarity: Rarity, highestFloor: number): Decimal {
  return D(BALANCE.recruit.floorGrowth)
    .pow(highestFloor)
    .mul(BALANCE.recruit.base * RARITY[rarity].recruitCost);
}
