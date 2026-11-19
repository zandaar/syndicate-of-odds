// =====================================================================
// ARBRES DE TALENTS DES 6 CLASSES
//
// Chaque Classe a 3 branches. Une branche contient, dans l'ordre :
//   - 5 Talents (3 rangs chacun) ; le Talent n°k demande d'avoir déjà mis
//     3 × k points dans la branche (0, 3, 6, 9 puis 12) ;
//   - 1 Talent ultime (1 rang) : 15 points dans la branche ET la Maîtrise
//     de Classe 5 ;
//   - 1 Talent sans limite : 15 points dans la branche, rangs infinis.
//
// `perRank` : effets d'UN rang (ils sont multipliés par le rang pris).
// `byRank`  : effets exacts rang par rang (quand ils ne se multiplient pas).
// Les effets sont des « Modifier » (voir src/engine/types.ts).
// Noms : 24 caractères maximum, vocabulaire de docs/charte-des-noms.md.
//
// Pour ajuster un Talent : change ses nombres puis lance `npm test`.
// =====================================================================
import { BALANCE } from './balance';
import type { ClassId, Modifier, StatId } from '../engine/types';

export interface TalentDef {
  id: string;
  classId: ClassId;
  branchId: string;
  /** 0 à 4 : Talents ; 5 : Talent ultime ; 6 : Talent sans limite. */
  index: number;
  name: string;
  description: string;
  maxRank: number;
  /** Points déjà dépensés dans la branche pour débloquer ce Talent. */
  requiredPoints: number;
  /** Niveau de Maîtrise de Classe nécessaire (0 si aucun). */
  requiredMastery: number;
  perRank?: Modifier[];
  byRank?: Modifier[][];
}

export interface BranchDef {
  id: string;
  classId: ClassId;
  name: string;
  theme: string;
}

type TalentSpec = { slug: string; name: string; description: string; perRank?: Modifier[]; byRank?: Modifier[][] };

const pct = (stat: StatId, value: number): Modifier => ({ kind: 'statPercent', stat, value });
const luck = (value: number): Modifier => ({ kind: 'statFlat', stat: 'luck', value });

export const BRANCHES: BranchDef[] = [];
export const TALENTS: TalentDef[] = [];

/** Ajoute une branche : 5 Talents, puis le Talent ultime, puis le Talent sans limite. */
function branch(classId: ClassId, id: string, name: string, theme: string, talents: TalentSpec[], ultimate: TalentSpec, endless: TalentSpec) {
  BRANCHES.push({ id, classId, name, theme });
  const specs = [...talents, ultimate, endless];
  specs.forEach((spec, index) => {
    const isUltimate = index === 5;
    const isEndless = index === 6;
    TALENTS.push({
      id: `${classId}.${id}.${spec.slug}`,
      classId,
      branchId: id,
      index,
      name: spec.name,
      description: spec.description,
      maxRank: isUltimate ? 1 : isEndless ? Number.POSITIVE_INFINITY : BALANCE.talents.ranks,
      requiredPoints: isUltimate || isEndless ? BALANCE.talents.ultimatePoints : index * BALANCE.talents.pointsPerTier,
      requiredMastery: isUltimate ? BALANCE.talents.ultimateMastery : 0,
      ...(spec.perRank ? { perRank: spec.perRank } : {}),
      ...(spec.byRank ? { byRank: spec.byRank } : {}),
    });
  });
}

// ------------------------------- Flambeur -------------------------------
branch('gambler', 'pyromane', 'Pyromane', 'Des Jackpots plus forts.', [
  { slug: 'meche-courte', name: 'Mèche courte', description: 'Jackpots +10 % par rang.', perRank: [{ kind: 'jackpotPower', value: 0.1 }] },
  { slug: 'coup-de-chaud', name: 'Coup de chaud', description: 'Flair +5 % par rang.', perRank: [pct('flair', 0.05)] },
  { slug: 'feu-artifice', name: "Feu d'artifice", description: 'Jackpots +15 % par rang contre les Boss.', perRank: [{ kind: 'jackpotPower', value: 0.15, on: 'boss' }] },
  { slug: 'brasier', name: 'Brasier', description: 'Jackpots +12 % par rang.', perRank: [{ kind: 'jackpotPower', value: 0.12 }] },
  { slug: 'incendiaire', name: 'Incendiaire', description: 'Flair +8 % par rang.', perRank: [pct('flair', 0.08)] },
], { slug: 'quitte-ou-double', name: 'Quitte ou double', description: "25 % de chances qu'un Jackpot en relance un autre.", perRank: [{ kind: 'chainJackpot', chance: 0.25 }] },
  { slug: 'feu-eternel', name: 'Feu éternel', description: 'Jackpots +1 % par rang, sans limite.', perRank: [{ kind: 'jackpotPower', value: 0.01 }] });

