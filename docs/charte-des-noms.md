# Charte des noms — Syndicate of Odds

Ce document fixe les règles que **tous** les noms du jeu respectent : Joueurs, Boss, Casinos, Traits, Gadgets, Succès.
Les dictionnaires vivent dans `src/data/names/` ; chaque générateur suit les modèles décrits ici.
Si un nom te paraît « faux », c'est soit une règle à préciser ici, soit un mot à retirer d'un dictionnaire.

## 1. L'univers

**Port-Sauvage**, une ville côtière imaginaire de la Riviera, entre la fin des années 60 et le milieu des années 70.
Palaces dorés sur la Corniche, tripots enfumés sur les Quais, film noir, smokings et lunettes fumées.
La ville est cosmopolite : on y croise des familles françaises, italiennes, corses et anglo-saxonnes.

## 2. Règles communes (s'appliquent à tout)

1. **Langue** : tout est en français. Seuls les noms propres (prénoms, noms de famille, certains lieux) peuvent être italiens, corses ou anglais.
2. **Époque** : le vocabulaire courant reste crédible pour les années 60-70 (téléphone à cadran, oreillette, magnétophone… pas de « Wi-Fi » ni de « hacker »).
3. **Ton** : sombre, élégant, avec une pointe d'ironie. Pas d'humour lourd ni de vulgarité.
4. **Longueur** : 28 caractères maximum pour un Joueur ou un Boss, 32 pour un Casino, 24 pour un Gadget ou un Trait.
5. **Unicité** : jamais deux Joueurs du roster avec le même nom.
6. **Accords** : chaque mot qui s'accorde existe au masculin et au féminin ; chaque nom commun connaît son genre (pour « Le / La / L' » et « du / de la / de l' »).
7. **Cohérence d'origine** : le prénom et le nom de famille d'un même personnage ont la même origine.

## 3. Les Clins d'œil (exceptions volontaires)

Un **Clin d'œil** est un nom qui sort exprès de l'univers : jeu de mots sur une chose réelle, anachronisme, référence à la pop culture ou à la politique.
Ils sont bienvenus, **à condition de rester rares**, pour que chacun soit une petite surprise.

**Où ils peuvent apparaître :**

| Source | Fréquence |
|---|---|
| Légendaires uniques (liste écrite à la main) | une partie de la liste, assumée |
| Surnoms de Joueurs Épiques | environ 1 tirage sur 50 |
| Surnoms de Joueurs Rares | environ 1 tirage sur 200 |
| Casinos générés | environ 1 Casino sur 100 |
| Événements datés (1er avril, Halloween, Noël…) | dictionnaires spéciaux, seulement pendant l'événement |
| Joueurs Communs, Traits, Gadgets de base | jamais |

**Ce qui est permis :** arnaqueurs et escrocs célèbres, faussaires, voleurs de légende, satire politique bon enfant, détournements de films, de marques ou de célébrités sous forme de jeu de mots.

**Ce qui est interdit, sans exception :**

- crimes sexuels et leurs auteurs ;
- terrorisme, attentats, génocides et leurs auteurs ;
- tueurs en série, meurtres réels ;
- racisme, insultes visant un groupe, moqueries sur un handicap ;
- drogues dures présentées positivement ;
- personnes privées réelles (seuls les personnages publics et historiques peuvent être détournés, et seulement par un jeu de mots, jamais par une accusation).

Règle d'or : un Clin d'œil doit faire sourire n'importe quel joueur, jamais le mettre mal à l'aise.

**L'exemple de référence** : **Marco « La Moula » Moula**, Légendaire, détournement d'un arnaqueur célèbre de la fraude à la taxe carbone (Marco Mouly) avec « moula », l'argent en argot. C'est le bon niveau : un escroc réel, reconnaissable, transformé par un jeu de mots, sans accusation ni méchanceté.

## 4. Les modèles

### 4.1 Joueurs

| Rareté | Modèle | Exemple |
|---|---|---|
| Commun | `Prénom Nom` | Lucien Ferrand |
| Rare | `Prénom « Surnom de Classe » Nom` | Lucien « Le Renard » Ferrand |
| Épique | `Prénom « Surnom rare de Classe » Nom` | Lucia « Doigts-d'Or » Ferrandi |
| Légendaire | `« Surnom unique » Nom` | « La Comtesse » Valmont |

- Dictionnaires : `Prénoms` (par origine et par genre), `Noms` (par origine), `Surnoms` (par Classe et par rareté, avec masculin et féminin), `Légendaires` (liste fermée écrite à la main).
- Il y a autant de femmes que d'hommes.

### 4.2 Boss

`« Titre » — Prénom Nom`, par exemple « Le Videur » — Bruno Castelli.
Les Titres montent en grade avec la profondeur : Videur, Chef de salle, Patron, Directeur, Baron, Parrain…
Le même Étage donne toujours le même Boss.

### 4.3 Casinos

Le type d'établissement monte en prestige avec la profondeur :

| Étages | Types |
|---|---|
| 1 à 100 | Tripot, Arrière-salle, Cercle |
| 100 à 500 | Club, Casino |
| 500 et plus | Palace, Grand Casino, puis des noms quasi mythiques |

Modèles (tirés au hasard, mais toujours le même pour un même Étage) :

- `Type + du/de la + Lieu` : Le Tripot des Quais
- `Type + du/de la + Emblème + Couleur` : Le Casino du Lotus Pourpre
- `Le/La + Emblème + Couleur` : La Comète d'Ivoire

Dictionnaires : `Types` (classés par prestige), `Emblèmes` (avec genre), `Couleurs et matières` (accordées), `Lieux de Port-Sauvage`.

Les trois premiers Casinos sont écrits à la main : **Le Tripot des Docks**, **Le Mirage Doré**, **Le Palace Impérial**.
