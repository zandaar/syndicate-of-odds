// Panneaux Succès, Blanchiment et Réseau du QG.
import { useState } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { NETWORK, NETWORK_IDS } from '../data/network';
import { achievementCount, achievementProgress } from '../engine/achievements';
import { CASH_PER_ACHIEVEMENT, LAUNDER_FLOOR, type GameAction, type GameState } from '../engine/game';
import { influenceFor, networkCost } from '../engine/network';
import { Button, Gauge, Panel } from './common';

type Props = { game: GameState; dispatch: (action: GameAction) => void };

export function LaunderPanel({ game, dispatch }: Props) {
  const [confirm, setConfirm] = useState(0);
  const gain = influenceFor(game.highestCleared);
  const ready = game.highestCleared >= LAUNDER_FLOOR;

  return (
    <Panel title="Blanchiment">
      <p className="mb-1 text-sm text-stone-200">
        Influence : <span className="font-semibold text-gold">{game.influence}</span>
      </p>
      <p className="mb-2 text-xs text-stone-400">
        Tout repart de zéro (Joueurs, Cash, Jetons VIP, Gadgets, Bâtiments, Étages) contre de l'Influence. La Maîtrise, le Réseau et les
        Succès restent. {ready ? `Blanchir maintenant te rapporterait ${gain} Influence.` : `Se débloque à l'Étage ${LAUNDER_FLOOR}.`}
      </p>
      {confirm === 0 && (
        <Button variant="gold" disabled={!ready} onClick={() => setConfirm(1)}>
          Blanchir ({gain} Influence)
        </Button>
      )}
      {confirm === 1 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-rose-200">
          Recommencer à zéro contre {gain} Influence ?
          <Button variant="danger" onClick={() => setConfirm(2)}>
            Oui
          </Button>
          <Button onClick={() => setConfirm(0)}>Non</Button>
        </div>
      )}
      {confirm === 2 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-rose-200">
          Sûr de sûr ? Ta partie actuelle sera effacée.
          <Button
            variant="danger"
            onClick={() => {
              dispatch({ type: 'launder' });
              setConfirm(0);
            }}
          >
            Blanchir maintenant
          </Button>
          <Button onClick={() => setConfirm(0)}>Non</Button>
        </div>
      )}
    </Panel>
  );
}

export function NetworkPanel({ game, dispatch }: Props) {
  if (game.lifetime.launderings === 0 && game.influence === 0) return null;
  return (
    <Panel title="Réseau">
      <ul className="flex flex-col gap-1.5">
        {NETWORK_IDS.map((id) => {
          const def = NETWORK[id];
          const level = game.network[id];
          const cost = networkCost(id, level);
          return (
            <li key={id} className="rounded border border-stone-800 bg-night/50 p-2 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-stone-200">{def.name}</span>
                <span className="text-gold">niv. {level}</span>
              </div>
              <p className="text-stone-400">{def.description}</p>
              <div className="mt-1 text-right">
                {cost === null ? (
                  <span className="text-stone-500">Niveau maximal</span>
                ) : (
                  <Button variant="gold" disabled={game.influence < cost} onClick={() => dispatch({ type: 'buyNetwork', networkId: id })}>
                    Acheter ({cost} Influence)
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function AchievementsPanel({ game }: { game: GameState }) {
  const count = achievementCount(game);
  return (
    <Panel title="Succès">
      <p className="mb-2 text-xs text-stone-400">
        {count} palier{count > 1 ? 's' : ''} débloqué{count > 1 ? 's' : ''} : +{Math.round(count * CASH_PER_ACHIEVEMENT * 100)} % de Cash. Chaque
        palier rapporte aussi des Jetons VIP. Les Succès restent après un Blanchiment.
      </p>
      <div className="flex flex-col gap-1.5">
        {ACHIEVEMENTS.map((family) => {
          const done = game.achievements[family.id] ?? 0;
          const next = family.threshold(done);
          const progress = achievementProgress(game, family.id);
          return next === null ? (
            <p key={family.id} className="text-xs text-emerald-300">
              {family.name} : tous les paliers sont faits ({done}).
            </p>
          ) : (
            <Gauge
              key={family.id}
              label={`${family.name} · ${family.label(next)}`}
              ratio={progress / next}
              color="bg-emerald-500"
              text={`palier ${done + 1}`}
            />
          );
        })}
      </div>
    </Panel>
  );
}