branch('gambler', 'rafale', 'Rafale', 'Des Jackpots plus fréquents.', [
  { slug: 'oeil-vif', name: 'Œil vif', description: 'Chance +2 % par rang.', perRank: [luck(2)] },
  { slug: 'doigts-agiles', name: 'Doigts agiles', description: 'Un Jackpot garanti toutes les 12, puis 10, puis 8 attaques.', byRank: [[{ kind: 'guaranteedJackpot', every: 12 }], [{ kind: 'guaranteedJackpot', every: 10 }], [{ kind: 'guaranteedJackpot', every: 8 }]] },
  { slug: 'veine', name: 'Veine', description: 'Chance +3 % par rang.', perRank: [luck(3)] },
  { slug: 'main-heureuse', name: 'Main heureuse', description: 'Rafle +5 % par rang.', perRank: [{ kind: 'drain', on: 'all', value: 0.05 }] },
  { slug: 'coup-de-bol', name: 'Coup de bol', description: 'Chance +4 % par rang.', perRank: [luck(4)] },
], { slug: 'serie-noire', name: 'Série noire', description: "Chaque Jackpot d'affilée ajoute +20 % au suivant (jusqu'à +100 %).", perRank: [{ kind: 'jackpotStreak', perStep: 0.2, cap: 1 }] },
  { slug: 'rafale-sans-fin', name: 'Rafale sans fin', description: 'Chance +0,25 % par rang, sans limite.', perRank: [luck(0.25)] });

branch('gambler', 'tete-froide', 'Tête froide', 'Tenir la Table plus longtemps.', [
  { slug: 'nerfs-acier', name: "Nerfs d'acier", description: 'Sang-froid +8 % par rang.', perRank: [pct('composure', 0.08)] },
  { slug: 'profil-bas', name: 'Profil bas', description: 'Discrétion +6 % par rang.', perRank: [pct('stealth', 0.06)] },
  { slug: 'sueurs-froides', name: 'Sueurs froides', description: "Chaque Jackpot rend 1 % de la Couverture de l'Équipe, par rang.", perRank: [{ kind: 'jackpotHeal', value: 0.01 }] },
  { slug: 'endurci', name: 'Endurci', description: 'Sang-froid +10 % par rang.', perRank: [pct('composure', 0.1)] },
  { slug: 'dos-au-mur', name: 'Dos au mur', description: 'Rafle +15 % par rang quand la Couverture passe sous 30 %.', perRank: [{ kind: 'lowCoverDrain', threshold: 0.3, value: 0.15 }] },
], { slug: 'derniere-carte', name: 'Dernière carte', description: 'Rafle ×2 quand la Couverture passe sous 20 %.', perRank: [{ kind: 'lowCoverDrain', threshold: 0.2, value: 1 }] },
  { slug: 'sang-froid-pierre', name: 'Sang-froid de pierre', description: 'Sang-froid +1 % par rang, sans limite.', perRank: [pct('composure', 0.01)] });

// ------------------------------- Bluffeur -------------------------------
branch('bluffer', 'muraille', 'Muraille', 'Une Couverture énorme.', [
  { slug: 'carrure', name: 'Carrure', description: 'Sang-froid +10 % par rang.', perRank: [pct('composure', 0.1)] },
  { slug: 'rempart', name: 'Rempart', description: "Couverture de l'Équipe +3 % par rang.", perRank: [{ kind: 'coverMax', value: 0.03 }] },
  { slug: 'roc', name: 'Roc', description: 'Sang-froid +12 % par rang.', perRank: [pct('composure', 0.12)] },
  { slug: 'bouclier-humain', name: 'Bouclier humain', description: "Couverture de l'Équipe +4 % par rang.", perRank: [{ kind: 'coverMax', value: 0.04 }] },
  { slug: 'forteresse', name: 'Forteresse', description: 'Sang-froid +15 % par rang.', perRank: [pct('composure', 0.15)] },
], { slug: 'inebranlable', name: 'Inébranlable', description: "Une fois par Table, l'Équipe tient bon au lieu d'être grillée.", perRank: [{ kind: 'lastStand' }] },
  { slug: 'muraille-sans-fin', name: 'Muraille sans fin', description: "Couverture de l'Équipe +0,5 % par rang, sans limite.", perRank: [{ kind: 'coverMax', value: 0.005 }] });

