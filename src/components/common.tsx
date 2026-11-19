// Petits éléments d'interface réutilisés partout.
import type { ReactNode } from 'react';
import type { Decimal } from '../engine/bignum';
import { formatNumber } from '../engine/format';
import { getPlayerStats } from '../engine/economy';
import type { GlobalBonuses, Player } from '../engine/types';

export function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-stone-800 bg-smoke/80 p-3 ${className}`}>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">{title}</h2>
      {children}
    </section>
  );
}

/** Jauge horizontale ; `ratio` entre 0 et 1. */
export function Gauge({ label, ratio, color, text }: { label: string; ratio: number; color: string; text: string }) {
  const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  return (
    <div>
      <div className="flex justify-between text-xs text-stone-400">
        <span>{label}</span>
        <span className="tabular-nums">{text}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded bg-night">
        <div className={`h-full transition-[width] duration-150 ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

export function Money({ value, scientific }: { value: Decimal; scientific: boolean }) {
  return <span className="tabular-nums">{formatNumber(value, { scientific })} $</span>;
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'gold' | 'danger';
  title?: string;
}) {
  const styles = {
    default: 'border-stone-600 hover:border-stone-400',
    gold: 'border-gold text-gold hover:bg-gold/10',
    danger: 'border-bordeaux text-rose-300 hover:bg-bordeaux/30',
  }[variant];
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded border px-2 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

/** Les 4 stats d'un Joueur sur une ligne. */
export function StatLine({ player, scientific, bonuses }: { player: Player; scientific: boolean; bonuses?: GlobalBonuses }) {
  const stats = getPlayerStats(player, bonuses);
  const items = [
    ['Flair', formatNumber(stats.flair, { scientific })],
    ['Chance', `${Math.round(stats.luck)} %`],
    ['Sang-froid', formatNumber(stats.composure, { scientific })],
    ['Discrétion', formatNumber(stats.stealth, { scientific })],
  ];
  return (
    <dl className="grid grid-cols-4 gap-1 text-center text-[11px]">
      {items.map(([label, value]) => (
        <div key={label} className="rounded bg-night/70 px-1 py-0.5">
          <dt className="text-stone-500">{label}</dt>
          <dd className="tabular-nums text-stone-200">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
