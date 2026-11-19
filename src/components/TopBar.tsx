// Barre du haut : Cash, Jetons VIP, record d'Étage et réglages.
import type { GameAction, GameState } from '../engine/game';
import { Button, Money } from './common';

export function TopBar({
  game,
  dispatch,
  onOpenSave,
}: {
  game: GameState;
  dispatch: (action: GameAction) => void;
  onOpenSave: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-stone-800 bg-night/95 px-4 py-2 backdrop-blur">
      <h1 className="mr-auto text-lg font-bold tracking-wide text-gold">Syndicate of Odds</h1>
      <span className="text-emerald-300" title="Cash du Syndicat">
        <Money value={game.cash} scientific={game.settings.scientific} />
      </span>
      <span className="tabular-nums text-violet-300" title="Jetons VIP">
        {game.vip} Jetons VIP
      </span>
      <span className="text-sm text-stone-400">Record : Étage {game.highestCleared}</span>
      <Button onClick={() => dispatch({ type: 'toggleScientific' })} title="Afficher les grands nombres en notation scientifique">
        {game.settings.scientific ? '1,5e3' : '1,5K'}
      </Button>
      <Button variant="gold" onClick={onOpenSave} title="Sauvegarder, transférer ou recommencer la partie">
        Sauvegarde
      </Button>
    </header>
  );
}