branch('bluffer', 'poker-face', 'Poker face', "La Discrétion de toute l'Équipe.", [
  { slug: 'regard-vide', name: 'Regard vide', description: 'Discrétion +8 % par rang.', perRank: [pct('stealth', 0.08)] },
  { slug: 'masque', name: 'Masque', description: "Efficacité de la Discrétion de l'Équipe +4 % par rang.", perRank: [{ kind: 'stealthEfficiency', value: 0.04 }] },
  { slug: 'calme-plat', name: 'Calme plat', description: 'Discrétion +10 % par rang.', perRank: [pct('stealth', 0.1)] },
  { slug: 'diversion', name: 'Diversion', description: "Efficacité de la Discrétion de l'Équipe +5 % par rang.", perRank: [{ kind: 'stealthEfficiency', value: 0.05 }] },
  { slug: 'impassible', name: 'Impassible', description: 'Pression −3 % par rang.', perRank: [{ kind: 'pressure', value: -0.03 }] },
], { slug: 'visage-de-cire', name: 'Visage de cire', description: "Discrétion de l'Équipe doublée contre les Boss.", perRank: [{ kind: 'bossStealth', value: 1 }] },
  { slug: 'poker-face-eternel', name: 'Poker face éternel', description: "Efficacité de la Discrétion +0,5 % par rang, sans limite.", perRank: [{ kind: 'stealthEfficiency', value: 0.005 }] });

branch('bluffer', 'contre-bluff', 'Contre-bluff', 'Retourner la Pression contre le casino.', [
  { slug: 'relance', name: 'Relance', description: 'Rafle dans la Caisse 3 % des Soupçons subis, par rang.', perRank: [{ kind: 'reflect', value: 0.03 }] },
  { slug: 'bluff-retourne', name: 'Bluff retourné', description: 'Flair +10 % par rang.', perRank: [pct('flair', 0.1)] },
  { slug: 'surenchere', name: 'Surenchère', description: 'Rafle dans la Caisse 4 % des Soupçons subis, par rang.', perRank: [{ kind: 'reflect', value: 0.04 }] },
  { slug: 'tapis', name: 'Tapis !', description: 'Flair +12 % par rang.', perRank: [pct('flair', 0.12)] },
  { slug: 'coup-de-poker', name: 'Coup de poker', description: 'Rafle dans la Caisse 5 % des Soupçons subis, par rang.', perRank: [{ kind: 'reflect', value: 0.05 }] },
], { slug: 'retour-envoyeur', name: "Retour à l'envoyeur", description: 'Rafle dans la Caisse 30 % des Soupçons subis.', perRank: [{ kind: 'reflect', value: 0.3 }] },
  { slug: 'contre-bluff-sans-fin', name: 'Contre-bluff sans fin', description: 'Rafle 0,5 % des Soupçons subis par rang, sans limite.', perRank: [{ kind: 'reflect', value: 0.005 }] });

