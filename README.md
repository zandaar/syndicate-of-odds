# Syndicate of Odds

Idle-RPG dans les casinos de Port-Sauvage : recrute un syndicat de joueurs professionnels et vide les Caisses d'Étages toujours plus difficiles.

- Ce que fait le jeu : [docs/spec-v1.md](docs/spec-v1.md)
- Le vocabulaire : [GLOSSARY.md](GLOSSARY.md)
- Les règles des noms : [docs/charte-des-noms.md](docs/charte-des-noms.md)

## Lancer le jeu sur ton PC

Dans un terminal ouvert dans ce dossier :

```powershell
npm install
npm run dev
```

Puis ouvre l'adresse affichée (souvent http://localhost:5173).

## Autres commandes

| Commande | À quoi elle sert |
|---|---|
| `npm test` | Lance les tests automatiques du moteur |
| `npm run build` | Vérifie le code et fabrique la version en ligne dans `dist/` |

## Mettre en ligne

Chaque envoi sur la branche `main` de GitHub met le jeu en ligne automatiquement (voir `.github/workflows/deploy.yml`).
