// Gains hors-ligne : calculés au retour du joueur, sans serveur.
//
// Pendant l'absence, chaque Équipe rejoue son Étage actuel sans monter
// (décision de la spec V1). On mesure un « cycle » moyen sur cet Étage
// (jusqu'à la victoire, ou jusqu'à la fin du repli après une Couverture
// grillée), puis on le répète sur toute la durée d'absence.
import { BALANCE } from '../data/balance';
import { D, ZERO, type Decimal } from './bignum';
import { startTeamRun, tickTeam, type TeamRun } from './combat';
import type { TeamProfile } from './economy';

export interface OfflineTeam {
  run: TeamRun;
  profile: TeamProfile;
}

export interface OfflineReport {
  /** Durée réellement comptée, plafond appliqué. */
  seconds: number;
  cash: Decimal;
  perTeam: Decimal[];
}

/** Sécurité : un cycle ne peut pas dépasser ce nombre de ticks. */
const MAX_CYCLE_TICKS = 20_000;

/** Cash moyen par seconde d'une Équipe qui rejoue son Étage. */
export function cashPerSecondOnFloor(team: OfflineTeam): Decimal {
  if (team.profile.members.length === 0) return ZERO;

  let run = startTeamRun(team.run.floor, team.profile, { auto: false, safeRetreat: false });
  let cash = D(0);
  let ticks = 0;
  let cycleDone = false;

  while (ticks < MAX_CYCLE_TICKS) {
    const outcome = tickTeam(run, team.profile, { highestCleared: Number.MAX_SAFE_INTEGER }, 'expected');
    run = outcome.run;
    cash = cash.add(outcome.cash);
    ticks += 1;
    if (outcome.events.some((event) => event.type === 'victory')) break;
    if (outcome.events.some((event) => event.type === 'burned')) cycleDone = true;
    // Après une Couverture grillée, le cycle se termine quand le repli est fini.
    if (cycleDone && run.phase.kind === 'table') break;
  }

  return cash.div(ticks * BALANCE.tickSeconds);
}

/** Gains de toutes les Équipes pendant `elapsedSeconds` d'absence. */
export function computeOfflineGains(
  teams: OfflineTeam[],
  elapsedSeconds: number,
  capSeconds: number = BALANCE.offlineCapSeconds,
): OfflineReport {
  const seconds = Math.max(0, Math.min(elapsedSeconds, capSeconds));
  const perTeam = teams.map((team) => cashPerSecondOnFloor(team).mul(seconds * team.profile.offlineMult));
  const cash = perTeam.reduce((total, value) => total.add(value), D(0));
  return { seconds, cash, perTeam };
}