// ------------------------------- Cerveau -------------------------------
branch('mastermind', 'chef-orchestre', "Chef d'orchestre", 'Une aura plus puissante.', [
  { slug: 'baguette', name: 'Baguette', description: 'Aura : Flair des coéquipiers +3 % par rang.', perRank: [{ kind: 'aura', flair: 0.03, luck: 0 }] },
  { slug: 'partition', name: 'Partition', description: 'Aura : Chance des coéquipiers +1 % par rang.', perRank: [{ kind: 'aura', flair: 0, luck: 1 }] },
  { slug: 'crescendo', name: 'Crescendo', description: 'Aura : Flair des coéquipiers +4 % par rang.', perRank: [{ kind: 'aura', flair: 0.04, luck: 0 }] },
  { slug: 'harmonie', name: 'Harmonie', description: 'Aura : Chance des coéquipiers +1,5 % par rang.', perRank: [{ kind: 'aura', flair: 0, luck: 1.5 }] },
  { slug: 'tutti', name: 'Tutti', description: 'Aura : Flair des coéquipiers +5 % par rang.', perRank: [{ kind: 'aura', flair: 0.05, luck: 0 }] },
], { slug: 'coup-monte', name: 'Coup monté', description: 'Contre les Boss, le Flair donné par les auras est doublé.', perRank: [{ kind: 'bossAura', value: 1 }] },
  { slug: 'symphonie', name: 'Symphonie', description: 'Aura : Flair des coéquipiers +0,5 % par rang, sans limite.', perRank: [{ kind: 'aura', flair: 0.005, luck: 0 }] });

branch('mastermind', 'planificateur', 'Planificateur', 'Plus de Réputation et de primes.', [
  { slug: 'carnet', name: 'Carnet de notes', description: "Réputation de l'Équipe +5 % par rang.", perRank: [{ kind: 'reputation', value: 0.05 }] },
  { slug: 'reperage', name: 'Repérage', description: "Prime de fin d'Étage +5 % par rang.", perRank: [{ kind: 'floorBonus', value: 0.05 }] },
  { slug: 'methode', name: 'Méthode', description: "Réputation de l'Équipe +7 % par rang.", perRank: [{ kind: 'reputation', value: 0.07 }] },
  { slug: 'butin-calcule', name: 'Butin calculé', description: "Prime de fin d'Étage +7 % par rang.", perRank: [{ kind: 'floorBonus', value: 0.07 }] },
  { slug: 'grand-plan', name: 'Grand plan', description: "Réputation de l'Équipe +10 % par rang.", perRank: [{ kind: 'reputation', value: 0.1 }] },
], { slug: 'plan-parfait', name: 'Plan parfait', description: "Réputation de l'Équipe +50 %.", perRank: [{ kind: 'reputation', value: 0.5 }] },
  { slug: 'plan-sans-fin', name: 'Plan sans fin', description: "Réputation de l'Équipe +1 % par rang, sans limite.", perRank: [{ kind: 'reputation', value: 0.01 }] });

branch('mastermind', 'tacticien', 'Tacticien', 'Faire baisser la Pression.', [
  { slug: 'lecture-du-jeu', name: 'Lecture du jeu', description: 'Pression −2 % par rang.', perRank: [{ kind: 'pressure', value: -0.02 }] },
  { slug: 'premier-coup', name: 'Premier coup', description: 'Soupçons −5 % par rang pendant les 5 premières secondes.', perRank: [{ kind: 'earlyShield', ticks: 10, value: 0.05 }] },
  { slug: 'angle-mort', name: 'Angle mort', description: 'Pression −3 % par rang.', perRank: [{ kind: 'pressure', value: -0.03 }] },
  { slug: 'coup-d-avance', name: "Coup d'avance", description: 'Soupçons −7 % par rang pendant les 5 premières secondes.', perRank: [{ kind: 'earlyShield', ticks: 10, value: 0.07 }] },
  { slug: 'maitre-du-jeu', name: 'Maître du jeu', description: 'Pression −4 % par rang.', perRank: [{ kind: 'pressure', value: -0.04 }] },
], { slug: 'echec-et-mat', name: 'Échec et mat', description: 'Aucun Soupçon pendant les 3 premières secondes de chaque Table.', perRank: [{ kind: 'earlyShield', ticks: 6, value: 1 }] },
  { slug: 'tactique-sans-fin', name: 'Tactique sans fin', description: 'Pression −0,25 % par rang, sans limite.', perRank: [{ kind: 'pressure', value: -0.0025 }] });

