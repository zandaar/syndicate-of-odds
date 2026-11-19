import { describe, expect, it } from 'vitest';
import { TALENTS } from '../data/talents';
import { startTeamRun, tickTeam, type TeamRun } from './combat';
import { buildTeamProfile } from './economy';
import { computeOfflineGains } from './offline';
import { learnTalent } from './talents';
import { makePlayer } from './testing';
import type { ClassId, Player } from './types';

const NO_BONUS = { cashMult: 1 };
const always = (value: number) => () => value;
const team = (players: Player[]) => buildTeamProfile(players, NO_BONUS);
/** Un Joueur au Sang-froid immense : il tient toutes les Tables pendant les tests. */
const sturdy = (classId: ClassId, talents: Record<string, number>, extra: Partial<Player> = {}) => {
  const base = makePlayer(classId);
  return makePlayer(classId, { talents, baseStats: { ...base.baseStats, composure: 1e12 }, ...extra });
};
const tableOf = (run: TeamRun) => {
  if (run.phase.kind !== 'table') throw new Error('pas à la Table');
  return run.phase.table;
};

/** Les 5 Talents d'une branche au rang 3 : 15 points dépensés. */
function fullBranch(classId: ClassId, branchId: string): Record<string, number> {
  return Object.fromEntries(TALENTS.filter((t) => t.classId === classId && t.branchId === branchId && t.index < 5).map((t) => [t.id, 3]));
}

describe('règles des arbres de Talents', () => {
  it('chaque Classe a 3 branches de 7 Talents, aux noms courts', () => {
    for (const classId of ['gambler', 'bluffer', 'mastermind', 'counter', 'pickpocket', 'saboteur'] as const) {
      expect(TALENTS.filter((t) => t.classId === classId)).toHaveLength(21);
    }
    for (const talent of TALENTS) expect(talent.name.length, talent.name).toBeLessThanOrEqual(24);
  });

  it('le 2e Talent d’une branche demande 3 points déjà dépensés dans cette branche', () => {
    const sam = makePlayer('gambler', { level: 10 });
    expect(learnTalent(sam, 'gambler.pyromane.coup-de-chaud', 0).refusal).toBe('locked-points');
    const ready = makePlayer('gambler', { level: 10, talents: { 'gambler.pyromane.meche-courte': 3 } });
    expect(learnTalent(ready, 'gambler.pyromane.coup-de-chaud', 0).refusal).toBeNull();
  });

  it('un Talent a au plus 3 rangs ; un Talent d’une autre Classe est refusé', () => {
    const sam = makePlayer('gambler', { level: 10, talents: { 'gambler.pyromane.meche-courte': 3 } });
    expect(learnTalent(sam, 'gambler.pyromane.meche-courte', 0).refusal).toBe('max-rank');
    expect(learnTalent(sam, 'bluffer.muraille.carrure', 0).refusal).toBe('wrong-class');
  });

  it('le Talent ultime demande 15 points dans la branche ET la Maîtrise de Classe 5', () => {
    const sam = makePlayer('gambler', { level: 17, talents: fullBranch('gambler', 'pyromane') });
    expect(learnTalent(sam, 'gambler.pyromane.quitte-ou-double', 4).refusal).toBe('locked-mastery');
    expect(learnTalent(sam, 'gambler.pyromane.quitte-ou-double', 5).refusal).toBeNull();
  });

  it('le Talent sans limite accepte autant de rangs que de points', () => {
    let sam = makePlayer('gambler', { level: 40, talents: fullBranch('gambler', 'pyromane') });
    for (let i = 0; i < 20; i++) sam = learnTalent(sam, 'gambler.pyromane.feu-eternel', 0).player;
    expect(sam.talents['gambler.pyromane.feu-eternel']).toBe(20);
  });

  it('les rangs se cumulent dans les stats : Mèche courte 3 fait passer les Jackpots du Flambeur de ×2,5 à ×3,1', () => {
    const profile = team([makePlayer('gambler', { talents: { 'gambler.pyromane.meche-courte': 3 } })]);
    expect(profile.members[0]?.jackpotMult).toBeCloseTo(3.1, 10);
  });
});

