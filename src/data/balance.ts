// =====================================================================
// ÉQUILIBRAGE — toutes les constantes chiffrées du jeu.
//
// Tu peux modifier ces nombres librement. Après chaque changement, lance
//   npm test
// Le simulateur d'équilibrage vérifiera que le rythme du jeu reste bon
// (premier Blanchiment en 1 à 2 jours). S'il échoue, il affiche le temps
// réellement obtenu pour t'aider à corriger.
//
// Les « growth » sont des multiplicateurs par Étage ou par niveau :
// 1,25 veut dire +25 % à chaque Étage.
// =====================================================================

export const BALANCE = {
  /** Durée d'un tick de combat, en secondes. */
  tickSeconds: 0.5,
  /** Ticks de repli après une Couverture grillée (6 ticks = 3 secondes). */
  retreatTicks: 6,
  /** Plafond des gains hors-ligne, en secondes (12 heures). */
  offlineCapSeconds: 12 * 3600,

  floorsPerCasino: 10,
  bossEvery: 5,

  /** Caisse d'un Étage : base × growth^(Étage − 1), × bossMult sur un Boss. */
  vault: { base: 60, growth: 1.1, bossMult: 3 },
  /** Pression par tick : base × growth^(Étage − 1), × bossMult sur un Boss. */
  pressure: { base: 4, growth: 1.094, bossMult: 1.8 },
  /** Échelle de la Discrétion : grandit avec les Étages pour éviter l'immunité. */
  stealthScale: { base: 50, growth: 1.094 },

  /** Prime de fin d'Étage, en part de la Caisse (0,3 = 30 %). */
  floorBonusRatio: 0.3,

  /** Jackpot : drain ×baseMult ; chance de Jackpot plafonnée. */
  jackpot: { baseMult: 2, maxChance: 0.75 },

  /** Niveaux : stats ×statGrowth par niveau ; coût = costBase × costGrowth^(niveau − 1). */
  level: { statGrowth: 1.08, costGrowth: 1.2, costBase: 1500 },

  /** Recrutement : base × multiplicateur de Rareté × floorGrowth^(Étage le plus haut). */
  recruit: { base: 50, floorGrowth: 1.15 },

  /** Jetons VIP d'un Boss : base × growth^(numéro du Boss − 1), arrondi. */
  vip: { base: 2, growth: 1.15 },

  /** Étage à battre pour débloquer la 2e Équipe. */
  secondTeamFloor: 10,
  /** Joueurs maximum par Équipe. */
  teamSize: 3,
} as const;

/** Effets de la Rareté. */
export const RARITY = {
  common: { stats: 1, levelCost: 1, recruitCost: 1, traits: 1, weight: 70 },
  rare: { stats: 1.25, levelCost: 1.5, recruitCost: 4, traits: 1, weight: 24 },
  epic: { stats: 1.6, levelCost: 2.5, recruitCost: 15, traits: 2, weight: 5 },
  legendary: { stats: 2.2, levelCost: 4, recruitCost: 60, traits: 2, weight: 1 },
} as const;