// --------------------------- Compteur de cartes ---------------------------
branch('counter', 'memoire', 'Mémoire', 'Monter en puissance plus vite.', [
  { slug: 'bonne-memoire', name: 'Bonne mémoire', description: 'Montée en puissance +0,5 % par tick, par rang.', perRank: [{ kind: 'ramp', perTick: 0.005, cap: 0 }] },
  { slug: 'deja-vu', name: 'Déjà-vu', description: 'Flair +5 % par rang.', perRank: [pct('flair', 0.05)] },
  { slug: 'compte-rapide', name: 'Compte rapide', description: 'Montée en puissance +0,7 % par tick, par rang.', perRank: [{ kind: 'ramp', perTick: 0.007, cap: 0 }] },
  { slug: 'sabot-lu', name: 'Sabot lu', description: 'Flair +7 % par rang.', perRank: [pct('flair', 0.07)] },
  { slug: 'memoire-elephant', name: "Mémoire d'éléphant", description: 'Montée en puissance +1 % par tick, par rang.', perRank: [{ kind: 'ramp', perTick: 0.01, cap: 0 }] },
], { slug: 'compte-est-bon', name: 'Le compte est bon', description: 'Chaque Table démarre à mi-montée.', perRank: [{ kind: 'rampStart', fraction: 0.5 }] },
  { slug: 'memoire-sans-fin', name: 'Mémoire sans fin', description: 'Montée en puissance +0,05 % par tick par rang, sans limite.', perRank: [{ kind: 'ramp', perTick: 0.0005, cap: 0 }] });

branch('counter', 'endurance', 'Endurance', 'Monter en puissance plus haut.', [
  { slug: 'second-souffle', name: 'Second souffle', description: 'Plafond de la montée +10 % par rang.', perRank: [{ kind: 'ramp', perTick: 0, cap: 0.1 }] },
  { slug: 'patience', name: 'Patience', description: 'Sang-froid +8 % par rang.', perRank: [pct('composure', 0.08)] },
  { slug: 'longue-haleine', name: 'Longue haleine', description: 'Plafond de la montée +15 % par rang.', perRank: [{ kind: 'ramp', perTick: 0, cap: 0.15 }] },
  { slug: 'tenace', name: 'Tenace', description: 'Sang-froid +10 % par rang.', perRank: [pct('composure', 0.1)] },
  { slug: 'marathonien', name: 'Marathonien', description: 'Plafond de la montée +20 % par rang.', perRank: [{ kind: 'ramp', perTick: 0, cap: 0.2 }] },
], { slug: 'sabot-sans-fin', name: 'Sabot sans fin', description: 'La montée en puissance n’a plus de plafond.', perRank: [{ kind: 'rampUncapped' }] },
  { slug: 'endurance-sans-fin', name: 'Endurance sans fin', description: 'Plafond de la montée +2 % par rang, sans limite.', perRank: [{ kind: 'ramp', perTick: 0, cap: 0.02 }] });

branch('counter', 'analyse', 'Analyse', 'Faire tomber les Boss.', [
  { slug: 'observation', name: 'Observation', description: 'Rafle +5 % par rang contre les Boss.', perRank: [{ kind: 'drain', on: 'boss', value: 0.05 }] },
  { slug: 'statistiques', name: 'Statistiques', description: 'Discrétion +6 % par rang.', perRank: [pct('stealth', 0.06)] },
  { slug: 'point-faible', name: 'Point faible', description: 'Rafle +7 % par rang contre les Boss.', perRank: [{ kind: 'drain', on: 'boss', value: 0.07 }] },
  { slug: 'froid-calcul', name: 'Froid calcul', description: 'Sang-froid +8 % par rang.', perRank: [pct('composure', 0.08)] },
  { slug: 'coup-de-grace', name: 'Coup de grâce', description: 'Rafle +10 % par rang contre les Boss.', perRank: [{ kind: 'drain', on: 'boss', value: 0.1 }] },
], { slug: 'carte-maitresse', name: 'Carte maîtresse', description: "Rafle ×2 sur la dernière moitié de la Caisse d'un Boss.", perRank: [{ kind: 'bossFinisher', threshold: 0.5, value: 1 }] },
  { slug: 'analyse-sans-fin', name: 'Analyse sans fin', description: 'Rafle +1 % contre les Boss par rang, sans limite.', perRank: [{ kind: 'drain', on: 'boss', value: 0.01 }] });

