# Information-Visualisation-G1

Un projet de visualisation d'informations utilisant D3.js avec Node.js et TypeScript.
Comprend un dashboard interactif de données Spotify avec une **heatmap de popularité des artistes**.

## 🚀 Installation

1. Clonez le repository
2. Installez les dépendances :
   ```bash
   npm install
   ```

## 📜 Scripts disponibles

- `npm run build` : Compile le TypeScript en JavaScript
- `npm run dev` : Exécute le code TypeScript directement avec ts-node
- `npm run start` : Exécute le code JavaScript compilé
- `npm run serve` : Lance un serveur HTTP pour visualiser l'application
- `npm run watch` : Compile TypeScript en mode watch

## 🎯 Comment utiliser

1. Installez les dépendances : `npm install`
2. Compilez le TypeScript : `npm run build`
3. Lancez le serveur : `npm run serve`
4. Ouvrez votre navigateur à l'adresse affichée (généralement http://localhost:3000)

## 📁 Structure du projet

```
├── src/
│   ├── index.ts              # Point d'entrée principal
│   ├── charts/
│   │   ├── BaseChart.ts      # Classe de base pour les graphiques
│   │   └── HeatmapChart.ts   # ✨ Graphique heatmap D3.js
│   ├── processor/
│   │   └── HeatmapProcessor.ts # ✨ Traitement des données pour heatmap
│   ├── dashboard/
│   │   └── Dashboard.ts      # Dashboard principal
│   ├── data/
│   │   └── DataLoader.ts     # Chargement des données CSV
│   ├── types/
│   │   └── index.ts         # Interfaces TypeScript
│   ├── utils/
│   │   └── index.ts         # Utilitaires
│   └── tests/
│       └── heatmap.test.ts  # ✨ Tests unitaires de la heatmap
├── public/
│   ├── index.html           # Page principale du dashboard
│   ├── pages/
│   │   └── heatmap.html     # ✨ Page de la heatmap
│   ├── style.css            # Styles globaux
│   ├── spotify_data.csv     # Données Spotify
│   └── dashboard-browser.js # Code compilé pour le navigateur
├── dist/                    # Code JavaScript compilé
├── package.json             # Configuration npm
├── tsconfig.json            # Configuration TypeScript
├── HEATMAP_README.md        # ✨ Documentation de la heatmap
├── USAGE_GUIDE.md           # ✨ Guide d'utilisation des classes
├── SUMMARY.md               # ✨ Résumé du projet
└── README.md                # Ce fichier
```

## ✨ Fonctionnalités

### Dashboard principal
- Interface moderne avec sidebar de navigation
- Filtrage par genre musical
- Graphiques interactifs D3.js
- Design responsive avec thème sombre

### 🎵 Heatmap de popularité (Nouveau !)
- **Visualisation** : Popularité des artistes par année (2000-2023)
- **Échelle de couleurs** : Du bleu (faible) au rouge (très populaire)
- **Rangs de popularité** : 0 à 4 selon la chanson la plus populaire
- **Interactions** :
  - Hover → Tooltip avec détails
  - Clic → Modal avec top 5 des chansons
  - Filtre par genre
  - Zoom et pan
- **Optimisations** : Affichage des 30 artistes les plus populaires

### Traitement des données
- Agrégation par artiste et année
- Calcul automatique des rangs de popularité
- Top 5 des chansons les plus populaires
- Statistiques et analyses

## 📊 Colonnes de données

### Données sources (CSV)
- `artist_name` : Nom de l'artiste
- `track_name` : Nom de la chanson
- `track_id` : ID unique Spotify
- `popularity` : Score 0-100
- `year` : Année de sortie
- `genre` : Genre musical
- + autres attributs audio

### Colonnes calculées (Heatmap)
- `popular_songs` : Top 5 des chansons
- `rank` : Rang de popularité (0-4)
- `avg_popularity` : Popularité moyenne
- `track_count` : Nombre de chansons

## 🎨 Utilisation de la heatmap

### Accès
- Dashboard → Cliquer sur "Graph 1"
- Ou directement : `http://localhost:3000/pages/heatmap.html`

### Utilisation programmatique

```typescript
import { DataLoader } from './data/DataLoader';
import { HeatmapProcessor } from './processor/HeatmapProcessor';
import { HeatmapChart } from './charts/HeatmapChart';

// Charger et traiter les données
const loader = DataLoader.getInstance();
const tracks = await loader.loadSpotifyData();
const heatmapData = HeatmapProcessor.processHeatmapData(tracks);

// Créer et afficher la heatmap
const chart = new HeatmapChart('container-id');
chart.setData(heatmapData).render();
```

Voir `USAGE_GUIDE.md` pour plus de détails.

## 🧪 Tests

Exécuter les tests unitaires :
```bash
npm run dev src/tests/heatmap.test.ts
```

## 📚 Documentation

- **HEATMAP_README.md** : Documentation complète de la heatmap
- **USAGE_GUIDE.md** : Guide d'utilisation des classes
- **SUMMARY.md** : Résumé du projet et fonctionnalités

## 🔧 Technologies

- **D3.js v7** : Bibliothèque de visualisation de données
- **TypeScript** : Superset typé de JavaScript
- **http-server** : Serveur HTTP simple pour le développement
- **CSS Variables** : Thème cohérent et personnalisable

## 🎯 Objectifs du projet

Identifier les artistes les plus populaires selon chaque période afin de concevoir des sets musicaux cohérents et représentatifs de chaque époque.

## 📝 Licence

MIT