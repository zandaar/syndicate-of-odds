// Génération des Étages : tout se déduit du numéro d'Étage, rien n'est sauvegardé
// (voir docs/adr/0002-generation-deterministe-par-etage.md).
import { BALANCE } from '../data/balance';
import { D } from './bignum';
import type { FloorSpec } from './types';

/** Décrit l'Étage `floor` (1, 2, 3… sans limite). */
export function getFloor(floor: number): FloorSpec {
  if (!Number.isInteger(floor) || floor < 1) {
    throw new Error(`Numéro d'Étage invalide : ${floor}`);
  }

  const step = floor - 1;
  const isBoss = floor % BALANCE.bossEvery === 0;
  const casino = Math.floor(step / BALANCE.floorsPerCasino) + 1;
  const floorInCasino = (step % BALANCE.floorsPerCasino) + 1;

  const vault = D(BALANCE.vault.growth)
    .pow(step)
    .mul(BALANCE.vault.base)
    .mul(isBoss ? BALANCE.vault.bossMult : 1);

  const pressure = D(BALANCE.pressure.growth)
    .pow(step)
    .mul(BALANCE.pressure.base)
    .mul(isBoss ? BALANCE.pressure.bossMult : 1);

  const stealthScale = D(BALANCE.stealthScale.growth).pow(step).mul(BALANCE.stealthScale.base);

  const bossNumber = floor / BALANCE.bossEvery;
  const vipReward = isBoss ? Math.round(BALANCE.vip.base * BALANCE.vip.growth ** (bossNumber - 1)) : 0;

  return {
    floor,
    casino,
    floorInCasino,
    isBoss,
    vault,
    pressure,
    stealthScale,
    bossPressureExtra: isBoss ? BALANCE.pressure.bossMult - 1 : 0,
    vipReward,
  };
}
