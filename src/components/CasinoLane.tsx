// Une ligne de Casino : l'Équipe à sa Table, ses jauges et ses options.
import { BALANCE } from '../data/balance';
import { formatNumber } from '../engine/format';
import { getFloor } from '../engine/floors';
import { isTeamUnlocked, teamMembers, teamProfile, type GameAction, type GameState, type TeamIndex } from '../engine/game';
import { getBoss, getCasino } from '../engine/names';
import { className } from '../ui/labels';
import { composeScene } from '../render/scene';
import { TableCanvas } from './TableCanvas';
import { Gauge } from './common';

export interface Floater {
  id: number;
  team: TeamIndex;
  text: string;
  kind: 'jackpot' | 'victory' | 'burned';
}

const AMBIANCE_BG = {
  docks: 'from-stone-900 to-felt/40',
  neon: 'from-fuchsia-950/60 to-felt/40',
  velvet: 'from-bordeaux/50 to-night',
  gold: 'from-amber-950/60 to-felt/40',
} as const;

export function CasinoLane({
  game,
  team,
  floaters,
  dispatch,
}: {
  game: GameState;
  team: TeamIndex;
  floaters: Floater[];
  dispatch: (action: GameAction) => void;
}) {
  const scientific = game.settings.scientific;

  if (!isTeamUnlocked(game, team)) {
    return (
      <section className="flex h-40 items-center justify-center rounded-lg border border-dashed border-stone-700 text-sm text-stone-500">
        Équipe {team + 1} : débloquée après l'Étage {BALANCE.secondTeamFloor}
      </section>
    );
  }

  const run = game.teams[team].run;
  const floor = getFloor(run.floor);
  const casino = getCasino(floor.casino);
  const boss = floor.isBoss ? getBoss(floor.floor) : null;
  const profile = teamProfile(game, team);
  const members = teamMembers(game, team);
  const table = run.phase.kind === 'table' ? run.phase.table : null;
  const vaultRatio = table ? table.vault.div(floor.vault).toNumber() : 1;
  const coverRatio = table && profile.maxCover.gt(0) ? table.cover.div(profile.maxCover).toNumber() : 0;

  return (
    <section className={`relative overflow-hidden rounded-lg border border-stone-800 bg-gradient-to-br p-3 ${AMBIANCE_BG[casino.ambiance]}`}>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400">Équipe {team + 1}</p>
          <h2 className="font-semibold text-gold">{casino.name}</h2>
        </div>
        <p className="text-sm text-stone-300">
          Étage {run.floor} <span className="text-stone-500">· {floor.floorInCasino}/{BALANCE.floorsPerCasino}</span>
        </p>
      </header>

      {boss && (
        <p className="mb-2 text-sm text-rose-300">
          Boss : <span className="font-semibold">{boss.title}</span> — {boss.name}
        </p>
      )}

      <TableCanvas
        scene={composeScene({
          ambiance: casino.ambiance,
          casino: casino.number,
          floorInCasino: floor.floorInCasino,
          isBoss: floor.isBoss,
          tier: casino.tier,
          members: members.map((p) => p.classId),
          coverRatio,
          retreat: run.phase.kind === 'retreat',
        })}
        flash={floaters.some((f) => f.kind === 'jackpot')}
      />

      {members.length === 0 ? (
        <p className="py-4 text-center text-sm text-stone-500">Aucun Joueur : choisis-en un dans le roster.</p>
      ) : (
        <>
          <ul className="mb-2 flex flex-wrap gap-1">
            {members.map((player) => (
              <li key={player.id} className="rounded bg-night/70 px-2 py-0.5 text-xs">
                {player.name} <span className="text-stone-500">· {className(player)} niv. {player.level}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1.5">
            <Gauge
              label="Caisse du Casino"
              ratio={vaultRatio}
              color="bg-gold"
              text={table ? `${formatNumber(table.vault, { scientific })} / ${formatNumber(floor.vault, { scientific })} $` : '—'}
            />
            <Gauge
              label={run.phase.kind === 'retreat' ? 'Couverture grillée : repli…' : 'Couverture'}
              ratio={coverRatio}
              color={coverRatio > 0.3 ? 'bg-emerald-500' : 'bg-rose-600'}
              text={table ? `${formatNumber(table.cover, { scientific })} / ${formatNumber(profile.maxCover, { scientific })}` : '—'}
            />
          </div>
        </>
      )}

      <footer className="mt-2 flex flex-wrap gap-4 text-xs text-stone-300">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={run.auto}
            onChange={(e) => dispatch({ type: 'setTeamOptions', team, auto: e.target.checked })}
          />
          Auto (monter d'Étage)
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={run.safeRetreat}
            onChange={(e) => dispatch({ type: 'setTeamOptions', team, safeRetreat: e.target.checked })}
          />
          Repli sécurisé
        </label>
      </footer>

      <div className="pointer-events-none absolute inset-x-0 top-10 flex flex-col items-center gap-0.5">
        {floaters.map((floater) => (
          <span
            key={floater.id}
            className={`animate-[floatUp_1.2s_ease-out_forwards] text-sm font-bold ${
              floater.kind === 'jackpot' ? 'text-neon' : floater.kind === 'victory' ? 'text-gold' : 'text-rose-400'
            }`}
          >
            {floater.text}
          </span>
        ))}
      </div>
    </section>
  );
}