// ------------------------------- Pickpocket -------------------------------
branch('pickpocket', 'mains-or', "Mains d'or", "Des primes de fin d'Étage plus grosses.", [
  { slug: 'doigts-legers', name: 'Doigts légers', description: "Prime de fin d'Étage +6 % par rang.", perRank: [{ kind: 'floorBonus', value: 0.06 }] },
  { slug: 'tire-laine', name: 'Tire-laine', description: 'Flair +6 % par rang.', perRank: [pct('flair', 0.06)] },
  { slug: 'coffre-ouvert', name: 'Coffre ouvert', description: "Prime de fin d'Étage +8 % par rang.", perRank: [{ kind: 'floorBonus', value: 0.08 }] },
  { slug: 'ruee-vers-or', name: "Ruée vers l'or", description: 'Flair +8 % par rang.', perRank: [pct('flair', 0.08)] },
  { slug: 'grande-recolte', name: 'Grande récolte', description: "Prime de fin d'Étage +10 % par rang.", perRank: [{ kind: 'floorBonus', value: 0.1 }] },
], { slug: 'coup-du-siecle', name: 'Coup du siècle', description: "Prime de fin d'Étage doublée sur les Boss.", perRank: [{ kind: 'bossFloorBonus', value: 1 }] },
  { slug: 'mains-or-sans-fin', name: "Mains d'or sans fin", description: "Prime de fin d'Étage +1 % par rang, sans limite.", perRank: [{ kind: 'floorBonus', value: 0.01 }] });

branch('pickpocket', 'courant-air', "Courant d'air", "Travailler pendant ton absence.", [
  { slug: 'oiseau-de-nuit', name: 'Oiseau de nuit', description: 'Gains hors-ligne +8 % par rang.', perRank: [{ kind: 'offline', value: 0.08 }] },
  { slug: 'pas-feutres', name: 'Pas feutrés', description: 'Discrétion +8 % par rang.', perRank: [pct('stealth', 0.08)] },
  { slug: 'nuit-blanche', name: 'Nuit blanche', description: 'Gains hors-ligne +10 % par rang.', perRank: [{ kind: 'offline', value: 0.1 }] },
  { slug: 'ombre-portee', name: 'Ombre portée', description: 'Discrétion +10 % par rang.', perRank: [pct('stealth', 0.1)] },
  { slug: 'cambrioleur-de-nuit', name: 'Cambrioleur de nuit', description: 'Gains hors-ligne +12 % par rang.', perRank: [{ kind: 'offline', value: 0.12 }] },
], { slug: 'fantome-de-nuit', name: 'Fantôme de nuit', description: 'Gains et Réputation hors-ligne +100 %.', perRank: [{ kind: 'offline', value: 1 }] },
  { slug: 'nuits-sans-fin', name: 'Nuits sans fin', description: 'Gains hors-ligne +1 % par rang, sans limite.', perRank: [{ kind: 'offline', value: 0.01 }] });

branch('pickpocket', 'fouille', 'Fouille', 'Trouver des Jetons VIP.', [
  { slug: 'fond-de-poche', name: 'Fond de poche', description: 'Étage normal validé : +0,5 % de chances de trouver 1 Jeton VIP, par rang.', perRank: [{ kind: 'vipFind', chance: 0.005 }] },
  { slug: 'fouineur', name: 'Fouineur', description: 'Chance +2 % par rang.', perRank: [luck(2)] },
  { slug: 'doublure', name: 'Doublure', description: 'Étage normal validé : +0,7 % de chances de trouver 1 Jeton VIP, par rang.', perRank: [{ kind: 'vipFind', chance: 0.007 }] },
  { slug: 'coup-d-oeil', name: "Coup d'œil", description: 'Chance +3 % par rang.', perRank: [luck(3)] },
  { slug: 'tiroir-secret', name: 'Tiroir secret', description: 'Étage normal validé : +1 % de chances de trouver 1 Jeton VIP, par rang.', perRank: [{ kind: 'vipFind', chance: 0.01 }] },
], { slug: 'poches-profondes', name: 'Poches profondes', description: 'Étage normal validé : +5 % de chances de trouver 1 Jeton VIP.', perRank: [{ kind: 'vipFind', chance: 0.05 }] },
  { slug: 'fouille-sans-fin', name: 'Fouille sans fin', description: '+0,05 % de chances de Jeton VIP par rang, sans limite.', perRank: [{ kind: 'vipFind', chance: 0.0005 }] });

