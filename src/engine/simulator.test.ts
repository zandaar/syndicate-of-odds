import { beforeAll, describe, expect, it } from 'vitest';
import { simulatePlaythrough, type SimulationResult } from './simulator';

// Ce test garde le rythme du jeu sous contrôle. S'il échoue après un
// changement dans src/data/balance.ts, le message indique les heures obtenues.
describe('simulatePlaythrough — le rythme d’une première partie (4 sessions de 30 min par jour)', () => {
  let result: SimulationResult;
  const hoursTo = (floor: number) => result.hoursToFloor.get(floor) ?? Number.POSITIVE_INFINITY;

  beforeAll(() => {
    result = simulatePlaythrough({ maxHours: 72, targetFloor: 50 });
  });

  it("l'Étage 50 (premier Blanchiment) est atteint en 1 à 2 jours", () => {
    expect(hoursTo(50), `Étage 50 atteint en ${hoursTo(50).toFixed(1)} h`).toBeGreaterThanOrEqual(20);
    expect(hoursTo(50), `Étage 50 atteint en ${hoursTo(50).toFixed(1)} h`).toBeLessThanOrEqual(48);
  });

  it('les 20 premiers Étages se jouent dans la première session', () => {
    expect(hoursTo(20), `Étage 20 atteint en ${hoursTo(20).toFixed(2)} h`).toBeLessThanOrEqual(0.5);
  });

  it("l'Étage 30 est atteint dès le premier jour", () => {
    expect(hoursTo(30), `Étage 30 atteint en ${hoursTo(30).toFixed(1)} h`).toBeLessThanOrEqual(12);
  });
});

describe('simulatePlaythrough — le Blanchiment rend la partie suivante plus rapide', () => {
  it("après un Blanchiment à l'Étage 50 et l'achat de Réseau, la 2e partie y revient au moins deux fois plus vite", () => {
    const result = simulatePlaythrough({ maxHours: 240, targetFloor: 50, runs: 2 });
    const [first, second] = result.runs;
    const t1 = first?.hoursToFloor.get(50) ?? Number.POSITIVE_INFINITY;
    const t2 = second?.hoursToFloor.get(50) ?? Number.POSITIVE_INFINITY;
    expect(t2, `1re partie : ${t1.toFixed(1)} h ; 2e partie : ${t2.toFixed(1)} h`).toBeLessThanOrEqual(t1 / 2);
  });
});
