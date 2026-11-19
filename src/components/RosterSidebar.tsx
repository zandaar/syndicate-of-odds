// Colonne du roster : liste des Joueurs et fiche détaillée du Joueur choisi.
import { useState } from 'react';
import { BALANCE } from '../data/balance';
import { CLASSES } from '../data/classes';
import { TRAITS_BY_ID } from '../data/traits';
import { reputationToNext } from '../engine/economy';
import { formatNumber } from '../engine/format';
import { isTeamUnlocked, teamOf, type GameAction, type GameState, type TeamIndex } from '../engine/game';
import { dismissRefund } from '../engine/recruitment';
import { talentPoints } from '../engine/talents';
import type { Player } from '../engine/types';
import { RARITY_COLOR, RARITY_LABEL, className } from '../ui/labels';
import { Button, Gauge, Money, Panel, StatLine } from './common';
import { TalentTree } from './TalentTree';

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
                  {talentPoints(player).available > 0 && (
                    <span className="ml-1 rounded bg-gold/20 px-1 text-gold" title="Points de Talent à dépenser">
                      +{talentPoints(player).available}
                    </span>
                  )}
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
  const nextLevel = reputationToNext(player.level);
  const assign = (target: TeamIndex | null) => dispatch({ type: 'assign', playerId: player.id, team: target });

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-2 sm:items-center" onClick={onClose}>
      <article
        className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-smoke p-4 ${RARITY_COLOR[player.rarity]}`}
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
          <Gauge
            label={`Réputation vers le niveau ${player.level + 1}`}
            ratio={player.reputation.div(nextLevel).toNumber()}
            color="bg-violet-500"
            text={`${formatNumber(player.reputation, { scientific })} / ${formatNumber(nextLevel, { scientific })}`}
          />
          <p className="mt-1 text-[11px] text-stone-500">
            {team === null ? 'Sur le banc : ce Joueur ne gagne pas de Réputation.' : 'Gagne de la Réputation à la Table avec son Équipe.'}
          </p>
        </section>

        <TalentTree game={game} player={player} dispatch={dispatch} />

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
              Renvoyer {player.name} ? Tu récupères <Money value={dismissRefund(player, game.highestCleared)} scientific={scientific} />.
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
