import { describe, expect, it } from 'vitest';
import { RARITY } from '../data/balance';
import { CLASSES } from '../data/classes';
import { LEGENDARIES } from '../data/names/legendaries';
import { EVENTS } from '../data/names/nicknames';
import { TRAITS_BY_ID } from '../data/traits';
import { createRng } from './random';
import { generateCandidate, type RarityWeights } from './recruitment';
import type { Player, Rarity } from './types';

const JUNE = new Date(2026, 5, 1);
const NOBODY = new Set<string>();
const only = (rarity: Rarity): RarityWeights => ({ common: 0, rare: 0, epic: 0, legendary: 0, [rarity]: 1 });

function draw(count: number, seed: number, options: Partial<Parameters<typeof generateCandidate>[1]> = {}): Player[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => generateCandidate(rng, { now: JUNE, takenNames: NOBODY, ...options }));
}

describe('generateCandidate — un Candidat généré', () => {
  it('une même graine donne le même Candidat', () => {
    expect(draw(1, 7)).toEqual(draw(1, 7));
  });

  it('les Raretés suivent les chances 70 / 24 / 5 / 1 %', () => {
    const candidates = draw(20_000, 1);
    const share = (rarity: Rarity) => candidates.filter((c) => c.rarity === rarity).length / candidates.length;
    expect(share('common')).toBeCloseTo(0.7, 1);
    expect(share('rare')).toBeCloseTo(0.24, 1);
    expect(Math.abs(share('epic') - 0.05)).toBeLessThan(0.008);
    expect(Math.abs(share('legendary') - 0.01)).toBeLessThan(0.004);
  });

  it('les stats de départ varient de ±15 % autour de la référence de la Classe et de la Rareté', () => {
    for (const candidate of draw(2000, 2)) {
      const reference = CLASSES[candidate.classId].baseStats;
      for (const stat of ['flair', 'composure', 'stealth'] as const) {
        const ratio = candidate.baseStats[stat] / (reference[stat] * RARITY[candidate.rarity].stats);
        expect(ratio).toBeGreaterThanOrEqual(0.85);
        expect(ratio).toBeLessThanOrEqual(1.15);
      }
      expect(candidate.quality).toBeGreaterThanOrEqual(85);
      expect(candidate.quality).toBeLessThanOrEqual(115);
    }
  });

  it('un Commun ou un Rare a 1 Trait, un Épique 2 Traits différents', () => {
    expect(draw(200, 3, { rarityWeights: only('common') }).every((c) => c.traitIds.length === 1)).toBe(true);
    expect(draw(200, 3, { rarityWeights: only('rare') }).every((c) => c.traitIds.length === 1)).toBe(true);
    for (const epic of draw(200, 3, { rarityWeights: only('epic') })) {
      expect(new Set(epic.traitIds).size).toBe(2);
    }
  });

  it('un Légendaire porte son Trait unique ; les autres jamais', () => {
    for (const legendary of draw(50, 4, { rarityWeights: only('legendary') })) {
      const entry = LEGENDARIES.find((l) => l.name === legendary.name);
      expect(entry).toBeDefined();
      expect(legendary.classId).toBe(entry?.classId);
      expect(legendary.traitIds).toContain(entry?.uniqueTraitId);
      expect(legendary.traitIds).toHaveLength(2);
    }
    for (const other of draw(2000, 5, { rarityWeights: { common: 70, rare: 24, epic: 5, legendary: 0 } })) {
      expect(other.traitIds.some((id) => TRAITS_BY_ID.get(id)?.legendaryOnly)).toBe(false);
    }
  });

  it('le nom suit le modèle de sa Rareté : Surnom à partir de Rare', () => {
    expect(draw(300, 6, { rarityWeights: only('common') }).every((c) => !c.name.includes('«'))).toBe(true);
    expect(draw(300, 6, { rarityWeights: only('rare') }).every((c) => /«.+»/.test(c.name))).toBe(true);
    expect(draw(300, 6, { rarityWeights: only('epic') }).every((c) => /«.+»/.test(c.name))).toBe(true);
  });

  it('un nom déjà pris n’est jamais redonné ; un Légendaire déjà au roster devient un Épique', () => {
    const allLegendaries = new Set(LEGENDARIES.map((l) => l.name));
    const candidates = draw(20, 8, { rarityWeights: only('legendary'), takenNames: allLegendaries });
    expect(candidates.every((c) => c.rarity === 'epic' && !allLegendaries.has(c.name))).toBe(true);
  });

  it("les surnoms d'Halloween n'apparaissent que pendant Halloween", () => {
    const halloween = new Set(EVENTS.halloween.nicknames.flatMap((n) => [n.m, n.f]));
    const hasHalloween = (c: Player) => [...halloween].some((nick) => c.name.includes(`« ${nick} »`));
    const october = draw(400, 9, { rarityWeights: only('rare'), now: new Date(2026, 9, 31) });
    expect(october.filter(hasHalloween).length).toBeGreaterThan(40);
    expect(draw(400, 9, { rarityWeights: only('rare') }).some(hasHalloween)).toBe(false);
  });
});
