// Arbre de Talents d'un Joueur : 3 branches côte à côte, un bouton par Talent.
import { BALANCE } from '../data/balance';
import { BRANCHES, TALENTS, type TalentDef } from '../data/talents';
import { masteryLevel, type GameAction, type GameState } from '../engine/game';
import { branchPoints, talentPoints, talentRefusal } from '../engine/talents';
import type { Player } from '../engine/types';
import { Button } from './common';

export function TalentTree({ game, player, dispatch }: { game: GameState; player: Player; dispatch: (action: GameAction) => void }) {
  const points = talentPoints(player);
  const mastery = masteryLevel(game, player.classId);
  const branches = BRANCHES.filter((b) => b.classId === player.classId);

  return (
    <section className="mt-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-stone-400">
          Talents : <span className="text-gold">{points.available}</span> point{points.available > 1 ? 's' : ''} à dépenser
        </p>
        <Button
          onClick={() => dispatch({ type: 'resetTalents', playerId: player.id })}
          disabled={points.spent === 0 || game.vip < BALANCE.talents.respecVip}
          title="Rend tous les points de Talent"
        >
          Redistribuer ({BALANCE.talents.respecVip} Jetons VIP)
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded border border-stone-800 bg-night/50 p-1.5">
            <h4 className="text-xs font-semibold text-gold">{branch.name}</h4>
            <p className="mb-1 text-[10px] text-stone-500">
              {branch.theme} · {branchPoints(player, branch.id)} pts
            </p>
            <ul className="flex flex-col gap-1">
              {TALENTS.filter((t) => t.classId === player.classId && t.branchId === branch.id).map((talent) => (
                <TalentButton
                  key={talent.id}
                  talent={talent}
                  rank={player.talents[talent.id] ?? 0}
                  refusal={talentRefusal(player, talent.id, mastery)}
                  onLearn={() => dispatch({ type: 'learnTalent', playerId: player.id, talentId: talent.id })}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function TalentButton({
  talent,
  rank,
  refusal,
  onLearn,
}: {
  talent: TalentDef;
  rank: number;
  refusal: string | null;
  onLearn: () => void;
}) {
  const locked = refusal === 'locked-points' || refusal === 'locked-mastery';
  const ultimate = talent.index === 5;
  const maxText = Number.isFinite(talent.maxRank) ? `/${talent.maxRank}` : '';
  const lock =
    refusal === 'locked-mastery'
      ? `Maîtrise ${talent.requiredMastery}`
      : refusal === 'locked-points'
        ? `${talent.requiredPoints} pts`
        : null;

  return (
    <li>
      <button
        type="button"
        onClick={onLearn}
        disabled={refusal !== null}
        title={talent.description}
        className={`w-full rounded border px-1.5 py-1 text-left text-[11px] transition enabled:hover:bg-smoke disabled:cursor-not-allowed ${
          ultimate ? 'border-gold/60' : 'border-stone-700'
        } ${locked ? 'opacity-40' : ''} ${rank > 0 ? 'bg-felt/40' : ''}`}
      >
        <span className="flex justify-between gap-1">
          <span className={ultimate ? 'font-semibold text-gold' : 'text-stone-200'}>{talent.name}</span>
          <span className="shrink-0 tabular-nums text-stone-400">{lock ?? `${rank}${maxText}`}</span>
        </span>
        <span className="block text-[10px] leading-tight text-stone-500">{talent.description}</span>
      </button>
    </li>
  );
}
