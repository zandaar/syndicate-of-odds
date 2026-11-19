# Grands nombres avec break_eternity.js dans tout le moteur

Les Étages sont infinis et la Caisse croît de façon exponentielle : le `number` de JavaScript plafonne vers 1e308, atteint après quelques milliers d'Étages.
Toutes les valeurs économiques du moteur (Cash, Caisse, Pression, Rafle, coûts, Influence) utilisent donc dès la V1 le type `Decimal` de `break_eternity.js`, et la sauvegarde les stocke en texte.
Le choix est fait tout de suite parce que remplacer `number` plus tard obligerait à réécrire chaque formule et à migrer chaque sauvegarde ; les stats des Joueurs au niveau 1, les pourcentages et les compteurs restent en `number`.
