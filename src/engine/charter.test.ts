// Vérifie que les dictionnaires respectent docs/charte-des-noms.md.
// Si ce test échoue après l'ajout d'un mot, le message indique le mot fautif.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLASSES } from '../data/classes';
import { ITEMS } from '../data/items';
import { ERROR_TEXT, RARITY_LABEL } from '../ui/labels';
import { COLORS, EMBLEMS, PLACES, CASINO_TIERS } from '../data/names/casinos';
import { LEGENDARIES } from '../data/names/legendaries';
import { EVENTS, NICKNAMES, WINKS, type Gendered } from '../data/names/nicknames';
import { PEOPLE } from '../data/names/people';
import { TRAITS, TRAITS_BY_ID } from '../data/traits';
import { createRng } from './random';
import { generateCandidate } from './recruitment';

function duplicatesOf(list: readonly string[]): string[] {
  return list.filter((item, index) => list.indexOf(item) !== index);
}

describe('charte des noms — les dictionnaires', () => {
  it('aucun doublon dans les listes', () => {
    const lists: [string, string[]][] = [
      ...Object.entries(PEOPLE).flatMap(([origin, people]): [string, string[]][] => [
        [`prénoms masculins ${origin}`, people.firstNames.m],
        [`prénoms féminins ${origin}`, people.firstNames.f],
        [`noms ${origin}`, people.lastNames],
      ]),
      ...Object.entries(NICKNAMES).flatMap(([classId, nicks]): [string, string[]][] => [
        [`surnoms ${classId}`, [...nicks.rare, ...nicks.epic].map((n) => n.m)],
      ]),
      ['emblèmes', EMBLEMS.map((e) => e.word)],
      ['lieux', PLACES],
      ['Traits', TRAITS.map((t) => t.id)],
      ['Gadgets', ITEMS.map((i) => i.id)],
      ['Légendaires', LEGENDARIES.map((l) => l.name)],
      ['Clins d’œil', WINKS.map((w) => w.name)],
    ];
    for (const [label, list] of lists) expect(duplicatesOf(list), label).toEqual([]);
  });

  it('chaque mot qui s’accorde a une forme masculine et une forme féminine', () => {
    const gendered: Gendered[] = [
      ...Object.values(NICKNAMES).flatMap((nicks) => [...nicks.rare, ...nicks.epic]),
      ...Object.values(EVENTS).flatMap((event) => event.nicknames),
      ...COLORS,
      ...CASINO_TIERS.flatMap((tier) => [...tier.bossTitles.mid, ...tier.bossTitles.final]),
    ];
    for (const word of gendered) {
      expect(word.m.trim(), JSON.stringify(word)).not.toBe('');
      expect(word.f.trim(), JSON.stringify(word)).not.toBe('');
    }
  });

  it('Traits et Gadgets ont des noms de 24 caractères maximum', () => {
    for (const name of [...TRAITS.map((t) => t.name), ...ITEMS.map((i) => i.name)]) {
      expect(name.length, name).toBeLessThanOrEqual(24);
    }
  });

  it('les Légendaires et Clins d’œil tiennent en 28 caractères et ont un Trait unique valide', () => {
    for (const name of [...LEGENDARIES.map((l) => l.name), ...WINKS.map((w) => w.name)]) {
      expect(name.length, name).toBeLessThanOrEqual(28);
    }
    for (const legendary of LEGENDARIES) {
      expect(TRAITS_BY_ID.get(legendary.uniqueTraitId)?.legendaryOnly, legendary.uniqueTraitId).toBe(true);
    }
  });
});

describe('charte des noms — vocabulaire de jeu interdit', () => {
  // « vie » seul reste permis (« Neuf vies », « la belle vie ») : seuls « points de vie » et « PV » sont interdits.
  const BANNED = /(^|[^\p{L}])(xp|exp[ée]riences?|d[ée]g[âa]ts?|dommages?|drain|dps|pv|points? de vie|tank|buff|crit|loot|skills?|mana|qu[êe]tes?)(?=$|[^\p{L}])/iu;

  it('aucun texte des données ne contient un mot de jeu de rôle', () => {
    const texts: string[] = [
      ...Object.values(CLASSES).flatMap((c) => [c.name, c.nameF, c.strength, c.weakness, c.passive]),
      ...TRAITS.flatMap((t) => [t.name, t.description]),
      ...ITEMS.flatMap((i) => [i.name, i.description]),
      ...Object.values(ERROR_TEXT),
      ...Object.values(RARITY_LABEL),
    ];
    for (const text of texts) expect(BANNED.test(text), text).toBe(false);
  });

  it("aucun texte de l'interface ne contient un mot de jeu de rôle", () => {
    const files = ['src/App.tsx', ...readdirSync('src/components').map((f) => `src/components/${f}`)];
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n');
      for (const line of lines) expect(BANNED.test(line), `${file} : ${line.trim()}`).toBe(false);
    }
  });
});

describe('charte des noms — les noms générés', () => {
  const rng = createRng(2026);
  const candidates = Array.from({ length: 5000 }, () =>
    generateCandidate(rng, { now: new Date(2026, 5, 1), takenNames: new Set() }),
  );

  it('aucun nom de Joueur ne dépasse 28 caractères', () => {
    for (const candidate of candidates) expect(candidate.name.length, candidate.name).toBeLessThanOrEqual(28);
  });

  it("les Clins d'œil restent rares chez les Rares et les Épiques", () => {
    const winkNames = new Set(WINKS.map((w) => w.name));
    const nicknamed = candidates.filter((c) => c.rarity === 'rare' || c.rarity === 'epic');
    const winks = nicknamed.filter((c) => winkNames.has(c.name)).length;
    expect(winks / nicknamed.length).toBeLessThan(0.03);
  });
});