describe('Talents ultimes à la Table', () => {
  const tick = (players: Player[], floor: number, roll: (() => number) | 'expected', setup?: (run: TeamRun) => TeamRun) => {
    const profile = team(players);
    const run = setup ? setup(startTeamRun(floor, profile)) : startTeamRun(floor, profile);
    return tickTeam(run, profile, { highestCleared: 0 }, roll);
  };

  it('Quitte ou double : un Jackpot peut en relancer un autre', () => {
    const outcome = tick([sturdy('gambler', { 'gambler.pyromane.quitte-ou-double': 1 })], 30, always(0));
    expect(outcome.cash.toNumber()).toBeCloseTo(87.5, 6);
  });

  it("Série noire : chaque Jackpot d'affilée ajoute +20 % au suivant", () => {
    const profile = team([sturdy('gambler', { 'gambler.rafale.serie-noire': 1 })]);
    let run = startTeamRun(30, profile);
    const cash: number[] = [];
    for (let i = 0; i < 3; i++) {
      const outcome = tickTeam(run, profile, { highestCleared: 0 }, always(0));
      run = outcome.run;
      cash.push(outcome.cash.toNumber());
    }
    expect(cash.map((c) => Math.round(c * 100) / 100)).toEqual([35, 42, 49]);
  });

  it('Dernière carte : Rafle ×2 sous 20 % de Couverture', () => {
    const outcome = tick([sturdy('gambler', { 'gambler.tete-froide.derniere-carte': 1 })], 30, always(0.99), (run) => {
      const table = tableOf(run);
      return { ...run, phase: { kind: 'table', table: { ...table, cover: table.cover.mul(0.1) } } };
    });
    expect(outcome.cash.toNumber()).toBe(28);
  });

  it("Inébranlable : une fois par Table, l'Équipe tient bon au lieu d'être grillée", () => {
    const fragile = makePlayer('bluffer', { talents: { 'bluffer.muraille.inebranlable': 1 } });
    const profile = team([fragile]);
    const first = tickTeam(startTeamRun(60, profile), profile, { highestCleared: 0 }, always(0.99));
    expect(first.events.some((e) => e.type === 'burned')).toBe(false);
    const second = tickTeam(first.run, profile, { highestCleared: 0 }, always(0.99));
    expect(second.events.some((e) => e.type === 'burned')).toBe(true);
  });

  it('Visage de cire : la Discrétion compte double contre les Boss', () => {
    const before = makePlayer('bluffer').baseStats.composure;
    const outcome = tick([makePlayer('bluffer', { talents: { 'bluffer.poker-face.visage-de-cire': 1 } })], 5, always(0.99));
    expect(before - tableOf(outcome.run).cover.toNumber()).toBeCloseTo(6.174962, 5);
  });

  it("Retour à l'envoyeur : 30 % des Soupçons subis sont raflés dans la Caisse", () => {
    const outcome = tick([makePlayer('bluffer', { talents: { 'bluffer.contre-bluff.retour-envoyeur': 1 } })], 1, always(0.99));
    expect(outcome.cash.toNumber()).toBeCloseTo(7.810811, 5);
  });

  it('Coup monté : contre les Boss, le Flair donné par les auras est doublé', () => {
    const profile = team([makePlayer('gambler'), makePlayer('mastermind', { talents: { 'mastermind.chef-orchestre.coup-monte': 1 } })]);
    expect(profile.members[0]?.flair.toNumber()).toBeCloseTo(15.4, 6);
    expect(profile.members[0]?.flairBoss.toNumber()).toBeCloseTo(16.8, 6);
  });

  it("Plan parfait : +50 % de Réputation pour toute l'Équipe", () => {
    const profile = team([makePlayer('gambler'), makePlayer('mastermind', { talents: { 'mastermind.planificateur.plan-parfait': 1 } })]);
    expect(profile.reputationMult).toBeCloseTo(1.5, 10);
  });

  it('Échec et mat : aucun Soupçon pendant les 3 premières secondes', () => {
    const player = makePlayer('mastermind', { talents: { 'mastermind.tacticien.echec-et-mat': 1 } });
    const outcome = tick([player], 1, always(0.99));
    expect(tableOf(outcome.run).cover.toNumber()).toBe(90);
  });

  it('Le compte est bon : le Compteur démarre chaque Table à mi-montée', () => {
    const outcome = tick([sturdy('counter', { 'counter.memoire.compte-est-bon': 1 })], 30, 'expected');
    expect(outcome.cash.toNumber()).toBeCloseTo(21, 6);
  });

  it('Sabot sans fin : la montée en puissance n’a plus de plafond', () => {
    const profile = team([makePlayer('counter', { talents: { 'counter.endurance.sabot-sans-fin': 1 } })]);
    expect(profile.members[0]?.ramp?.cap).toBe(Number.POSITIVE_INFINITY);
  });

  it("Carte maîtresse : Rafle ×2 sur la dernière moitié de la Caisse d'un Boss", () => {
    const outcome = tick([sturdy('counter', { 'counter.analyse.carte-maitresse': 1 })], 30, 'expected', (run) => {
      const table = tableOf(run);
      return { ...run, phase: { kind: 'table', table: { ...table, vault: table.vault.mul(0.4) } } };
    });
    expect(outcome.cash.toNumber()).toBe(24);
  });

  it("Coup du siècle : prime de fin d'Étage doublée sur les Boss", () => {
    const thief = makePlayer('pickpocket', { level: 60, talents: { 'pickpocket.mains-or.coup-du-siecle': 1 } });
    const outcome = tick([thief], 5, 'expected');
    expect(outcome.cash.toNumber()).toBeCloseTo(469.09764, 4);
  });

  it('Fantôme de nuit : gains hors-ligne +100 %', () => {
    const plain = team([makePlayer('gambler')]);
    const ghost = team([makePlayer('gambler'), makePlayer('pickpocket', { talents: { 'pickpocket.courant-air.fantome-de-nuit': 1 } })]);
    expect(ghost.offlineMult).toBeCloseTo(2.3, 10);
    const report = computeOfflineGains([{ run: startTeamRun(1, plain), profile: plain }], 3600);
    expect(report.reputationPerTeam[0]?.toNumber()).toBeGreaterThan(0);
  });

  it('Poches profondes : 5 % de chances de trouver 1 Jeton VIP en validant un Étage normal', () => {
    const thief = makePlayer('pickpocket', { level: 30, talents: { 'pickpocket.fouille.poches-profondes': 1 } });
    expect(tick([thief], 1, 'expected').vip).toBeCloseTo(0.05, 10);
    expect(tick([thief], 1, always(0.01)).vip).toBe(1);
  });

  it('Panne générale : Pression divisée par deux pendant les 5 premières secondes de chaque cycle', () => {
    const outcome = tick([makePlayer('saboteur', { talents: { 'saboteur.court-circuit.panne-generale': 1 } })], 1, always(0.99));
    expect(100 - tableOf(outcome.run).cover.toNumber()).toBeCloseTo(1.307692, 5);
  });

  it('Invisible : la sécurité rate une attaque sur cinq', () => {
    const profile = team([sturdy('saboteur', { 'saboteur.fantome.invisible': 1 })]);
    let run = startTeamRun(30, profile);
    const covers: number[] = [];
    for (let i = 0; i < 5; i++) {
      run = tickTeam(run, profile, { highestCleared: 0 }, always(0.99)).run;
      covers.push(tableOf(run).cover.toNumber());
    }
    expect(covers[4]).toBe(covers[3]);
    expect(covers[3]).toBeLessThan(covers[2]!);
  });

  it('Dynamite : les Boss démarrent avec 20 % de Caisse en moins', () => {
    const profile = team([makePlayer('saboteur', { talents: { 'saboteur.demolition.dynamite': 1 } })]);
    expect(tableOf(startTeamRun(5, profile)).vault.toNumber()).toBeCloseTo(210.8304, 4);
  });
});
