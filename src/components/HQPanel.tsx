// Panneau du QG : Bureau de recrutement (Boutique VIP et Succès arrivent à l'étape 6).
import { BALANCE } from '../data/balance';
import { TRAITS_BY_ID } from '../data/traits';
import { recruitCost } from '../engine/economy';
import type { GameAction, GameState } from '../engine/game';
import { paidRefreshCost } from '../engine/recruitment';
import type { Player } from '../engine/types';
import { RARITY_COLOR, RARITY_LABEL, className } from '../ui/labels';
import { Button, Money, Panel, StatLine } from './common';

export function HQPanel({ game, dispatch, now }: { game: GameState; dispatch: (action: GameAction) => void; now: number }) {
  const scientific = game.settings.scientific;
  const nextRefreshMs = game.office.refreshedAt + BALANCE.office.refreshMinutes * 60_000 - now;
  const minutes = Math.max(1, Math.ceil(nextRefreshMs / 60_000));
  const refreshCost = paidRefreshCost(game.highestCleared);

  return (
    <div className="flex flex-col gap-3">
      <Panel title="Bureau de recrutement">
        <p className="mb-2 text-xs text-stone-400">
          Nouveaux Candidats dans {minutes} min · Roster {game.roster.length}/{BALANCE.office.rosterSize}
        </p>
        <div className="flex flex-col gap-2">
          {game.office.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              price={<Money value={recruitCost(candidate.rarity, game.highestCleared)} scientific={scientific} />}
              affordable={game.cash.gte(recruitCost(candidate.rarity, game.highestCleared))}
              scientific={scientific}
              onHire={() => dispatch({ type: 'hire', candidateId: candidate.id })}
            />
          ))}
          {game.office.candidates.length === 0 && <p className="text-sm text-stone-500">Plus personne pour l'instant.</p>}
        </div>
        <div className="mt-2">
          <Button onClick={() => dispatch({ type: 'refreshOffice' })} disabled={game.cash.lt(refreshCost)}>
            Renouveler maintenant (<Money value={refreshCost} scientific={scientific} />)
          </Button>
        </div>
      </Panel>
      <Panel title="Boutique VIP">
        <p className="text-sm text-stone-500">Bientôt : les Gadgets à acheter avec tes Jetons VIP.</p>
      </Panel>
      <Panel title="Succès">
        <p className="text-sm text-stone-500">Bientôt.</p>
      </Panel>
    </div>
  );
}

function CandidateCard({
  candidate,
  price,
  affordable,
  scientific,
  onHire,
}: {
  candidate: Player;
  price: React.ReactNode;
  affordable: boolean;
  scientific: boolean;
  onHire: () => void;
}) {
  return (
    <article className={`rounded border bg-night/50 p-2 ${RARITY_COLOR[candidate.rarity]}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{candidate.name}</h3>
        <span className="shrink-0 text-[11px] uppercase">{RARITY_LABEL[candidate.rarity]}</span>
      </div>
      <p className="mb-1 text-xs text-stone-400">
        {className(candidate)} · Qualité {candidate.quality} %
      </p>
      <StatLine player={candidate} scientific={scientific} />
      <ul className="mt-1 text-[11px] text-stone-300">
        {candidate.traitIds.map((id) => {
          const trait = TRAITS_BY_ID.get(id);
          return trait ? (
            <li key={id}>
              <span className="text-gold">{trait.name}</span> — {trait.description}
            </li>
          ) : null;
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-emerald-300">{price}</span>
        <Button variant="gold" onClick={onHire} disabled={!affordable}>
          Embaucher
        </Button>
      </div>
    </article>
  );
}
