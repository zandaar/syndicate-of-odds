import { describe, expect, it } from 'vitest';
import { D } from './bignum';
import { dismissPlayer, hireCandidate, openOffice, paidRefresh, refreshIfDue, type OfficeContext } from './recruitment';
import { makePlayer } from './testing';
import type { Player } from './types';

const MINUTE = 60_000;
const commonsOnly = { common: 1, rare: 0, epic: 0, legendary: 0 };
const context = (now: number, roster: Player[] = []): OfficeContext => ({ now, roster, rarityWeights: commonsOnly });

describe('le Bureau de recrutement', () => {
  it('propose 3 Candidats aux noms différents de ceux du roster', () => {
    const roster = [makePlayer('gambler', { name: 'Lucien Ferrand' })];
    const office = openOffice(42, context(0, roster));
    expect(office.candidates).toHaveLength(3);
    const names = office.candidates.map((c) => c.name);
    expect(new Set(names).size).toBe(3);
    expect(names).not.toContain('Lucien Ferrand');
  });

  it('renouvelle les Candidats gratuitement toutes les 20 minutes', () => {
    const office = openOffice(42, context(0));
    expect(refreshIfDue(office, context(19 * MINUTE)).candidates).toEqual(office.candidates);
    const renewed = refreshIfDue(office, context(20 * MINUTE));
    expect(renewed.candidates).not.toEqual(office.candidates);
    expect(renewed.refreshedAt).toBe(20 * MINUTE);
  });

  it('peut renouveler tout de suite contre la moitié du prix d’un Commun', () => {
    const office = openOffice(42, context(0));
    const result = paidRefresh({ office, cash: D(1000), highestFloor: 0 }, context(MINUTE));
    expect(result.ok && result.cash.toNumber()).toBe(975);
    expect(result.ok && result.office.candidates).not.toEqual(office.candidates);
    expect(paidRefresh({ office, cash: D(10), highestFloor: 0 }, context(MINUTE))).toEqual({ ok: false, reason: 'not-enough-cash' });
  });

  it('embaucher un Candidat le fait passer au roster contre son prix', () => {
    const office = openOffice(42, context(0));
    const candidate = office.candidates[0]!;
    const result = hireCandidate({ office, roster: [], cash: D(1000), highestFloor: 0 }, candidate.id);
    if (!result.ok) throw new Error(result.reason);
    expect(result.cash.toNumber()).toBe(950);
    expect(result.roster.map((p) => p.id)).toEqual([candidate.id]);
    expect(result.office.candidates.map((c) => c.id)).not.toContain(candidate.id);
  });

  it("refuse l'embauche si le roster est plein (12) ou si le Cash manque", () => {
    const office = openOffice(42, context(0));
    const id = office.candidates[0]!.id;
    const fullRoster = Array.from({ length: 12 }, () => makePlayer('bluffer'));
    expect(hireCandidate({ office, roster: fullRoster, cash: D(1e9), highestFloor: 0 }, id)).toEqual({ ok: false, reason: 'roster-full' });
    expect(hireCandidate({ office, roster: [], cash: D(49), highestFloor: 0 }, id)).toEqual({ ok: false, reason: 'not-enough-cash' });
    expect(hireCandidate({ office, roster: [], cash: D(1e9), highestFloor: 0 }, 'inconnu')).toEqual({ ok: false, reason: 'unknown-candidate' });
  });

  it('renvoyer un Joueur rend 50 % du Cash dépensé en niveaux', () => {
    const veteran = makePlayer('gambler', { level: 3 });
    const result = dismissPlayer([veteran, makePlayer('bluffer')], veteran.id);
    expect(result.refund.toNumber()).toBe(1650);
    expect(result.roster.map((p) => p.id)).not.toContain(veteran.id);
    expect(result.roster).toHaveLength(1);
  });
});
