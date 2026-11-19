// Assemblage de l'interface et boucle de jeu.
// L'état de la partie vit ici ; toute la logique est dans src/engine/game.ts.
import { useCallback, useEffect, useRef, useState } from 'react';
import { CasinoLane, type Floater } from './components/CasinoLane';
import { HQPanel } from './components/HQPanel';
import { RosterSidebar } from './components/RosterSidebar';
import { TopBar } from './components/TopBar';
import { formatNumber } from './engine/format';
import { advanceGame, applyAction, newGame, type GameAction, type GameEvent, type GameState, type OfflineResult } from './engine/game';
import { LOAD_ERROR_TEXT, OfflineWindow, SaveWindow } from './components/SaveWindows';
import { browserStore, LocalProvider, readSaveNow } from './storage/LocalProvider';
import { serializeGame } from './storage/saveFormat';
import { importSave, loadGame, MIN_OFFLINE_SECONDS } from './storage/saves';
import { ERROR_TEXT } from './ui/labels';

/** Fréquence de rafraîchissement de l'écran (le moteur, lui, avance par ticks de 0,5 s). */
const FRAME_MS = 100;
const FLOATER_MS = 1200;
/** Sauvegarde locale automatique (gratuite, sans limite). */
const AUTOSAVE_MS = 10_000;

const store = browserStore();
const provider = store ? new LocalProvider(store) : null;

function freshGame(): GameState {
  return newGame(Math.floor(Math.random() * 2 ** 32), Date.now());
}

/** Au démarrage : reprend la sauvegarde du navigateur (avec les gains d'absence), sinon une nouvelle partie. */
function startingGame(): { state: GameState; offline: OfflineResult | null } {
  const saved = readSaveNow(store);
  if (saved) {
    const loaded = loadGame(saved, Date.now());
    if (loaded.ok) return { state: loaded.state, offline: loaded.offline };
  }
  return { state: freshGame(), offline: null };
}

type Tab = 'hq' | 'casinos' | 'roster';

let nextFloaterId = 1;

function floaterFor(event: GameEvent, scientific: boolean): Floater | null {
  const id = nextFloaterId++;
  if (event.type === 'jackpot') return { id, team: event.team, kind: 'jackpot', text: `JACKPOT +${formatNumber(event.amount, { scientific })} $` };
  if (event.type === 'victory') return { id, team: event.team, kind: 'victory', text: `Étage ${event.floor} validé !` };
  return { id, team: event.team, kind: 'burned', text: 'Couverture grillée !' };
}

export default function App() {
  const [start] = useState(startingGame);
  const [game, setGame] = useState<GameState>(start.state);
  const [offline, setOffline] = useState<OfflineResult | null>(start.offline);
  const [saveOpen, setSaveOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('casinos');
  const gameRef = useRef(game);

  // Sauvegarde automatique toutes les 10 s et à la fermeture de l'onglet.
  useEffect(() => {
    if (!provider) return;
    const saveNow = () => {
      const time = Date.now();
      void provider.save(serializeGame(gameRef.current, time)).then(() => setLastSavedAt(time));
    };
    saveNow();
    const timer = window.setInterval(saveNow, AUTOSAVE_MS);
    window.addEventListener('beforeunload', saveNow);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('beforeunload', saveNow);
    };
  }, []);

  const replaceGame = useCallback((state: GameState) => {
    gameRef.current = state;
    setGame(state);
    if (provider) void provider.save(serializeGame(state, Date.now()));
  }, []);

  const importGame = useCallback(
    (input: string): string | null => {
      const loaded = importSave(input, Date.now());
      if (!loaded.ok) return LOAD_ERROR_TEXT[loaded.error];
      replaceGame(loaded.state);
      if (loaded.offline && loaded.offline.seconds >= MIN_OFFLINE_SECONDS) setOffline(loaded.offline);
      return null;
    },
    [replaceGame],
  );

  // Boucle de jeu.
  useEffect(() => {
    let last = Date.now();
    const timer = window.setInterval(() => {
      const current = Date.now();
      const result = advanceGame(gameRef.current, current - last, current, Math.random);
      last = current;
      gameRef.current = result.state;
      setGame(result.state);
      setNow(current);
      if (result.events.length > 0) {
        const fresh = result.events
          .slice(-4)
          .map((event) => floaterFor(event, result.state.settings.scientific))
          .filter((f): f is Floater => f !== null);
        setFloaters((previous) => [...previous, ...fresh].slice(-12));
        window.setTimeout(() => setFloaters((previous) => previous.filter((f) => !fresh.includes(f))), FLOATER_MS);
      }
    }, FRAME_MS);
    return () => window.clearInterval(timer);
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    const result = applyAction(gameRef.current, action, Date.now());
    gameRef.current = result.state;
    setGame(result.state);
    if (result.error) {
      setMessage(ERROR_TEXT[result.error]);
      window.setTimeout(() => setMessage(null), 2500);
    }
  }, []);

  const lanes = (
    <div className="flex flex-col gap-3">
      {([0, 1] as const).map((team) => (
        <CasinoLane key={team} game={game} team={team} floaters={floaters.filter((f) => f.team === team)} dispatch={dispatch} />
      ))}
    </div>
  );
  const hq = <HQPanel game={game} dispatch={dispatch} now={now} />;
  const roster = <RosterSidebar game={game} dispatch={dispatch} />;

  return (
    <div className="min-h-screen pb-16 lg:pb-0">
      <TopBar game={game} dispatch={dispatch} onOpenSave={() => setSaveOpen(true)} />

      {/* PC : trois colonnes. */}
      <main className="hidden gap-3 p-3 lg:grid lg:grid-cols-[minmax(300px,1fr)_minmax(0,2fr)_minmax(220px,0.8fr)]">
        {hq}
        {lanes}
        {roster}
      </main>

      {/* Mobile : un onglet à la fois. */}
      <main className="p-3 lg:hidden">{tab === 'hq' ? hq : tab === 'casinos' ? lanes : roster}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-stone-800 bg-night lg:hidden">
        {(
          [
            ['hq', 'QG'],
            ['casinos', 'Casinos'],
            ['roster', 'Équipe'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`py-3 text-sm ${tab === id ? 'text-gold' : 'text-stone-400'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {message && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded border border-bordeaux bg-smoke px-4 py-2 text-sm text-rose-200 lg:bottom-6">
          {message}
        </div>
      )}

      {saveOpen && (
        <SaveWindow
          game={game}
          lastSavedAt={lastSavedAt}
          onImport={importGame}
          onReset={() => replaceGame(freshGame())}
          onClose={() => setSaveOpen(false)}
        />
      )}
      {!saveOpen && offline && (
        <OfflineWindow result={offline} scientific={game.settings.scientific} onClose={() => setOffline(null)} />
      )}
    </div>
  );
}
