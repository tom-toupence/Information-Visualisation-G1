# Information-Visualisation-G1

Un projet de visualisation d'informations utilisant D3.js avec Node.js et TypeScript.

## Installation

1. Clonez le repository
2. Installez les dépendances :
   ```bash
   npm install
   ```

## Scripts disponibles

- `npm run build` : Compile le TypeScript en JavaScript
- `npm run dev` : Exécute le code TypeScript directement avec ts-node
- `npm run start` : Exécute le code JavaScript compilé
- `npm run serve` : Lance un serveur HTTP pour visualiser l'application
- `npm run watch` : Compile TypeScript en mode watch

## Comment utiliser

1. Installez les dépendances : `npm install`
2. Compilez le TypeScript : `npm run build`
3. Lancez le serveur : `npm run serve`
4. Ouvrez votre navigateur à l'adresse affichée (généralement http://localhost:3000)

## Structure du projet

```
├── src/
│   └── index.ts          # Code TypeScript principal
├── public/
│   └── index.html        # Interface utilisateur
├── dist/                 # Code JavaScript compilé
├── package.json          # Configuration npm
├── tsconfig.json         # Configuration TypeScript
└── README.md            # Ce fichier
```

## Fonctionnalités

- Graphique en barres interactif créé avec D3.js
- Code TypeScript pour une meilleure maintenabilité
- Interface avec boutons pour mettre à jour les données
- Serveur de développement intégré

## Dépendances

- **D3.js v7** : Bibliothèque de visualisation de données
- **TypeScript** : Superset typé de JavaScript
- **http-server** : Serveur HTTP simple pour le développement