// ------------------------------- Saboteur -------------------------------
branch('saboteur', 'court-circuit', 'Court-circuit', 'Couper la sécurité.', [
  { slug: 'fusible', name: 'Fusible', description: 'Pression −2 % par rang.', perRank: [{ kind: 'pressure', value: -0.02 }] },
  { slug: 'cisailles', name: 'Cisailles', description: 'Sang-froid +8 % par rang.', perRank: [pct('composure', 0.08)] },
  { slug: 'derivation', name: 'Dérivation', description: 'Pression −3 % par rang.', perRank: [{ kind: 'pressure', value: -0.03 }] },
  { slug: 'isolant', name: 'Isolant', description: 'Sang-froid +10 % par rang.', perRank: [pct('composure', 0.1)] },
  { slug: 'surtension', name: 'Surtension', description: 'Pression −4 % par rang.', perRank: [{ kind: 'pressure', value: -0.04 }] },
], { slug: 'panne-generale', name: 'Panne générale', description: 'Pression −50 % pendant 5 secondes, toutes les 30 secondes.', perRank: [{ kind: 'blackout', every: 60, duration: 10, value: 0.5 }] },
  { slug: 'court-jus-sans-fin', name: 'Court-jus sans fin', description: 'Pression −0,25 % par rang, sans limite.', perRank: [{ kind: 'pressure', value: -0.0025 }] });

branch('saboteur', 'fantome', 'Fantôme', "Rendre l'Équipe invisible.", [
  { slug: 'passe-muraille', name: 'Passe-muraille', description: 'Discrétion +8 % par rang.', perRank: [pct('stealth', 0.08)] },
  { slug: 'brouillard', name: 'Brouillard', description: "Efficacité de la Discrétion de l'Équipe +4 % par rang.", perRank: [{ kind: 'stealthEfficiency', value: 0.04 }] },
  { slug: 'silhouette', name: 'Silhouette', description: 'Discrétion +10 % par rang.', perRank: [pct('stealth', 0.1)] },
  { slug: 'nappe-de-fumee', name: 'Nappe de fumée', description: "Efficacité de la Discrétion de l'Équipe +5 % par rang.", perRank: [{ kind: 'stealthEfficiency', value: 0.05 }] },
  { slug: 'evanescent', name: 'Évanescent', description: 'Discrétion +12 % par rang.', perRank: [pct('stealth', 0.12)] },
], { slug: 'invisible', name: 'Invisible', description: 'La sécurité rate une attaque sur cinq.', perRank: [{ kind: 'dodge', every: 5 }] },
  { slug: 'fantome-sans-fin', name: 'Fantôme sans fin', description: 'Efficacité de la Discrétion +0,5 % par rang, sans limite.', perRank: [{ kind: 'stealthEfficiency', value: 0.005 }] });

branch('saboteur', 'demolition', 'Démolition', 'Ouvrir les coffres des Boss.', [
  { slug: 'meche-lente', name: 'Mèche lente', description: 'Rafle +5 % par rang contre les Boss.', perRank: [{ kind: 'drain', on: 'boss', value: 0.05 }] },
  { slug: 'pied-de-biche', name: 'Pied-de-biche', description: 'Flair +6 % par rang.', perRank: [pct('flair', 0.06)] },
  { slug: 'charge-creuse', name: 'Charge creuse', description: 'Rafle +7 % par rang contre les Boss.', perRank: [{ kind: 'drain', on: 'boss', value: 0.07 }] },
  { slug: 'levier', name: 'Levier', description: 'Flair +8 % par rang.', perRank: [pct('flair', 0.08)] },
  { slug: 'detonateur', name: 'Détonateur', description: 'Rafle +10 % par rang contre les Boss.', perRank: [{ kind: 'drain', on: 'boss', value: 0.1 }] },
], { slug: 'dynamite', name: 'Dynamite', description: 'Les Boss démarrent avec 20 % de Caisse en moins.', perRank: [{ kind: 'bossVaultCut', value: 0.2 }] },
  { slug: 'demolition-sans-fin', name: 'Démolition sans fin', description: 'Rafle +1 % contre les Boss par rang, sans limite.', perRank: [{ kind: 'drain', on: 'boss', value: 0.01 }] });

export const TALENTS_BY_ID: ReadonlyMap<string, TalentDef> = new Map(TALENTS.map((talent) => [talent.id, talent]));
