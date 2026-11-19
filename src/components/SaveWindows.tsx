// Fenêtres « Sauvegarde / Transfert » et « Pendant ton absence ».
import { useRef, useState, type ReactNode } from 'react';
import { formatNumber } from '../engine/format';
import type { GameState, OfflineResult } from '../engine/game';
import type { LoadError } from '../storage/migrations';
import { serializeGame } from '../storage/saveFormat';
import { exportCode } from '../storage/saves';
import { Button } from './common';

export const LOAD_ERROR_TEXT: Record<LoadError, string> = {
  invalid: "Ce code ou ce fichier n'est pas une sauvegarde valide. Ta partie en cours n'a pas changé.",
  'future-version': "Cette sauvegarde vient d'une version plus récente du jeu. Ta partie en cours n'a pas changé.",
};

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-2 sm:items-center" onClick={onClose}>
      <article className="w-full max-w-lg rounded-lg border border-gold/50 bg-smoke p-4" onClick={(e) => e.stopPropagation()}>
        <header className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-gold">{title}</h2>
          <Button onClick={onClose}>Fermer</Button>
        </header>
        {children}
      </article>
    </div>
  );
}

/** « 2 h 15 », « 45 min », « 30 s ». */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, '0')}`;
  if (minutes > 0) return `${minutes} min`;
  return `${Math.floor(seconds)} s`;
}

export function OfflineWindow({ result, scientific, onClose }: { result: OfflineResult; scientific: boolean; onClose: () => void }) {
  return (
    <Modal title="Pendant ton absence…" onClose={onClose}>
      <p className="text-sm text-stone-200">
        Pendant ton absence ({formatDuration(result.seconds)}), tes Équipes ont raflé{' '}
        <span className="font-semibold text-emerald-300">+{formatNumber(result.cash, { scientific })} $</span> et gagné{' '}
        <span className="font-semibold text-violet-300">+{formatNumber(result.reputation, { scientific })}</span> de Réputation.
      </p>
      <p className="mt-2 text-xs text-stone-500">Hors-ligne, les Équipes rejouent leur Étage sans monter. La Planque augmente la durée comptée.</p>
      <div className="mt-3 text-right">
        <Button variant="gold" onClick={onClose}>
          Retour aux Tables
        </Button>
      </div>
    </Modal>
  );
}

export function SaveWindow({
  game,
  lastSavedAt,
  onImport,
  onReset,
  onClose,
}: {
  game: GameState;
  lastSavedAt: number | null;
  /** Charge un code ou un fichier ; renvoie un message d'erreur, ou null si tout va bien. */
  onImport: (input: string) => string | null;
  onReset: () => void;
  onClose: () => void;
}) {
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const copyCode = async () => {
    const code = exportCode(game, Date.now());
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Code copié : colle-le sur ton autre appareil, dans cette même fenêtre.');
    } catch {
      setPasted(code);
      setMessage('Copie automatique impossible : sélectionne le code ci-dessous et copie-le.');
    }
  };

  const download = () => {
    const blob = new Blob([serializeGame(game, Date.now())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'syndicate-save.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const load = (input: string) => {
    const error = onImport(input);
    setMessage(error ?? 'Partie chargée.');
  };

  return (
    <Modal title="Sauvegarde" onClose={onClose}>
      <p className="mb-3 text-xs text-stone-400">
        La partie est sauvegardée toute seule dans ce navigateur toutes les 10 secondes
        {lastSavedAt ? ` (dernière fois : ${new Date(lastSavedAt).toLocaleTimeString('fr-FR')})` : ''}.
      </p>

      <section className="mb-3">
        <h3 className="mb-1 text-sm font-semibold text-stone-200">Transférer sur un autre appareil</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="gold" onClick={copyCode}>
            Copier le code
          </Button>
          <Button onClick={download}>Télécharger le fichier</Button>
        </div>
      </section>

      <section className="mb-3">
        <h3 className="mb-1 text-sm font-semibold text-stone-200">Charger une sauvegarde</h3>
        <textarea
          className="h-20 w-full rounded border border-stone-700 bg-night p-2 text-xs text-stone-200"
          placeholder="Colle ici un code de sauvegarde…"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
        />
        <div className="mt-1 flex flex-wrap gap-2">
          <Button variant="gold" onClick={() => load(pasted)} disabled={pasted.trim() === ''}>
            Charger ce code
          </Button>
          <Button onClick={() => fileInput.current?.click()}>Importer un fichier .json</Button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) load(await file.text());
              e.target.value = '';
            }}
          />
        </div>
      </section>

      {message && <p className="mb-3 rounded border border-stone-700 bg-night p-2 text-xs text-stone-200">{message}</p>}

      <section className="border-t border-stone-800 pt-2">
        {confirmReset === 0 && (
          <Button variant="danger" onClick={() => setConfirmReset(1)}>
            Recommencer la partie
          </Button>
        )}
        {confirmReset === 1 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-rose-200">
            Tout sera effacé : Joueurs, Cash, Étages, Maîtrise. Sûr ?
            <Button variant="danger" onClick={() => setConfirmReset(2)}>
              Oui, continuer
            </Button>
            <Button onClick={() => setConfirmReset(0)}>Non</Button>
          </div>
        )}
        {confirmReset === 2 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-rose-200">
            Dernière chance : effacer définitivement cette partie ?
            <Button
              variant="danger"
              onClick={() => {
                onReset();
                setConfirmReset(0);
                setMessage('Nouvelle partie commencée.');
              }}
            >
              Oui, tout effacer
            </Button>
            <Button onClick={() => setConfirmReset(0)}>Non</Button>
          </div>
        )}
      </section>
    </Modal>
  );
}
