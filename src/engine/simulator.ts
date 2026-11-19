// Simulateur d'équilibrage : joue une partie « raisonnable » à toute vitesse,
// avec les vraies formules du moteur, pour vérifier le rythme du jeu.
//
// Le joueur simulé :
//   - joue 4 sessions de 30 minutes par jour (à 0 h, 4 h, 8 h et 12 h), le reste du temps il est absent ;
//   - à chaque instant de session, dépense tout son Cash : il complète ses Équipes,
//     sinon il achète le niveau le moins cher ;
//   - forme l'Équipe 1 (Flambeur, Bluffeur, Cerveau) puis, dès l'Étage 10, l'Équipe 2
//     (Compteur de cartes, Pickpocket, Saboteur) ;
//   - n'achète aucun Gadget : le rythme mesuré est donc un peu prudent.
import { BALANCE } from '../data/balance';
import { CLASSES } from '../data/classes';
import { D, type Decimal } from './bignum';
import { startTeamRun, tickTeam, type TeamRun } from './combat';
import { buildTeamProfile, levelUpCost, recruitCost, type TeamProfile } from './economy';
import { computeOfflineGains } from './offline';
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
/** Le joueur simulé fait ses achats toutes les 10 secondes de session. */
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
    classId,
    rarity: 'common',
    baseStats: { ...CLASSES[classId].baseStats },
    traitIds: [],
    level: 1,
    gear: { accessory: null, gadget: null },
  };
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

  const unlockedTeams = () => (highestCleared >= BALANCE.secondTeamFloor ? 2 : 1);

  const spend = () => {
    for (let guard = 0; guard < 10_000; guard++) {
      // 1. Compléter une Équipe.
      const open = teams
        .slice(0, unlockedTeams())
        .map((team, index) => ({ team, index }))
        .find(({ team, index }) => team.players.length < TEAM_PLANS[index]!.length);
      if (open) {
        const cost = recruitCost('common', highestCleared);
        if (cash.gte(cost)) {
          cash = cash.sub(cost);
          const classId = TEAM_PLANS[open.index]![open.team.players.length]!;
          open.team.players.push(referencePlayer(classId, nextId++));
          refresh(open.team);
          continue;
        }
      }
      // 2. Sinon, le niveau le moins cher.
      let cheapest: { player: Player; team: Team; cost: Decimal } | null = null;
      for (const team of teams) {
        for (const player of team.players) {
          const cost = levelUpCost(player);
          if (!cheapest || cost.lt(cheapest.cost)) cheapest = { player, team, cost };
        }
      }
      if (!cheapest || cash.lt(cheapest.cost)) return;
      cash = cash.sub(cheapest.cost);
      cheapest.player.level += 1;
      refresh(cheapest.team);
    }
  };

  const done = () => highestCleared >= options.targetFloor || hours >= options.maxHours;

  const playOnline = (durationHours: number) => {
    const ticks = Math.round((durationHours * 3600) / BALANCE.tickSeconds);
    for (let tick = 0; tick < ticks && !done(); tick++) {
      if (tick % SPEND_EVERY_TICKS === 0) spend();
      for (const team of teams) {
        if (!team.run) continue;
        const outcome = tickTeam(team.run, team.profile, { highestCleared }, 'expected');
        team.run = outcome.run;
        cash = cash.add(outcome.cash);
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
    cash = cash.add(computeOfflineGains(active, durationHours * 3600).cash);
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
