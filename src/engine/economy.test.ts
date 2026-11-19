import { describe, expect, it } from 'vitest';
import { buildTeamProfile, getPlayerStats, recruitCost } from './economy';
import { makePlayer } from './testing';

const NO_BONUS = { cashMult: 1 };

describe('getPlayerStats — stats affichées dans le roster', () => {
  it('un Flambeur Commun de niveau 1 a les stats de référence de sa Classe', () => {
    const stats = getPlayerStats(makePlayer('gambler'));
    expect(stats.flair.toNumber()).toBe(14);
    expect(stats.luck).toBe(12);
    expect(stats.composure.toNumber()).toBe(60);
    expect(stats.stealth.toNumber()).toBe(5);
  });

  it('chaque niveau donne +8 % de Flair, Sang-froid et Discrétion, mais pas de Chance', () => {
    const stats = getPlayerStats(makePlayer('gambler', { level: 3 }));
    expect(stats.flair.toNumber()).toBeCloseTo(16.3296, 6);
    expect(stats.luck).toBe(12);
  });

  it('les stats d’un Gadget grandissent avec les niveaux du porteur', () => {
    const gear = { accessory: null, gadget: 'des-pipes' };
    expect(getPlayerStats(makePlayer('gambler', { gear })).flair.toNumber()).toBe(20);
    expect(getPlayerStats(makePlayer('gambler', { gear })).luck).toBe(16);
    expect(getPlayerStats(makePlayer('gambler', { gear, level: 2 })).flair.toNumber()).toBeCloseTo(21.6, 6);
  });

  it('un Trait à double tranchant modifie deux stats', () => {
    const stats = getPlayerStats(makePlayer('gambler', { traitIds: ['tete-brulee'] }));
    expect(stats.flair.toNumber()).toBeCloseTo(16.8, 6);
    expect(stats.composure.toNumber()).toBeCloseTo(51, 6);
  });
});

describe("buildTeamProfile — ce que vaut une Équipe à la Table", () => {
  it("le Cerveau renforce ses coéquipiers mais pas lui-même", () => {
    const gambler = makePlayer('gambler');
    const mastermind = makePlayer('mastermind');
    const team = buildTeamProfile([gambler, mastermind], NO_BONUS);
    const [g, m] = team.members;
    expect(g?.flair.toNumber()).toBeCloseTo(15.4, 6);
    expect(g?.jackpotChance).toBeCloseTo(0.17, 10);
    expect(m?.flair.toNumber()).toBe(10);
  });

  it('le Flambeur fait des Jackpots ×2,5 au lieu de ×2', () => {
    const team = buildTeamProfile([makePlayer('gambler'), makePlayer('bluffer')], NO_BONUS);
    expect(team.members[0]?.jackpotMult).toBeCloseTo(2.5, 10);
    expect(team.members[1]?.jackpotMult).toBeCloseTo(2, 10);
  });

  it("la Couverture additionne le Sang-froid ; le Bluffeur rend la Discrétion de l'Équipe 20 % plus efficace", () => {
    const team = buildTeamProfile([makePlayer('gambler'), makePlayer('bluffer')], NO_BONUS);
    expect(team.maxCover.toNumber()).toBe(210);
    expect(team.stealth.toNumber()).toBeCloseTo(30, 6);
  });

  it('le Saboteur réduit la Pression et le supplément des Boss', () => {
    const team = buildTeamProfile([makePlayer('saboteur')], NO_BONUS);
    expect(team.pressureMult).toBeCloseTo(0.85, 10);
    expect(team.bossPressureMult).toBeCloseTo(0.7, 10);
  });

  it("un Gadget de Classe ne donne son effet qu'à sa Classe", () => {
    const gear = { accessory: null, gadget: 'briquet-or' };
    const team = buildTeamProfile([makePlayer('gambler', { gear }), makePlayer('bluffer', { gear })], NO_BONUS);
    expect(team.members[0]?.jackpotMult).toBeCloseTo(3, 10);
    expect(team.members[1]?.jackpotMult).toBeCloseTo(2, 10);
  });

  it('le Compteur de cartes ne fait jamais de Jackpot, même avec un Cerveau et un Trèfle', () => {
    const counter = makePlayer('counter', { gear: { accessory: 'trefle', gadget: null } });
    const team = buildTeamProfile([counter, makePlayer('mastermind')], NO_BONUS);
    expect(team.members[0]?.jackpotChance).toBe(0);
  });

  it('la chance de Jackpot est plafonnée à 75 %', () => {
    const lucky = makePlayer('gambler', { baseStats: { flair: 14, luck: 90, composure: 60, stealth: 5 } });
    expect(buildTeamProfile([lucky], NO_BONUS).members[0]?.jackpotChance).toBe(0.75);
  });

  it('les gains hors-ligne et la prime de fin d’Étage se cumulent (Pickpocket + Lève-tôt)', () => {
    const team = buildTeamProfile([makePlayer('pickpocket', { traitIds: ['leve-tot'] })], NO_BONUS);
    expect(team.offlineMult).toBeCloseTo(1.45, 10);
    expect(team.floorBonusMult).toBeCloseTo(1.3, 10);
  });
});

describe('coûts', () => {
  it("le prix d'embauche dépend de la Rareté et de l'Étage le plus haut atteint", () => {
    expect(recruitCost('common', 0).toNumber()).toBe(50);
    expect(recruitCost('epic', 10).toNumber()).toBeCloseTo(3034.168302, 3);
  });
});
