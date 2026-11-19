# Casinos et Boss générés de façon déterministe à partir du numéro d'Étage

Les Casinos au-delà de l'Étage 30 (nom, ambiance, Boss) ne sont jamais enregistrés dans la sauvegarde : ils sont recalculés à partir du numéro d'Étage avec un générateur pseudo-aléatoire initialisé par ce numéro.
Ainsi la sauvegarde reste minuscule quel que soit l'Étage atteint, tous les joueurs voient le même Casino au même Étage, et un Blanchiment retrouve exactement les mêmes Casinos.
Conséquence : modifier un dictionnaire de noms peut renommer des Casinos existants ; c'est accepté, car les noms sont purement décoratifs. Les Candidats du Bureau de recrutement, eux, sont tirés au hasard puis enregistrés.
