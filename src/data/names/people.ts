// =====================================================================
// PRÉNOMS ET NOMS DE FAMILLE (voir docs/charte-des-noms.md)
//
// Un personnage tire une origine, puis un prénom ET un nom de la même
// origine (pas de « Kevin Castelli »).
// Pour ajouter un prénom ou un nom : ajoute-le entre guillemets dans la
// bonne liste, suivi d'une virgule. Pas de vraie personne célèbre.
// =====================================================================

export type Origin = 'fr' | 'it' | 'co' | 'en';

export interface OriginNames {
  label: string;
  /** Poids de tirage : plus il est grand, plus l'origine est fréquente. */
  weight: number;
  firstNames: { m: string[]; f: string[] };
  lastNames: string[];
}

export const PEOPLE: Record<Origin, OriginNames> = {
  fr: {
    label: 'française',
    weight: 4,
    firstNames: {
      m: ['Lucien', 'Raymond', 'Marcel', 'Gaston', 'Roger', 'Henri', 'Fernand', 'Émile', 'Jacques', 'Maurice', 'Albert', 'Léon', 'René', 'Edmond', 'Gilbert'],
      f: ['Mireille', 'Odette', 'Simone', 'Paulette', 'Edith', 'Josette', 'Lucienne', 'Yvette', 'Colette', 'Madeleine', 'Suzanne', 'Ginette', 'Hélène', 'Solange', 'Arlette'],
    },
    lastNames: ['Ferrand', 'Delorme', 'Barral', 'Marchal', 'Valmont', 'Chabert', 'Roux', 'Béchard', 'Lambert', 'Dufresne', 'Garnier', 'Moreau', 'Vasseur', 'Peyrac', 'Ribaud', 'Fontaine', 'Lacombe', 'Mercier', 'Delmas', 'Joubert', 'Carrel', 'Morel', 'Brissac', 'Lancelin', 'Delacroix'],
  },
  it: {
    label: 'italienne',
    weight: 3,
    firstNames: {
      m: ['Marco', 'Bruno', 'Vittorio', 'Salvatore', 'Enzo', 'Carlo', 'Luigi', 'Franco', 'Aldo', 'Gino', 'Rocco', 'Sergio', 'Dario', 'Massimo', 'Tullio'],
      f: ['Giulia', 'Carla', 'Lucia', 'Rosa', 'Gina', 'Sofia', 'Paola', 'Nella', 'Teresa', 'Silvana', 'Franca', 'Livia', 'Marisa', 'Ornella', 'Bianca'],
    },
    lastNames: ['Moretti', 'Castelli', 'Rinaldi', 'Ferrandi', 'Marchetti', 'Bellini', 'Santoro', 'Galli', 'Lombardi', 'Ricci', 'Bianchi', 'Conti', 'Esposito', 'Russo', 'Greco', 'Mancini', 'Vitale', 'Serra', 'Fabbri', 'Gentile', 'Caruso', 'Orlando', 'Valenti', 'Pellegrini', 'Donati'],
  },
  co: {
    label: 'corse',
    weight: 2,
    firstNames: {
      m: ['Ange', 'Toussaint', 'Dominique', 'Orsu', 'Santu', 'Petru', 'Ghjuvanni', 'Matteu', 'Antoine', 'Pascal', 'Xavier', 'Battistu', 'Lisandru', 'Ghjacumu', 'Paulu'],
      f: ['Marie-Ange', 'Letizia', 'Catalina', 'Dumenica', 'Ghjulia', 'Maria', 'Anghjula', 'Francesca', 'Lisa', 'Ursula', 'Saveria', 'Nunziata', 'Vannina', 'Maddalena', 'Agnese'],
    },
    lastNames: ['Santoni', 'Paoli', 'Leca', 'Casanova', 'Mondoloni', 'Pietri', 'Luciani', 'Mattei', 'Filippi', 'Giacomoni', 'Antonetti', 'Peretti', 'Susini', 'Albertini', 'Ceccaldi', 'Poli', 'Orsini', 'Battesti', 'Cristofari', 'Guidicelli', 'Rocca', 'Santucci', 'Tomasi', 'Versini', 'Agostini'],
  },
  en: {
    label: 'anglaise',
    weight: 2,
    firstNames: {
      m: ['Alistair', 'Frank', 'Harold', 'Reginald', 'Archie', 'Clive', 'Douglas', 'Edgar', 'Rupert', 'Nigel', 'Bertie', 'Lionel', 'Cecil', 'Wallace', 'Monty'],
      f: ['Margaret', 'Ivy', 'Daisy', 'Evelyn', 'Vivian', 'Rosalind', 'Beatrice', 'Mabel', 'Hazel', 'Winifred', 'Pearl', 'Doris', 'Agatha', 'Lillian', 'Ruby'],
    },
    lastNames: ['Doyle', 'Hartley', 'Whitmore', 'Ashford', 'Blackwood', 'Carrington', 'Pemberton', 'Thornton', 'Sinclair', 'Fairfax', 'Harrington', 'Kendall', 'Lockwood', 'Mercer', 'Prescott', 'Radcliffe', 'Sterling', 'Thorne', 'Waverly', 'Hollis', 'Crane', 'Langley', 'Quincy', 'Royce', 'Ashby'],
  },
};
