import { describe, expect, it } from 'vitest';
import { composeScene, type SceneInput } from './scene';
import { ALL_SPRITES, PALETTE } from './sprites';

describe('les dessins en pixels', () => {
  it("chaque sprite a des lignes de même largeur et n'utilise que les couleurs de la palette", () => {
    for (const [name, sprite] of Object.entries(ALL_SPRITES)) {
      const width = sprite[0]!.length;
      for (const row of sprite) {
        expect(row.length, `${name} : « ${row} »`).toBe(width);
        for (const char of row) {
          if (char !== '.') expect(PALETTE[char], `${name} : couleur « ${char} » inconnue`).toBeDefined();
        }
      }
    }
  });
});

describe('composeScene — ce qu’on dessine à la Table', () => {
  const base: SceneInput = {
    ambiance: 'neon',
    casino: 2,
    floorInCasino: 1,
    isBoss: false,
    tier: 0,
    members: ['gambler', 'bluffer'],
    coverRatio: 1,
    retreat: false,
  };

  it("les Joueurs de l'Équipe s'assoient autour de la Table, 3 au plus", () => {
    expect(composeScene(base).seats.map((s) => s.classId)).toEqual(['gambler', 'bluffer']);
    expect(composeScene({ ...base, members: ['gambler', 'bluffer', 'counter', 'saboteur'] }).seats).toHaveLength(3);
  });

  it('les Docks jouent au poker ; ailleurs, roulette un Casino sur deux', () => {
    expect(composeScene({ ...base, ambiance: 'docks', casino: 2 }).table).toBe('poker');
    expect(composeScene({ ...base, casino: 2 }).table).toBe('roulette');
    expect(composeScene({ ...base, casino: 3 }).table).toBe('poker');
  });

  it('la sécurité grossit au fil des Étages du Casino', () => {
    expect([1, 4, 7, 10].map((f) => composeScene({ ...base, floorInCasino: f }).guards)).toEqual([1, 2, 3, 4]);
  });

  it("le Boss s'assoit en face sur un Étage de Boss", () => {
    expect(composeScene({ ...base, isBoss: true }).boss).toBe(true);
    expect(composeScene(base).boss).toBe(false);
  });

  it("l'alerte rouge s'allume sous 30 % de Couverture", () => {
    expect(composeScene({ ...base, coverRatio: 0.29 }).alert).toBe(true);
    expect(composeScene({ ...base, coverRatio: 0.31 }).alert).toBe(false);
  });

  it('pendant un repli, la Table est vide', () => {
    const scene = composeScene({ ...base, retreat: true, isBoss: true, coverRatio: 0 });
    expect(scene).toMatchObject({ empty: true, seats: [], boss: false, alert: false });
  });
});
