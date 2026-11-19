// Panneaux du QG : Boutique (Gadgets), Bâtiments et Maîtrise de Classe.
import { BUILDINGS, BUILDING_IDS } from '../data/buildings';
import { CLASSES } from '../data/classes';
import { ITEMS } from '../data/items';
import { buildingCost } from '../engine/buildings';
import { gadgetBuyCost, gadgetUpgradeCost, masteryFromTotal } from '../engine/economy';
import { formatNumber } from '../engine/format';
import { wearerOf, type GameAction, type GameState } from '../engine/game';
import type { ClassId } from '../engine/types';
import { Button, Gauge, Money, Panel } from './common';

type Props = { game: GameState; dispatch: (action: GameAction) => void };

const STAT_LABEL = { flair: 'Flair', luck: 'Chance', composure: 'Sang-froid', stealth: 'Discrétion' } as const;

export function ShopPanel({ game, dispatch }: Props) {
  const scientific = game.settings.scientific;
  return (
    <Panel title="Boutique">
      <p className="mb-2 text-xs text-stone-400">
        Chaque Gadget existe en un seul exemplaire. Achète-le, puis améliore-le rang par rang ; équipe-le depuis la fiche d'un Joueur.
      </p>
      <ul className="flex flex-col gap-1.5">
        {ITEMS.map((item) => {
          const owned = game.items[item.id];
          const cost = owned ? gadgetUpgradeCost(item.price, owned.rank) : gadgetBuyCost(item.price);
          const wearer = owned ? wearerOf(game, item.id) : null;
          const stats = Object.entries(item.stats)
            .map(([stat, value]) => `+${value}${stat === 'luck' ? ' %' : ''} ${STAT_LABEL[stat as keyof typeof STAT_LABEL]}`)
            .join(', ');
          return (
            <li key={item.id} className="rounded border border-stone-800 bg-night/50 p-2 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-stone-200">
                  {item.name}
                  {owned && <span className="ml-1 text-gold">rang {owned.rank}</span>}
                </span>
                <span className="shrink-0 text-[10px] uppercase text-stone-500">{item.slot === 'accessory' ? 'Accessoire' : 'Gadget'}</span>
              </div>
              <p className="text-stone-400">
                {stats}. {item.description}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-stone-500">{wearer ? `Porté par ${wearer.name}` : owned ? 'Au coffre' : ''}</span>
                <Button
                  variant="gold"
                  disabled={game.cash.lt(cost)}
                  onClick={() => dispatch(owned ? { type: 'upgradeItem', itemId: item.id } : { type: 'buyItem', itemId: item.id })}
                >
                  {owned ? 'Améliorer' : 'Acheter'} (<Money value={cost} scientific={scientific} />)
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function BuildingsPanel({ game, dispatch }: Props) {
  const scientific = game.settings.scientific;
  return (
    <Panel title="Bâtiments">
      <ul className="flex flex-col gap-1.5">
        {BUILDING_IDS.map((id) => {
          const def = BUILDINGS[id];
          const level = game.buildings[id];
          const cost = buildingCost(id, level);
          return (
            <li key={id} className="rounded border border-stone-800 bg-night/50 p-2 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-stone-200">{def.name}</span>
                <span className="text-gold">niv. {level}</span>
              </div>
              <p className="text-stone-400">{def.description}</p>
              <div className="mt-1 text-right">
                <Button variant="gold" disabled={game.cash.lt(cost)} onClick={() => dispatch({ type: 'upgradeBuilding', buildingId: id })}>
                  Améliorer (<Money value={cost} scientific={scientific} />)
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function MasteryPanel({ game }: { game: GameState }) {
  const scientific = game.settings.scientific;
  return (
    <Panel title="Maîtrise de Classe">
      <p className="mb-2 text-xs text-stone-400">
        Nourrie par la Réputation de tous les Joueurs de la Classe, elle reste même après un renvoi. +2 % de stats par niveau ; le niveau 5
        débloque les Talents ultimes.
      </p>
      <div className="flex flex-col gap-1.5">
        {(Object.keys(CLASSES) as ClassId[]).map((id) => {
          const mastery = masteryFromTotal(game.mastery[id]);
          return (
            <Gauge
              key={id}
              label={`${CLASSES[id].name} · Maîtrise ${mastery.level}`}
              ratio={mastery.progress.div(mastery.next).toNumber()}
              color="bg-gold"
              text={`${formatNumber(mastery.progress, { scientific })} / ${formatNumber(mastery.next, { scientific })}`}
            />
          );
        })}
      </div>
    </Panel>
  );
}
