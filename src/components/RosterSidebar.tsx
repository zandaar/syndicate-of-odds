// Colonne du roster : liste des Joueurs et fiche détaillée du Joueur choisi.
import { useState } from 'react';
import { BALANCE } from '../data/balance';
import { CLASSES } from '../data/classes';
import { TRAITS_BY_ID } from '../data/traits';
import { levelUpCost } from '../engine/economy';
import { isTeamUnlocked, teamOf, type GameAction, type GameState, type TeamIndex } from '../engine/game';
import { cashSpentOnLevels } from '../engine/recruitment';
import type { Player } from '../engine/types';
import { RARITY_COLOR, RARITY_LABEL, className } from '../ui/labels';
import { Button, Money, Panel, StatLine } from './common';

export function RosterSidebar({ game, dispatch }: { game: GameState; dispatch: (action: GameAction) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = game.roster.find((p) => p.id === selectedId) ?? null;

  return (
    <Panel title={`Syndicat ${game.roster.length}/${BALANCE.office.rosterSize}`}>
      <ul className="flex flex-col gap-1">
        {game.roster.map((player) => {
          const team = teamOf(game, player.id);
          return (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => setSelectedId(player.id === selectedId ? null : player.id)}
                className={`w-full rounded border px-2 py-1 text-left text-xs transition hover:bg-night ${
                  player.id === selectedId ? 'bg-night' : 'bg-night/40'
                } ${RARITY_COLOR[player.rarity]}`}
              >
                <span className="block truncate font-semibold">{player.name}</span>
                <span className="text-stone-400">
                  {className(player)} · niv. {player.level}
                  {team !== null && <span className="ml-1 rounded bg-felt px-1 text-stone-200">É{team + 1}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected && <PlayerSheet game={game} player={selected} dispatch={dispatch} onClose={() => setSelectedId(null)} />}
    </Panel>
  );
}

function PlayerSheet({
  game,
  player,
  dispatch,
  onClose,
}: {
  game: GameState;
  player: Player;
  dispatch: (action: GameAction) => void;
  onClose: () => void;
}) {
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const scientific = game.settings.scientific;
  const def = CLASSES[player.classId];
  const team = teamOf(game, player.id);
  const cost = levelUpCost(player);
  const assign = (target: TeamIndex | null) => dispatch({ type: 'assign', playerId: player.id, team: target });

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-2 sm:items-center" onClick={onClose}>
      <article
        className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border bg-smoke p-4 ${RARITY_COLOR[player.rarity]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">{player.name}</h3>
            <p className="text-xs text-stone-400">
              {RARITY_LABEL[player.rarity]} · {className(player)} · Qualité {player.quality} % · Niveau {player.level}
            </p>
          </div>
          <Button onClick={onClose}>Fermer</Button>
        </header>

        <p className="mb-2 text-xs text-stone-300">
          <span className="text-emerald-300">Force :</span> {def.strength} <span className="text-rose-300">Faiblesse :</span>{' '}
          {def.weakness} <span className="text-gold">Passif :</span> {def.passive}
        </p>
        <StatLine player={player} scientific={scientific} />

        <ul className="mt-2 text-xs text-stone-300">
          {player.traitIds.map((id) => {
            const trait = TRAITS_BY_ID.get(id);
            return trait ? (
              <li key={id}>
                <span className="text-gold">{trait.name}</span> — {trait.description}
              </li>
            ) : null;
          })}
        </ul>

        <section className="mt-3">
          <p className="mb-1 text-xs text-stone-400">
            Niveau suivant : <Money value={cost} scientific={scientific} />
          </p>
          <div className="flex gap-2">
            <Button variant="gold" onClick={() => dispatch({ type: 'levelUp', playerId: player.id, count: 1 })} disabled={game.cash.lt(cost)}>
              +1
            </Button>
            <Button onClick={() => dispatch({ type: 'levelUp', playerId: player.id, count: 10 })}>+10</Button>
            <Button onClick={() => dispatch({ type: 'levelUp', playerId: player.id, count: 'max' })} disabled={game.cash.lt(cost)}>
              Max
            </Button>
          </div>
        </section>

        <section className="mt-3">
          <p className="mb-1 text-xs text-stone-400">Affectation : {team === null ? 'aucune Équipe' : `Équipe ${team + 1}`}</p>
          <div className="flex flex-wrap gap-2">
            {([0, 1] as const).map((target) => (
              <Button key={target} onClick={() => assign(target)} disabled={team === target || !isTeamUnlocked(game, target)}>
                Équipe {target + 1}
              </Button>
            ))}
            <Button onClick={() => assign(null)} disabled={team === null}>
              Retirer
            </Button>
          </div>
        </section>

        <section className="mt-3 border-t border-stone-800 pt-2">
          {confirmDismiss ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
              Renvoyer {player.name} ? Tu récupères <Money value={cashSpentOnLevels(player).mul(BALANCE.office.dismissRefund)} scientific={scientific} />.
              <Button variant="danger" onClick={() => dispatch({ type: 'dismiss', playerId: player.id })}>
                Oui, renvoyer
              </Button>
              <Button onClick={() => setConfirmDismiss(false)}>Non</Button>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDismiss(true)}>
              Renvoyer
            </Button>
          )}
        </section>
      </article>
    </div>
  );
}
