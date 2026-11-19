// Simulateur d'équilibrage : joue une partie « raisonnable » à toute vitesse,
// avec les vraies formules du moteur, pour vérifier le rythme du jeu.
//
// Le joueur simulé :
//   - joue 4 sessions de 30 minutes par jour (à 0 h, 4 h, 8 h et 12 h), le reste du temps il est absent ;
//   - pendant les sessions, complète ses Équipes dès qu'il a le Cash : l'Équipe 1 (Flambeur,
//     Bluffeur, Cerveau) puis, dès l'Étage 10, l'Équipe 2 (Compteur de cartes, Pickpocket, Saboteur) ;
//   - dépense ses points de Talent dans la première branche de chaque Classe, dans l'ordre ;
//   - n'achète ni Gadget ni Bâtiment : le rythme mesuré est donc un peu prudent.
import { BALANCE } from '../data/balance';
import { BRANCHES, TALENTS } from '../data/talents';
import { CLASSES } from '../data/classes';
import { D, type Decimal } from './bignum';
import { startTeamRun, tickTeam, type TeamRun } from './combat';
import { buildTeamProfile, gainReputation, recruitCost, type TeamProfile } from './economy';
import { computeOfflineGains } from './offline';
import { learnTalent, talentPoints } from './talents';
import type { ClassId, Player } from './types';

export interface SimulationOptions {
  /** Arrêt après ce nombre d'heures simulées. */
  maxHours: number;
  /** Arrêt dès que cet Étage est validé. */
  targetFloor: number;
}

export interface SimulationResult {
  /** Heures écoulées quand chaque Étage a été validé pour la première fois. */
  hoursToFloor: Map<number, number>;
  highestCleared: number;
  hours: number;
}

const TEAM_PLANS: ClassId[][] = [
  ['gambler', 'bluffer', 'mastermind'],
  ['counter', 'pickpocket', 'saboteur'],
];
const SESSION_STARTS_HOURS = [0, 4, 8, 12];
const SESSION_HOURS = 0.5;
/** Le joueur simulé recrute toutes les 10 secondes de session. */
const SPEND_EVERY_TICKS = 20;

interface Team {
  players: Player[];
  run: TeamRun | null;
  profile: TeamProfile;
}

function referencePlayer(classId: ClassId, id: number): Player {
  return {
    id: `sim-${id}`,
    name: CLASSES[classId].name,
    gender: 'm',
    classId,
    rarity: 'common',
    quality: 100,
    baseStats: { ...CLASSES[classId].baseStats },
    traitIds: [],
    level: 1,
    reputation: D(0),
    talents: {},
    bonusTalentPoints: 0,
    gear: { accessory: null, gadget: null },
  };
}

/** Dépense les points dans la première branche de la Classe, puis dans son Talent sans limite. */
function spendTalents(player: Player): Player {
  const branch = BRANCHES.find((b) => b.classId === player.classId);
  const order = TALENTS.filter((t) => t.classId === player.classId && t.branchId === branch?.id && t.index !== 5);
  let current = player;
  for (let guard = 0; guard < 1000 && talentPoints(current).available > 0; guard++) {
    const next = order.map((t) => learnTalent(current, t.id, 0)).find((r) => r.refusal === null);
    if (!next) break;
    current = next.player;
  }
  return current;
}

export function simulatePlaythrough(options: SimulationOptions): SimulationResult {
  const bonuses = { cashMult: 1 };
  const hoursToFloor = new Map<number, number>();
  let cash: Decimal = D(0);
  let highestCleared = 0;
  let nextId = 1;
  let hours = 0;

  const teams: Team[] = TEAM_PLANS.map(() => ({ players: [], run: null, profile: buildTeamProfile([], bonuses) }));
  // Le Flambeur offert au départ.
  teams[0]!.players.push(referencePlayer('gambler', nextId++));

  const refresh = (team: Team) => {
    team.profile = buildTeamProfile(team.players, bonuses);
    if (!team.run && team.players.length > 0) team.run = startTeamRun(1, team.profile);
  };
  teams.forEach(refresh);

  /** Partage la Réputation de l'Équipe ; recalcule l'Équipe si quelqu'un a monté de niveau. */
  const shareReputation = (team: Team, amount: Decimal) => {
    if (team.players.length === 0 || amount.lte(0)) return;
    const share = amount.div(team.players.length);
    let levelled = false;
    team.players = team.players.map((player) => {
      const next = gainReputation(player, share);
      if (next.level === player.level) return next;
      levelled = true;
      return spendTalents(next);
    });
    if (levelled) refresh(team);
  };

  const unlockedTeams = () => (highestCleared >= BALANCE.secondTeamFloor ? 2 : 1);

  const recruit = () => {
    for (let guard = 0; guard < 10; guard++) {
      const open = teams
        .slice(0, unlockedTeams())
        .map((team, index) => ({ team, index }))
        .find(({ team, index }) => team.players.length < TEAM_PLANS[index]!.length);
      if (!open) return;
      const cost = recruitCost('common', highestCleared);
      if (cash.lt(cost)) return;
      cash = cash.sub(cost);
      const classId = TEAM_PLANS[open.index]![open.team.players.length]!;
      open.team.players.push(referencePlayer(classId, nextId++));
      refresh(open.team);
    }
  };

  const done = () => highestCleared >= options.targetFloor || hours >= options.maxHours;

  const playOnline = (durationHours: number) => {
    const ticks = Math.round((durationHours * 3600) / BALANCE.tickSeconds);
    for (let tick = 0; tick < ticks && !done(); tick++) {
      if (tick % SPEND_EVERY_TICKS === 0) recruit();
      for (const team of teams) {
        if (!team.run) continue;
        const outcome = tickTeam(team.run, team.profile, { highestCleared }, 'expected');
        team.run = outcome.run;
        cash = cash.add(outcome.cash);
        shareReputation(team, outcome.reputation);
        if (outcome.clearedFloor !== null && outcome.clearedFloor > highestCleared) {
          highestCleared = outcome.clearedFloor;
          hoursToFloor.set(highestCleared, hours + (tick * BALANCE.tickSeconds) / 3600);
        }
      }
    }
    hours += durationHours;
  };

  const playOffline = (durationHours: number) => {
    const active = teams.filter((team): team is Team & { run: TeamRun } => team.run !== null);
    const report = computeOfflineGains(active, durationHours * 3600);
    cash = cash.add(report.cash);
    active.forEach((team, i) => shareReputation(team, report.reputationPerTeam[i] ?? D(0)));
    hours += durationHours;
  };

  while (!done()) {
    const dayStart = hours;
    for (let i = 0; i < SESSION_STARTS_HOURS.length && !done(); i++) {
      playOnline(SESSION_HOURS);
      const nextStart = (SESSION_STARTS_HOURS[i + 1] ?? 24) + dayStart;
      if (!done()) playOffline(nextStart - hours);
    }
  }

  return { hoursToFloor, highestCleared, hours };
}
